import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { hotSheetEdition, storyCandidate } from '@/db/schema';
import { refreshEditorialRadar } from '@/lib/editorial-workflow';
import { getHotSheetScheduledDay } from '@/lib/hot-sheet-schedule';
import { rankPublicStoryCandidates } from '@/lib/story-voting';
import { and, desc, eq, inArray, isNull, lt, lte, or } from 'drizzle-orm';

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
    const radar = await refreshEditorialRadar(now);
    if (radar.discovered === 0) throw new Error('No stories were collected. Please inspect the news sources.');
    const candidates = await db
      .select()
      .from(storyCandidate)
      .where(
        and(
          inArray(storyCandidate.status, ['new', 'shortlisted']),
          or(isNull(storyCandidate.publishedAt), lte(storyCandidate.publishedAt, now))
        )
      )
      .orderBy(desc(storyCandidate.relevanceScore), desc(storyCandidate.publishedAt))
      .limit(300);
    const stories = rankPublicStoryCandidates(candidates, now, 10).map((item) => ({
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
        status: stories.length === 10 ? 'completed' : 'partial',
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
