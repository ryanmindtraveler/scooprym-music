import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { hotSheetEdition, storyCandidate } from '@/db/schema';
import { refreshEditorialRadar } from '@/lib/stories/editorial-workflow';
import { getHotSheetScheduledDay } from '@/lib/stories/hot-sheet-schedule';
import { rankPublicStoryCandidates } from '@/lib/stories/story-voting';
import { groupSimilarCoverage } from '@/lib/story-radar/coverage';
import { publicRadarEligibility } from '@/lib/story-radar/public-candidates';
import { getRecentSuccessfulRadarScan } from '@/lib/story-radar/scan';
import { and, desc, eq, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm';

export async function archiveDailyHotSheet(now = new Date()) {
  const day = getHotSheetScheduledDay(now);
  if (!day) return { skipped: true, reason: 'outside_scheduled_hour' };
  const db = await getDb();
  const attemptId = randomUUID();
  const claim = { day, status: 'running', attemptId, startedAt: now };
  let claimed = await db
    .insert(hotSheetEdition)
    .values(claim)
    .onConflictDoNothing()
    .returning({ day: hotSheetEdition.day });
  if (!claimed.length) {
    // 已成功的版本不可覆盖；失败或超时十分钟的执行允许重新领取。
    claimed = await db
      .update(hotSheetEdition)
      .set({ ...claim, error: null, completedAt: null })
      .where(
        and(
          eq(hotSheetEdition.day, day),
          or(
            eq(hotSheetEdition.status, 'failed'),
            and(eq(hotSheetEdition.status, 'running'), lt(hotSheetEdition.startedAt, new Date(now.getTime() - 600_000)))
          )
        )
      )
      .returning({ day: hotSheetEdition.day });
  }
  if (!claimed.length) return { skipped: true, reason: 'already_claimed', day };
  const ownsClaim = and(eq(hotSheetEdition.day, day), eq(hotSheetEdition.attemptId, attemptId));
  try {
    // 日报优先使用增量采集库存，仅在最近一小时没有可用扫描时补抓。
    const recentScan = await getRecentSuccessfulRadarScan(now);
    const radar = recentScan ?? (await refreshEditorialRadar(now));
    if (radar.status === 'failed' || (!recentScan && radar.discovered === 0)) {
      throw new Error('No stories were collected. Please inspect the news sources.');
    }
    const candidates = await db
      .select()
      .from(storyCandidate)
      .where(
        and(publicRadarEligibility(now), or(isNull(storyCandidate.publishedAt), lte(storyCandidate.publishedAt, now)))
      )
      .orderBy(
        sql`case ${storyCandidate.status} when 'shortlisted' then 0 else 1 end`,
        sql`${storyCandidate.publishedAt} desc nulls last`,
        desc(storyCandidate.relevanceScore)
      )
      .limit(300);
    const ranked = rankPublicStoryCandidates(candidates, now, candidates.length);
    const stories = groupSimilarCoverage(ranked)
      .slice(0, 10)
      .map(({ primary: item }) => ({
        id: item.id,
        sourceTitle: item.sourceTitle,
        sourceUrl: item.sourceUrl,
        category: item.category,
        sourceDomain: item.sourceDomain,
        publishedAt: item.publishedAt?.toISOString() ?? null,
      }));
    await db
      .update(hotSheetEdition)
      .set({
        stories,
        discovered: radar.discovered,
        status: stories.length === 10 && radar.status !== 'partial' ? 'completed' : 'partial',
        completedAt: new Date(),
      })
      .where(ownsClaim);
    return { day, count: stories.length, discovered: radar.discovered };
  } catch (error) {
    await db
      .update(hotSheetEdition)
      .set({
        status: 'failed',
        completedAt: new Date(),
        error: 'Collection failed. Check server logs before retrying.',
      })
      .where(ownsClaim);
    throw error;
  }
}
