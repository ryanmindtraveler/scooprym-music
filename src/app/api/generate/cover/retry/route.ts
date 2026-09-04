import { dataUrlToImageBuffer, generateCoverWithRetry } from '@/ai/image/lib/cover-generation';
import { getDb } from '@/db/index';
import { generationAttempt, song as songTable, story as storyTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSession } from '@/lib/server';
import {
  completeWorkflowStage,
  failWorkflowStep,
  getWorkflowRunBySongId,
  startWorkflowStage,
} from '@/lib/song-creation-workflow';
import { readImageDimensions } from '@/lib/song-product-check';
import { runPersistedSongProductCheck } from '@/lib/song-workflow';
import { deleteFile, uploadFile } from '@/storage';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
        prompt: latestAttempt.prompt,
        processingStatus: latestAttempt.processingStatus,
      })
      .from(songTable)
      .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(songTable.id, songId), eq(songTable.userId, userId)))
      .limit(1);

    if (!song) {
      return NextResponse.json({ success: false, error: 'Song not found or unauthorized' }, { status: 404 });
    }
    if (
      [
        'queued',
        'processing',
        'generating_audio',
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

    // 4. Generate New Cover
    // 封面首先表现新闻故事；音乐风格只作为没有来源正文时的降级上下文。
    const coverImageUrl = await generateCoverWithRetry({
      title: song.title || 'Untitled Track',
      lyrics: song.lyrics || '',
      sourceText: song.sourceText?.trim() || song.newsSummary?.trim() || song.prompt?.trim() || '',
    });

    if (!coverImageUrl) {
      throw new Error('Failed to generate cover image');
    }

    // 5. Upload to Storage
    const { buffer, mime, extension } = await dataUrlToImageBuffer(coverImageUrl);
    const coverDimensions = readImageDimensions(buffer, mime);
    const uploadResult = await uploadFile(
      buffer,
      `song-cover-retry-${Date.now()}.${extension}`,
      mime,
      `song-covers/${userId}`
    );

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
          eq(songTable.userId, userId),
          expectedCoverKey,
          sql`not exists (
            select 1
            from ${generationAttempt}
            where ${generationAttempt.songId} = ${songTable.id}
              and ${generationAttempt.processingStatus} in (
                'queued',
                'processing',
                'generating_audio',
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
      await deleteFile(uploadResult.key).catch((error) => {
        console.error('[Cover Retry] Failed to remove unclaimed upload:', error);
      });
      if (workflowStep) {
        await failWorkflowStep(workflowStep.runId, workflowStep.stepId, 'Song changed while the cover was generating');
        workflowStep = undefined;
      }
      return NextResponse.json({ success: false, error: 'Song no longer exists' }, { status: 409 });
    }

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
      userId,
      coverDimensions,
    });

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
    return NextResponse.json({ success: false, error: 'Failed to regenerate cover image' }, { status: 500 });
  }
}
