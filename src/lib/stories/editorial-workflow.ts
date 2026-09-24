import { getDb } from '@/db';
import { song, storyCandidate } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSongIndexNowPaths, notifyIndexNow } from '@/lib/seo/indexnow';
import { revalidatePublicSongs } from '@/lib/songs/revalidate-public-songs';
import { PUBLIC_STORY_CANDIDATE_LIMIT } from '@/lib/stories/story-voting';
import { scanAndStoreRadar } from '@/lib/story-radar/scan';
import { MIN_PASSING_RELEVANCE_SCORE } from '@/lib/story-radar/score-policy';
import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';

const FRESH_WINDOW_MS = 72 * 60 * 60 * 1_000;
const PUBLISHABLE_GENERATION_STATUSES = ['completed', 'completed_without_cover'] as const;

export interface EditorialWorkflowResult {
  radar: {
    discovered: number;
    stored: number;
    shortlisted: number;
  };
  publishing: {
    published: number;
  };
}

/**
 * 保存雷达结果并重建最近 72 小时的公开投票池。
 * 同一来源 URL 只保留一条记录，重复执行不会产生重复候选。
 */
export async function refreshEditorialRadar(now = new Date()) {
  const db = await getDb();
  const scan = await scanAndStoreRadar(now);
  if (scan.status === 'failed') return { ...scan, shortlisted: 0 };

  const cutoff = new Date(now.getTime() - FRESH_WINDOW_MS);
  const existingShortlisted = await db
    .select({ id: storyCandidate.id })
    .from(storyCandidate)
    .where(eq(storyCandidate.status, 'shortlisted'));

  let shortlistedCount = existingShortlisted.length;

  // 仅在当前精选数量不足且为系统初次抓取时，基于算法补充精选；绝不自动清空或降级管理员已手动精选的内容。
  if (shortlistedCount === 0) {
    const topCandidates = await db
      .select({ id: storyCandidate.id })
      .from(storyCandidate)
      .where(
        and(
          eq(storyCandidate.status, 'new'),
          sql`${storyCandidate.matchedTerms} <> '[]'`,
          gte(storyCandidate.relevanceScore, MIN_PASSING_RELEVANCE_SCORE),
          gte(storyCandidate.publishedAt, cutoff),
          lte(storyCandidate.publishedAt, now)
        )
      )
      .orderBy(desc(storyCandidate.relevanceScore), desc(storyCandidate.publishedAt))
      .limit(PUBLIC_STORY_CANDIDATE_LIMIT);

    const shortlistedIds = topCandidates.map((candidate) => candidate.id);
    if (shortlistedIds.length > 0) {
      await db
        .update(storyCandidate)
        .set({ status: 'shortlisted', updatedAt: now })
        .where(inArray(storyCandidate.id, shortlistedIds));
      shortlistedCount = shortlistedIds.length;
    }
  }

  return {
    ...scan,
    shortlisted: shortlistedCount,
  };
}

/** 到期发布已完成生产的歌曲。筛选条件包含未发布状态，因此可安全重复执行。 */
export async function publishDueSongs(now = new Date()) {
  const db = await getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const dueRows = await db
    .select({ id: song.id })
    .from(song)
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        or(eq(song.isPublished, false), isNull(song.isPublished)),
        lte(song.scheduledAt, now),
        inArray(latestAttempt.processingStatus, [...PUBLISHABLE_GENERATION_STATUSES])
      )
    )
    .groupBy(song.id);

  const dueIds = dueRows.map((row) => row.id);
  if (dueIds.length === 0) return { published: 0 };

  const published = await db
    .update(song)
    .set({
      isPublished: true,
      publishedAt: now,
      scheduledAt: null,
      updatedAt: now,
    })
    .where(
      and(
        inArray(song.id, dueIds),
        or(eq(song.isPublished, false), isNull(song.isPublished)),
        lte(song.scheduledAt, now)
      )
    )
    .returning({ id: song.id });

  if (published.length > 0) {
    revalidatePublicSongs();
    await notifyIndexNow(getSongIndexNowPaths(published.map((row) => row.id)));
  }

  return { published: published.length };
}

export async function runDailyEditorialWorkflow(now = new Date()): Promise<EditorialWorkflowResult> {
  const [radar, publishing] = await Promise.all([refreshEditorialRadar(now), publishDueSongs(now)]);
  return { radar, publishing };
}
