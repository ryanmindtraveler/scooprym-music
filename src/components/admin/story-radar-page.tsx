import { getDb } from '@/db/index';
import { storyCandidate, storyCandidateVote, storySubmission, user } from '@/db/schema';
import type { StoryCandidateStatus, StoryRadarCategory } from '@/lib/story-radar/types';
import { getRecentVoteDays } from '@/lib/story-voting';
import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { count, countDistinct, desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getLocale } from 'next-intl/server';
import { StoryRadar, type StoryRadarCandidateView } from './story-radar';
import { HotSheetArchive } from './hot-sheet-archive';
import { type StorySubmissionStatus, type StorySubmissionView, StorySubmissions } from './story-submissions';
import { type StoryVoteResultView, StoryVoteResults } from './story-vote-results';

function parseMatchedTerms(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((term): term is string => typeof term === 'string') : [];
  } catch {
    return [];
  }
}

export async function StoryRadarPage({ edition }: { edition?: string } = {}) {
  const locale = await getLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const db = await getDb();
  const reviewer = alias(user, 'story_submission_reviewer');
  const recentVoteDays = getRecentVoteDays();
  const voteDays = recentVoteDays.map(({ day }) => day);
  const voteWeights = new Map(recentVoteDays.map(({ day, weight }) => [day, weight]));

  const [candidates, submissions, groupedVotes, candidateVoters, voteSummary] = await Promise.all([
    db
      .select()
      .from(storyCandidate)
      .orderBy(
        sql`case ${storyCandidate.status} when 'adopted' then 0 when 'shortlisted' then 1 when 'new' then 2 else 3 end`,
        desc(storyCandidate.publishedAt),
        desc(storyCandidate.relevanceScore)
      )
      .limit(300),
    db
      .select({
        id: storySubmission.id,
        sourceUrl: storySubmission.sourceUrl,
        sourceDomain: storySubmission.sourceDomain,
        note: storySubmission.note,
        sourceTitle: storySubmission.sourceTitle,
        sourceDescription: storySubmission.sourceDescription,
        sourceImageUrl: storySubmission.sourceImageUrl,
        sourcePublishedAt: storySubmission.sourcePublishedAt,
        status: storySubmission.status,
        submissionCount: storySubmission.submissionCount,
        lastSubmittedAt: storySubmission.lastSubmittedAt,
        submitterName: user.name,
        submitterEmail: user.email,
        reviewerName: reviewer.name,
        rejectionReason: storySubmission.rejectionReason,
        reviewedAt: storySubmission.reviewedAt,
      })
      .from(storySubmission)
      .leftJoin(user, eq(storySubmission.submittedBy, user.id))
      .leftJoin(reviewer, eq(storySubmission.reviewedBy, reviewer.id))
      .orderBy(
        sql`case ${storySubmission.status} when 'pending' then 0 when 'adopted' then 1 else 2 end`,
        desc(storySubmission.lastSubmittedAt)
      )
      .limit(200),
    db
      .select({
        candidateId: storyCandidate.id,
        sourceUrl: storyCandidate.sourceUrl,
        sourceTitle: storyCandidate.sourceTitle,
        sourceDomain: storyCandidate.sourceDomain,
        sourceImageUrl: storyCandidate.sourceImageUrl,
        category: storyCandidate.category,
        status: storyCandidate.status,
        voteDay: storyCandidateVote.voteDay,
        votes: count(storyCandidateVote.id),
      })
      .from(storyCandidateVote)
      .innerJoin(storyCandidate, eq(storyCandidateVote.candidateId, storyCandidate.id))
      .where(inArray(storyCandidateVote.voteDay, voteDays))
      .groupBy(
        storyCandidate.id,
        storyCandidate.sourceUrl,
        storyCandidate.sourceTitle,
        storyCandidate.sourceDomain,
        storyCandidate.sourceImageUrl,
        storyCandidate.category,
        storyCandidate.status,
        storyCandidateVote.voteDay
      ),
    db
      .select({
        candidateId: storyCandidateVote.candidateId,
        voters: countDistinct(storyCandidateVote.userId),
      })
      .from(storyCandidateVote)
      .where(inArray(storyCandidateVote.voteDay, voteDays))
      .groupBy(storyCandidateVote.candidateId),
    db
      .select({
        selections: count(storyCandidateVote.id),
        voters: countDistinct(storyCandidateVote.userId),
        stories: countDistinct(storyCandidateVote.candidateId),
      })
      .from(storyCandidateVote)
      .where(inArray(storyCandidateVote.voteDay, voteDays)),
  ]);

  const serializedCandidates: StoryRadarCandidateView[] = candidates.map((candidate) => ({
    id: candidate.id,
    sourceUrl: candidate.sourceUrl,
    sourceTitle: candidate.sourceTitle,
    sourceDomain: candidate.sourceDomain,
    sourceImageUrl: candidate.sourceImageUrl,
    category: candidate.category as StoryRadarCategory,
    matchedTerms: parseMatchedTerms(candidate.matchedTerms),
    relevanceScore: candidate.relevanceScore,
    status: candidate.status as StoryCandidateStatus,
    publishedAt: candidate.publishedAt?.toISOString() ?? null,
    publishedAgo: candidate.publishedAt
      ? formatDistanceToNowStrict(candidate.publishedAt, { addSuffix: true, locale: dateLocale })
      : null,
  }));
  const serializedSubmissions: StorySubmissionView[] = submissions.map((submission) => ({
    id: submission.id,
    sourceUrl: submission.sourceUrl,
    sourceDomain: submission.sourceDomain,
    note: submission.note,
    sourceTitle: submission.sourceTitle,
    sourceDescription: submission.sourceDescription,
    sourceImageUrl: submission.sourceImageUrl,
    sourcePublishedAt: submission.sourcePublishedAt?.toISOString() ?? null,
    submitterName: submission.submitterName,
    submitterEmail: submission.submitterEmail,
    reviewerName: submission.reviewerName,
    rejectionReason: submission.rejectionReason,
    reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    status: submission.status as StorySubmissionStatus,
    submissionCount: submission.submissionCount,
    submittedAgo: formatDistanceToNowStrict(submission.lastSubmittedAt, { addSuffix: true, locale: dateLocale }),
  }));

  const voteResultsByCandidate = new Map<string, StoryVoteResultView>();
  const votersByCandidate = new Map(candidateVoters.map((row) => [row.candidateId, Number(row.voters)]));
  for (const row of groupedVotes) {
    const current = voteResultsByCandidate.get(row.candidateId) ?? {
      id: row.candidateId,
      sourceUrl: row.sourceUrl,
      sourceTitle: row.sourceTitle,
      sourceDomain: row.sourceDomain,
      sourceImageUrl: row.sourceImageUrl,
      category: row.category as StoryRadarCategory,
      status: row.status as StoryCandidateStatus,
      todayVotes: 0,
      threeDayVotes: 0,
      uniqueVoters: votersByCandidate.get(row.candidateId) ?? 0,
      weightedScore: 0,
      share: 0,
    };

    const votes = Number(row.votes);
    current.threeDayVotes += votes;
    current.weightedScore += votes * (voteWeights.get(row.voteDay) ?? 0);
    if (row.voteDay === voteDays[0]) current.todayVotes += votes;
    voteResultsByCandidate.set(row.candidateId, current);
  }

  const voteResults = [...voteResultsByCandidate.values()].sort(
    (left, right) =>
      right.weightedScore - left.weightedScore ||
      right.todayVotes - left.todayVotes ||
      right.threeDayVotes - left.threeDayVotes
  );
  const totalWeightedScore = voteResults.reduce((total, result) => total + result.weightedScore, 0);
  for (const result of voteResults) {
    result.share = totalWeightedScore > 0 ? Math.round((result.weightedScore / totalWeightedScore) * 100) : 0;
  }

  const summary = voteSummary[0] ?? { selections: 0, voters: 0, stories: 0 };

  return (
    <div className="flex flex-col gap-8">
      <HotSheetArchive day={edition} />
      <StorySubmissions submissions={serializedSubmissions} />
      <StoryVoteResults
        results={voteResults.slice(0, 10)}
        summary={{
          selections: Number(summary.selections),
          voters: Number(summary.voters),
          stories: Number(summary.stories),
        }}
      />
      <StoryRadar candidates={serializedCandidates} />
    </div>
  );
}
