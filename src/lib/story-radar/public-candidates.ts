import 'server-only';
import { storyCandidate } from '@/db/schema';
import { and, eq, gte, lte, or, sql } from 'drizzle-orm';

/** 待审内容只进后台；人工精选仍保留编辑优先权。 */
export function publicRadarEligibility(now = new Date()) {
  return or(
    eq(storyCandidate.status, 'shortlisted'),
    and(
      eq(storyCandidate.status, 'new'),
      sql`${storyCandidate.matchedTerms} <> '[]'`,
      sql`${storyCandidate.relevanceScore} > 0`,
      gte(storyCandidate.publishedAt, new Date(now.getTime() - 7 * 24 * 60 * 60_000)),
      lte(storyCandidate.publishedAt, now)
    )
  );
}
