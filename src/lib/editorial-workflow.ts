import { getDb } from '@/db';
import { song, storyCandidate } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { collectStoryRadarCandidates } from '@/lib/story-radar';
import { PUBLIC_STORY_CANDIDATE_LIMIT } from '@/lib/story-voting';
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
  const candidates = await collectStoryRadarCandidates();

  if (candidates.length > 0) {
    await db
      .insert(storyCandidate)
      .values(
        candidates.map((candidate) => ({
          id: crypto.randomUUID(),
          provider: candidate.provider,
          sourceUrl: candidate.sourceUrl,
          sourceTitle: candidate.sourceTitle,
          sourceDomain: candidate.sourceDomain,
          sourceImageUrl: candidate.sourceImageUrl,
          category: candidate.category,
          matchedTerms: JSON.stringify(candidate.matchedTerms),
          relevanceScore: candidate.relevanceScore,
          publishedAt: candidate.publishedAt,
          updatedAt: now,
        }))
      )
      .onConflictDoUpdate({
        target: storyCandidate.sourceUrl,
        set: {
          provider: sql`excluded.provider`,
          sourceTitle: sql`excluded.source_title`,
          sourceDomain: sql`excluded.source_domain`,
          sourceImageUrl: sql`excluded.source_image_url`,
          category: sql`excluded.category`,
          matchedTerms: sql`excluded.matched_terms`,
          relevanceScore: sql`excluded.relevance_score`,
          publishedAt: sql`excluded.published_at`,
          updatedAt: now,
        },
      });
  }

  const cutoff = new Date(now.getTime() - FRESH_WINDOW_MS);
  const topCandidates = await db
    .select({ id: storyCandidate.id })
    .from(storyCandidate)
    .where(
      and(
        inArray(storyCandidate.status, ['new', 'shortlisted']),
        gte(storyCandidate.publishedAt, cutoff),
        lte(storyCandidate.publishedAt, now)
      )
    )
    .orderBy(desc(storyCandidate.relevanceScore), desc(storyCandidate.publishedAt))
    .limit(PUBLIC_STORY_CANDIDATE_LIMIT);

  await db
    .update(storyCandidate)
    .set({ status: 'new', updatedAt: now })
    .where(and(eq(storyCandidate.status, 'shortlisted'), gte(storyCandidate.publishedAt, cutoff)));

  const shortlistedIds = topCandidates.map((candidate) => candidate.id);
  if (shortlistedIds.length > 0) {
    await db
      .update(storyCandidate)
      .set({ status: 'shortlisted', updatedAt: now })
      .where(inArray(storyCandidate.id, shortlistedIds));
  }

  return {
    discovered: candidates.length,
    stored: candidates.length,
    shortlisted: shortlistedIds.length,
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

  return { published: published.length };
}

export async function runDailyEditorialWorkflow(now = new Date()): Promise<EditorialWorkflowResult> {
  const [radar, publishing] = await Promise.all([refreshEditorialRadar(now), publishDueSongs(now)]);
  return { radar, publishing };
}
