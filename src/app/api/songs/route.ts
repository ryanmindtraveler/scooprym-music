import { getDb } from '@/db/index';
import { song, songCreationRun, story } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSession } from '@/lib/auth/server';
import { resolveProductionRetryStage } from '@/lib/creation/music-retry-policy';
import { getSongCreationPhase } from '@/lib/creation/song-creation-workflow';
import { getSongSourceCompatFields } from '@/lib/songs/song-source';
import { SONG_FAILURE_PROCESSING_STATUSES } from '@/lib/songs/song-status';
import { and, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '9') || 9));
    const offset = (page - 1) * limit;

    const db = await getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    // 仅管理员工作台可恢复失败任务；普通歌曲列表维持原有过滤行为。
    const includeProcessing = session.user.role === 'admin' && searchParams.get('includeProcessing') === 'true';
    const filter = and(
      eq(song.userId, userId),
      includeProcessing ? undefined : notInArray(latestAttempt.processingStatus, SONG_FAILURE_PROCESSING_STATUSES)
    );

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(song)
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(filter);
    const total = Number(totalRes?.count || 0);

    const rows = await db
      .select({
        song,
        story,
        prompt: latestAttempt.prompt,
        processingStatus: latestAttempt.processingStatus,
        processingError: latestAttempt.processingError,
        attemptUpdatedAt: latestAttempt.updatedAt,
      })
      .from(song)
      .innerJoin(story, eq(story.id, song.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(filter)
      .orderBy(desc(song.createdAt))
      .limit(limit)
      .offset(offset);

    const runs =
      includeProcessing && rows.length
        ? await db
            .selectDistinctOn([songCreationRun.songId], {
              id: songCreationRun.id,
              songId: songCreationRun.songId,
              status: songCreationRun.status,
              currentStage: songCreationRun.currentStage,
            })
            .from(songCreationRun)
            .where(
              and(
                eq(songCreationRun.userId, userId),
                inArray(
                  songCreationRun.songId,
                  rows.map((row) => row.song.id)
                )
              )
            )
            .orderBy(songCreationRun.songId, desc(songCreationRun.createdAt))
        : [];
    const runsBySong = new Map(runs.map((run) => [run.songId, run]));

    return NextResponse.json(
      {
        success: true,
        data: rows.map((r) => {
          const run = runsBySong.get(r.song.id);
          return {
            ...r.song,
            prompt: r.prompt,
            processingStatus: r.processingStatus,
            ...(includeProcessing
              ? {
                  processingError: r.processingError,
                  updatedAt: r.attemptUpdatedAt,
                  workflow: run
                    ? {
                        id: run.id,
                        status: run.status,
                        currentStage: run.currentStage,
                        phase: getSongCreationPhase(run.currentStage),
                        retryableStage: resolveProductionRetryStage(
                          r.processingStatus,
                          run.currentStage,
                          !!r.song.audioKey && !!r.song.audioUrl,
                          !!r.song.coverImageKey && !!r.song.coverImageUrl
                        ),
                      }
                    : null,
                }
              : {}),
            category: 'News',
            ...getSongSourceCompatFields({
              sourceSummary: r.story.newsSummary,
              sourceText: r.story.sourceText,
              sourceUrl: r.story.sourceUrl,
            }),
          };
        }),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load songs' }, { status: 500 });
  }
}
