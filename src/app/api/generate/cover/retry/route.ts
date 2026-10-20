import { getDb } from '@/db/index';
import { generationAttempt, song as songTable, story as storyTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSession } from '@/lib/auth/server';
import { prepareCoverAsset } from '@/lib/creation/cover-asset';
import {
  completeWorkflowStage,
  failWorkflowStep,
  getWorkflowRunBySongId,
  startWorkflowStage,
} from '@/lib/creation/song-creation-workflow';
import { runPersistedSongProductCheck } from '@/lib/creation/song-workflow';
import { revalidatePublicSongs } from '@/lib/songs/revalidate-public-songs';
import { Routes } from '@/routes';
import { deleteFile } from '@/storage';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const maxDuration = 300;

const retryCoverSchema = z.object({
  songId: z.string().uuid(),
});

/**
 * POST /api/generate/cover/retry
 * Allows users to manually regenerate a failed cover image.
 */
export async function POST(req: NextRequest) {
  let workflowStep: { runId: string; stepId: string } | undefined;
  try {
    // 1. Auth Check
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 2. Input Validation
    const parsedBody = retryCoverSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ success: false, error: 'Invalid song ID' }, { status: 400 });
    }
    const { songId } = parsedBody.data;

    const db = await getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);

    // 3. Verify Ownership & Get Song Data
    const [song] = await db
      .select({
        id: songTable.id,
        userId: songTable.userId,
        title: songTable.title,
        lyrics: songTable.lyrics,
        coverImageKey: songTable.coverImageKey,
        sourceText: storyTable.sourceText,
        newsSummary: storyTable.newsSummary,
        coverArtPrompt: latestAttempt.coverArtPrompt,
        processingStatus: latestAttempt.processingStatus,
      })
      .from(songTable)
      .leftJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .leftJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        session.user.role === 'admin'
          ? eq(songTable.id, songId)
          : and(eq(songTable.id, songId), eq(songTable.userId, userId))
      )
      .limit(1);

    if (!song) {
      return NextResponse.json({ success: false, error: 'Song not found or unauthorized' }, { status: 404 });
    }
    if (
      [
        'queued',
        'processing',
        'generating_audio',
        'audio_generated',
        'uploading_audio',
        'audio_uploaded',
        'generating_cover',
        'finalizing',
      ].includes(song.processingStatus || '')
    ) {
      return NextResponse.json(
        { success: false, error: 'Cover art cannot be replaced while the song is still processing' },
        { status: 409 }
      );
    }

    const workflowRun = await getWorkflowRunBySongId(songId);
    if (workflowRun) {
      workflowStep = {
        runId: workflowRun.id,
        stepId: await startWorkflowStage(workflowRun.id, 'generating_cover', {
          provider: 'openrouter',
        }),
      };
    }

    // 首次生成和手动恢复共用恢复点，上传失败时重用已有图片。
    const uploadResult = await prepareCoverAsset({
      songId,
      userId,
      title: song.title || 'Untitled Track',
      lyrics: song.lyrics || '',
      sourceText: song.sourceText?.trim() || song.newsSummary?.trim() || song.title || 'Untitled Track',
      artPrompt: song.coverArtPrompt || undefined,
      previousCoverKey: song.coverImageKey,
    });
    const coverDimensions = uploadResult.dimensions;

    // 6. Update Database
    const expectedCoverKey = song.coverImageKey
      ? eq(songTable.coverImageKey, song.coverImageKey)
      : isNull(songTable.coverImageKey);
    const updatedRows = await db
      .update(songTable)
      .set({
        coverImageUrl: uploadResult.url,
        coverImageKey: uploadResult.key,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(songTable.id, songId),
          session.user.role === 'admin' ? sql`true` : eq(songTable.userId, userId),
          expectedCoverKey,
          sql`not exists (
            select 1
            from ${generationAttempt}
            where ${generationAttempt.songId} = ${songTable.id}
              and ${generationAttempt.processingStatus} in (
                'queued',
                'processing',
                'generating_audio',
                'audio_generated',
                'uploading_audio',
                'audio_uploaded',
                'generating_cover',
                'finalizing'
              )
          )`
        )
      )
      .returning({ id: songTable.id });

    if (updatedRows.length === 0) {
      // 固定对象可能已被并发恢复引用，冲突时不能删除共享恢复资产。
      if (workflowStep) {
        await failWorkflowStep(workflowStep.runId, workflowStep.stepId, 'Song changed while the cover was generating');
        workflowStep = undefined;
      }
      return NextResponse.json(
        { success: false, error: 'Song changed while the cover was being restored. Refresh and try again.' },
        { status: 409 }
      );
    }

    // 如果此前处于 failed_cover 状态，更新为 completed
    await db
      .update(generationAttempt)
      .set({
        processingStatus: 'completed',
        processingError: null,
        updatedAt: new Date(),
      })
      .where(and(eq(generationAttempt.songId, songId), eq(generationAttempt.processingStatus, 'failed_cover')));

    if (song.coverImageKey && song.coverImageKey !== uploadResult.key) {
      await deleteFile(song.coverImageKey).catch((error) => {
        console.error('[Cover Retry] Failed to remove previous cover:', error);
      });
    }
    if (workflowStep) {
      await completeWorkflowStage(workflowStep.runId, workflowStep.stepId, 'generating_cover', {
        nextStage: 'checking_product',
        metadata: { storageKey: uploadResult.key, coverDimensions },
      });
      workflowStep = undefined;
    }
    const productCheck = await runPersistedSongProductCheck({
      songId,
      userId: song.userId,
      coverDimensions,
    });

    revalidatePath(Routes.AdminSongs);
    revalidatePath(Routes.Dashboard);
    revalidatePublicSongs();

    return NextResponse.json({
      success: true,
      coverImageUrl: uploadResult.url,
      productCheck,
    });
  } catch (error: any) {
    console.error('[Cover Retry] Error:', error);
    if (workflowStep) {
      await failWorkflowStep(workflowStep.runId, workflowStep.stepId, error).catch((persistenceError) => {
        console.error('[Cover Retry] Failed to persist workflow error:', persistenceError);
      });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to restore cover image' },
      { status: 500 }
    );
  }
}
