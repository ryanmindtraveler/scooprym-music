import { getDb } from '@/db/index';
import { songCreationRun, song as songTable, story as storyTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { buildStoryBrief } from '@/features/full-songs/services/full-songs-helpers';
import { getSession } from '@/lib/auth/server';
import { resolveProductionRetryStage } from '@/lib/creation/music-retry-policy';
import { getSongCreationPhase } from '@/lib/creation/song-creation-workflow';
import { getSongSourceCompatFields, getSongSourceSummary } from '@/lib/songs/song-source';
import { getSongStatusPresentation } from '@/lib/songs/song-status';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const songIdSchema = z.string().uuid();

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await props.params;
    const parsedId = songIdSchema.safeParse(rawId);
    if (!parsedId.success) {
      return NextResponse.json({ success: false, error: 'Invalid song ID' }, { status: 400 });
    }

    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const [selectedSong] = await db
      .select({
        id: songTable.id,
        attemptId: latestAttempt.id,
        userId: songTable.userId,
        title: songTable.title,
        audioUrl: songTable.audioUrl,
        audioKey: songTable.audioKey,
        coverImageUrl: songTable.coverImageUrl,
        coverImageKey: songTable.coverImageKey,
        createdAt: songTable.createdAt,
        updatedAt: latestAttempt.updatedAt,
        creditsDeducted: latestAttempt.creditsDeducted,
        processingStatus: latestAttempt.processingStatus,
        processingError: latestAttempt.processingError,
        creditError: latestAttempt.creditError,
        sourceSummary: storyTable.newsSummary,
        newsSummary: storyTable.newsSummary,
        sourceText: storyTable.sourceText,
        sourceUrl: storyTable.sourceUrl,
      })
      .from(songTable)
      .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(songTable.id, parsedId.data), eq(songTable.userId, userId)))
      .limit(1);

    if (!selectedSong) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    // 状态读取不再修改任务；独立巡检负责识别中断和安全接续。
    const currentSong = selectedSong;
    const minutesSinceCreation = (Date.now() - new Date(currentSong.createdAt).getTime()) / 60_000;
    const minutesSinceLastProgress =
      (Date.now() - new Date(currentSong.updatedAt || currentSong.createdAt).getTime()) / 60_000;

    const sourceSummary = getSongSourceSummary(currentSong) || '';
    const presentation = getSongStatusPresentation({
      processingStatus: currentSong.processingStatus,
      hasAudioKey: !!currentSong.audioKey,
      hasCoverImageUrl: !!currentSong.coverImageUrl,
    });
    const processingError = currentSong.processingError || currentSong.creditError || null;
    const [workflow] = await db
      .select({
        id: songCreationRun.id,
        status: songCreationRun.status,
        currentStage: songCreationRun.currentStage,
        lastError: songCreationRun.lastError,
      })
      .from(songCreationRun)
      .where(and(eq(songCreationRun.songId, currentSong.id), eq(songCreationRun.userId, userId)))
      .orderBy(desc(songCreationRun.createdAt))
      .limit(1);

    return NextResponse.json({
      success: true,
      ...presentation,
      creditsDeducted: currentSong.creditsDeducted || false,
      processingError,
      // 兼容旧版客户端字段；管理员内部任务不再进行积分扣费。
      creditError: processingError,
      song: {
        id: currentSong.id,
        title: currentSong.title,
        audioUrl: currentSong.audioUrl,
        coverImageUrl: currentSong.coverImageUrl,
        createdAt: currentSong.createdAt,
        updatedAt: currentSong.updatedAt,
        ...getSongSourceCompatFields(currentSong),
        storyBrief: buildStoryBrief(sourceSummary, ''),
      },
      details: {
        hasAudioKey: !!currentSong.audioKey,
        hasCoverImageUrl: !!currentSong.coverImageUrl,
        hasCoverImageKey: !!currentSong.coverImageKey,
        processingStatus: currentSong.processingStatus || 'queued',
        minutesSinceCreation: Math.round(minutesSinceCreation * 10) / 10,
        minutesSinceLastProgress: Math.round(minutesSinceLastProgress * 10) / 10,
      },
      workflow: workflow
        ? {
            ...workflow,
            retryableStage: resolveProductionRetryStage(
              currentSong.processingStatus,
              workflow.currentStage,
              !!currentSong.audioKey && !!currentSong.audioUrl,
              !!currentSong.coverImageKey && !!currentSong.coverImageUrl
            ),
            phase: getSongCreationPhase(workflow.currentStage),
          }
        : null,
    });
  } catch (error) {
    console.error('[processing-status] Failed to load generation status:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch processing status' }, { status: 500 });
  }
}
