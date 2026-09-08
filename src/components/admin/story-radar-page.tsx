import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDb } from '@/db/index';
import { storyCandidate, storyCandidateVote, storySubmission, user } from '@/db/schema';
import { getRadarCandidatePage, getRadarTotals } from '@/lib/story-radar/browse';
import { type RadarBrowseParams, parseRadarBrowseParams } from '@/lib/story-radar/browse-params';
import { groupRadarSongs } from '@/lib/story-radar/generated-song-view';
import { getRadarGeneratedSongs } from '@/lib/story-radar/generated-songs';
import type { StoryCandidateStatus, StoryRadarCategory } from '@/lib/story-radar/types';
import { getRecentVoteDays } from '@/lib/story-voting';
import { Routes } from '@/routes';
import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { count, countDistinct, desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  Archive,
  ArrowRight,
  Flame,
  Inbox,
  Music2,
  Newspaper,
  Radio,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { HotSheetArchive } from './hot-sheet-archive';
import { StoryRadar, type StoryRadarCandidateView } from './story-radar';
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

export async function StoryRadarPage({
  edition,
  browseParams = parseRadarBrowseParams({}),
}: { edition?: string; browseParams?: RadarBrowseParams } = {}) {
  const locale = await getLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const isZh = locale === 'zh';
  const db = await getDb();
  const reviewer = alias(user, 'story_submission_reviewer');
  const recentVoteDays = getRecentVoteDays();
  const voteDays = recentVoteDays.map(({ day }) => day);
  const voteWeights = new Map(recentVoteDays.map(({ day, weight }) => [day, weight]));

  const [candidatePage, submissions, groupedVotes, candidateVoters, voteSummary] = await Promise.all([
    getRadarCandidatePage(browseParams),
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

  const { candidates, ...browse } = candidatePage;
  const candidateTotal = await getRadarTotals();
  const generatedSongs = groupRadarSongs(await getRadarGeneratedSongs(candidates.map((candidate) => candidate.id)));

  // 计算投票统计并建立候选映射
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

  const candidateVoteMap = new Map<
    string,
    { todayVotes: number; threeDayVotes: number; share: number; rank: number }
  >();
  voteResults.forEach((res, index) => {
    candidateVoteMap.set(res.id, {
      todayVotes: res.todayVotes,
      threeDayVotes: res.threeDayVotes,
      share: res.share,
      rank: index + 1,
    });
  });

  const serializedCandidates: StoryRadarCandidateView[] = candidates.map((candidate) => ({
    generatedSongs: generatedSongs[candidate.id] ?? [],
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
    voteStats: candidateVoteMap.get(candidate.id) ?? null,
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

  const summary = voteSummary[0] ?? { selections: 0, voters: 0, stories: 0 };
  const pendingSubmissionsCount = serializedSubmissions.filter((s) => s.status === 'pending').length;
  const shortlistedCandidatesCount = candidateTotal.shortlisted;
  const generatedCandidatesCount = candidateTotal.generated;
  const inProductionCount = candidateTotal.producing + candidateTotal.generated;

  return (
    <div className="mx-auto flex w-full max-w-[2160px] flex-col gap-6 pb-12">
      {/* 头部运营标题条 */}
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/20 bg-pink-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
              <span className="size-1.5 rounded-full bg-pink-500 animate-ping" />
              Content Intelligence Desk
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight text-foreground">
            {isZh ? '热点雷达与选材中心' : 'Story Radar & Content Intelligence'}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {isZh
              ? '全天候监控明星八卦、网络热梗与荒诞新闻，结合大众投票与读者线索，一键直通 AI 音乐工坊。'
              : 'Continuous monitoring of pop-culture drama and absurd news, integrated with audience voting and reader submissions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild size="sm" variant="outline" className="h-8.5 rounded-lg text-xs font-bold">
            <Link href={Routes.AdminDashboard}>
              <ArrowRight className="mr-1.5 size-3.5 rotate-180" />
              {isZh ? '返回总览看板' : 'Overview'}
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-8.5 rounded-lg bg-pink-600 text-xs font-bold text-white hover:bg-pink-700"
          >
            <Link href={Routes.AdminCreate}>
              <Music2 className="mr-1.5 size-3.5" />
              {isZh ? '进入音乐工坊' : 'Open Music Studio'}
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 大核心概览 KPI 指标卡 */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 雷达总池 */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Newspaper className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground">{isZh ? '雷达候选总池' : 'Radar Candidates'}</p>
              <p className="mt-0.5 text-2xl font-black tabular-nums text-foreground">{candidateTotal.count}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
              {shortlistedCandidatesCount} 条已精选
            </span>
          </div>
        </div>

        {/* 大众投票 */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Vote className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground">{isZh ? '大众投票总选次' : 'Audience Votes'}</p>
              <p className="mt-0.5 text-2xl font-black tabular-nums text-foreground">{summary.selections}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="rounded-md bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-700 dark:text-pink-300">
              {summary.voters} 位选民
            </span>
          </div>
        </div>

        {/* 读者爆料 */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Inbox className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground">{isZh ? '待审读者爆料' : 'Pending Tips'}</p>
              <p className="mt-0.5 text-2xl font-black tabular-nums text-foreground">{pendingSubmissionsCount}</p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                pendingSubmissionsCount > 0
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {pendingSubmissionsCount > 0 ? (isZh ? '需要审核' : 'Review Needed') : isZh ? '已清空' : 'All Clear'}
            </span>
          </div>
        </div>

        {/* 制作中曲目 */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Music2 className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                {isZh ? '已采纳与生成' : 'In Production / Done'}
              </p>
              <p className="mt-0.5 text-2xl font-black tabular-nums text-foreground">{inProductionCount}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
              {isZh ? `${generatedCandidatesCount} 首已完成` : `${generatedCandidatesCount} Done`}
            </span>
          </div>
        </div>
      </div>

      {/* 现代工作区 Tabs 切换 */}
      <Tabs defaultValue="radar" className="w-full space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-2">
          <TabsList className="h-10 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger
              value="radar"
              className="gap-2 px-3.5 text-xs font-bold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Newspaper className="size-3.5 text-cyan-600" />
              {isZh ? '热点雷达候选池' : 'Radar Candidates'}
              <Badge variant="secondary" className="ml-0.5 h-4.5 px-1.5 text-[10px] font-bold">
                {candidateTotal.count}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="votes"
              className="gap-2 px-3.5 text-xs font-bold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Trophy className="size-3.5 text-pink-600" />
              {isZh ? '大众投票风向标' : 'Audience Votes'}
              <Badge variant="secondary" className="ml-0.5 h-4.5 px-1.5 text-[10px] font-bold">
                TOP {Math.min(voteResults.length, 10)}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="submissions"
              className="gap-2 px-3.5 text-xs font-bold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Inbox className="size-3.5 text-amber-600" />
              {isZh ? '读者爆料线索' : 'Reader Tips'}
              {pendingSubmissionsCount > 0 ? (
                <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white">
                  {pendingSubmissionsCount}
                </span>
              ) : (
                <Badge variant="secondary" className="ml-0.5 h-4.5 px-1.5 text-[10px] font-bold">
                  {serializedSubmissions.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="archive"
              className="gap-2 px-3.5 text-xs font-bold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Archive className="size-3.5 text-emerald-600" />
              {isZh ? 'The Hot Sheet 每日归档' : 'Daily Archive'}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: 热点雷达候选池 */}
        <TabsContent value="radar" className="m-0 outline-none">
          <StoryRadar key={JSON.stringify(browse.params)} candidates={serializedCandidates} browse={browse} />
        </TabsContent>

        {/* Tab 2: 大众投票风向标 */}
        <TabsContent value="votes" className="m-0 outline-none">
          <StoryVoteResults
            results={voteResults.slice(0, 10)}
            summary={{
              selections: Number(summary.selections),
              voters: Number(summary.voters),
              stories: Number(summary.stories),
            }}
          />
        </TabsContent>

        {/* Tab 3: 读者爆料线索 */}
        <TabsContent value="submissions" className="m-0 outline-none">
          <StorySubmissions submissions={serializedSubmissions} />
        </TabsContent>

        {/* Tab 4: 每日归档 */}
        <TabsContent value="archive" className="m-0 outline-none">
          <HotSheetArchive day={edition} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
