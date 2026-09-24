import { radarCreationJob, storyCandidate, storyCandidateVote, storySubmission } from '@/db/schema';
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import type { StoryRadarCandidate } from './types';

const NEW_INBOX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function getNewInboxCutoff(now: Date) {
  return new Date(now.getTime() - NEW_INBOX_RETENTION_MS);
}

export function isWithinNewInboxRetention(candidate: StoryRadarCandidate, cutoff: Date) {
  return !candidate.publishedAt || candidate.publishedAt >= cutoff;
}

/** 仅清理未被编辑处理、生产任务或读者投稿引用的过期候选。 */
export const expiredNewInboxCondition = (cutoff: Date) =>
  and(
    eq(storyCandidate.status, 'new'),
    isNull(storyCandidate.storyId),
    or(
      lt(storyCandidate.publishedAt, cutoff),
      and(isNull(storyCandidate.publishedAt), lt(storyCandidate.createdAt, cutoff))
    ),
    // 生产任务的 candidateId 没有外键，删除前仍需显式保护。
    sql`not exists (select 1 from ${radarCreationJob} job where job.candidate_id = ${storyCandidate.id})`,
    sql`not exists (select 1 from ${storyCandidateVote} vote where vote.candidate_id = ${storyCandidate.id})`,
    sql`not exists (select 1 from ${storySubmission} submission where submission.candidate_id = ${storyCandidate.id})`
  );
