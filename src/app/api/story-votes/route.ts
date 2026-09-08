import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { storyCandidate, storyCandidateVote } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import { getRateLimiter } from '@/lib/infrastructure/ratelimit';
import {
  MAX_DAILY_STORY_VOTES,
  PUBLIC_STORY_CANDIDATE_LIMIT,
  getNextVoteReset,
  getRecentVoteDays,
  getVoteDay,
  rankPublicStoryCandidates,
} from '@/lib/stories/story-voting';
import { groupSimilarCoverage } from '@/lib/story-radar/coverage';
import { publicRadarEligibility } from '@/lib/story-radar/public-candidates';
import { and, desc, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const voteSchema = z.object({
  candidateIds: z
    .array(z.string().min(1).max(128))
    .min(1)
    .max(MAX_DAILY_STORY_VOTES)
    .refine((candidateIds) => new Set(candidateIds).size === candidateIds.length, 'Duplicate story selections'),
});

async function loadTrendingCandidates(db: Awaited<ReturnType<typeof getDb>>) {
  const now = new Date();
  const eligibleRows = await db
    .select({
      id: storyCandidate.id,
      sourceUrl: storyCandidate.sourceUrl,
      sourceTitle: storyCandidate.sourceTitle,
      sourceDomain: storyCandidate.sourceDomain,
      sourceImageUrl: storyCandidate.sourceImageUrl,
      category: storyCandidate.category,
      relevanceScore: storyCandidate.relevanceScore,
      status: storyCandidate.status,
      publishedAt: storyCandidate.publishedAt,
    })
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

  const rows = groupSimilarCoverage(rankPublicStoryCandidates(eligibleRows, now, eligibleRows.length))
    .slice(0, PUBLIC_STORY_CANDIDATE_LIMIT)
    .map((group) => group.primary);

  if (rows.length === 0) return [];

  const recentVoteDays = getRecentVoteDays(now);
  const voteDayWeights = new Map(recentVoteDays.map(({ day, weight }) => [day, weight]));
  const voteRows = await db
    .select({ candidateId: storyCandidateVote.candidateId, voteDay: storyCandidateVote.voteDay })
    .from(storyCandidateVote)
    .where(
      and(
        inArray(
          storyCandidateVote.candidateId,
          rows.map((row) => row.id)
        ),
        inArray(
          storyCandidateVote.voteDay,
          recentVoteDays.map(({ day }) => day)
        )
      )
    );

  const today = getVoteDay(now);
  const votesByCandidate = new Map<string, { voteCount: number; todayVoteCount: number; weightedScore: number }>();
  for (const voteRow of voteRows) {
    const current = votesByCandidate.get(voteRow.candidateId) || {
      voteCount: 0,
      todayVoteCount: 0,
      weightedScore: 0,
    };
    current.voteCount += 1;
    if (voteRow.voteDay === today) current.todayVoteCount += 1;
    current.weightedScore += voteDayWeights.get(voteRow.voteDay) || 0;
    votesByCandidate.set(voteRow.candidateId, current);
  }

  const totalWeightedScore = [...votesByCandidate.values()].reduce((total, item) => total + item.weightedScore, 0);

  return rows.map(({ status: _status, ...row }) => {
    const voteStats = votesByCandidate.get(row.id) || { voteCount: 0, todayVoteCount: 0, weightedScore: 0 };
    return {
      ...row,
      publishedAt: row.publishedAt?.toISOString() || null,
      ...voteStats,
      voteShare: totalWeightedScore > 0 ? Math.round((voteStats.weightedScore / totalWeightedScore) * 100) : 0,
    };
  });
}

export async function GET() {
  try {
    const db = await getDb();
    const session = await getSession();
    const candidates = await loadTrendingCandidates(db);
    const candidateIds = candidates.map((candidate) => candidate.id);
    const votingDay = getVoteDay();

    let selectedCandidateIds: string[] = [];
    if (session?.user?.id && candidateIds.length > 0) {
      const selectedVotes = await db
        .select({ candidateId: storyCandidateVote.candidateId })
        .from(storyCandidateVote)
        .where(
          and(
            eq(storyCandidateVote.userId, session.user.id),
            eq(storyCandidateVote.voteDay, votingDay),
            inArray(storyCandidateVote.candidateId, candidateIds)
          )
        )
        .orderBy(desc(storyCandidateVote.updatedAt))
        .limit(MAX_DAILY_STORY_VOTES);
      selectedCandidateIds = selectedVotes.map((selectedVote) => selectedVote.candidateId);
    }

    return NextResponse.json({
      success: true,
      data: {
        candidates,
        selectedCandidateIds,
        maxSelections: MAX_DAILY_STORY_VOTES,
        authenticated: Boolean(session?.user?.id),
        votingDay,
        resetsAt: getNextVoteReset().toISOString(),
      },
    });
  } catch (error) {
    console.error('load trending story votes error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load trending stories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Sign in to vote' }, { status: 401 });
    }

    const rateLimit = await getRateLimiter().limit(`story-vote:${session.user.id}`);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many vote changes. Try again shortly.' }, { status: 429 });
    }

    const parsed = voteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid story selection' }, { status: 400 });
    }

    const db = await getDb();
    const candidates = await loadTrendingCandidates(db);
    const candidateIds = candidates.map((candidate) => candidate.id);
    if (parsed.data.candidateIds.some((candidateId) => !candidateIds.includes(candidateId))) {
      return NextResponse.json({ success: false, error: 'This story is no longer open for voting' }, { status: 409 });
    }

    const now = new Date();
    const votingDay = getVoteDay(now);
    await db.transaction(async (tx) => {
      await tx
        .delete(storyCandidateVote)
        .where(and(eq(storyCandidateVote.userId, session.user.id), eq(storyCandidateVote.voteDay, votingDay)));

      await tx.insert(storyCandidateVote).values(
        parsed.data.candidateIds.map((candidateId) => ({
          id: randomUUID(),
          candidateId,
          userId: session.user.id,
          voteDay: votingDay,
          createdAt: now,
          updatedAt: now,
        }))
      );
    });

    return NextResponse.json({
      success: true,
      data: {
        candidates: await loadTrendingCandidates(db),
        selectedCandidateIds: parsed.data.candidateIds,
        maxSelections: MAX_DAILY_STORY_VOTES,
        votingDay,
        resetsAt: getNextVoteReset(now).toISOString(),
      },
    });
  } catch (error) {
    console.error('save trending story vote error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save your vote' }, { status: 500 });
  }
}
