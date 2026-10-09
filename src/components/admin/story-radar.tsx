'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocaleLink, useLocaleRouter } from '@/i18n/navigation';
import { type RadarBrowseView, radarBrowseSearch } from '@/lib/story-radar/browse-params';
import { getStoryFreshness } from '@/lib/story-radar/classifier';
import { groupSimilarCoverage } from '@/lib/story-radar/coverage';
import { type RadarGeneratedSong, groupRadarSongs } from '@/lib/story-radar/generated-song-view';
import { MIN_PASSING_RELEVANCE_SCORE } from '@/lib/story-radar/score-policy';
import type { GoogleTrendSignal, StoryCandidateStatus, StoryRadarCategory } from '@/lib/story-radar/types';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Globe,
  Loader2,
  Music2,
  Newspaper,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

export interface StoryRadarCandidateView {
  aiScreening?: import('@/lib/story-radar/screening-state').ScreeningState | null;
  trendSignals?: GoogleTrendSignal[] | null;
  generatedSongs?: RadarGeneratedSong[];
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  sourceImageUrl: string | null;
  category: StoryRadarCategory;
  matchedTerms: string[];
  relevanceScore: number;
  status: StoryCandidateStatus;
  publishedAt: string | null;
  publishedAgo: string | null;
  voteStats?: {
    todayVotes: number;
    threeDayVotes: number;
    share: number;
    rank: number;
  } | null;
}

const categoryDetails: Record<
  StoryRadarCategory,
  { labelKey: 'celebrityDrama' | 'internetChaos' | 'absurdHeadlines'; className: string }
> = {
  celebrity_drama: {
    labelKey: 'celebrityDrama',
    className: 'border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300',
  },
  internet_chaos: {
    labelKey: 'internetChaos',
    className: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  },
  absurd_headlines: {
    labelKey: 'absurdHeadlines',
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
};

const statusFilters: Array<{ id: 'all' | 'generated' | StoryCandidateStatus; labelZh: string; labelEn: string }> = [
  { id: 'all', labelZh: '全部', labelEn: 'All' },
  { id: 'new', labelZh: '🆕 待精选', labelEn: 'New Inbox' },
  { id: 'shortlisted', labelZh: '⭐️ 首页精选', labelEn: 'Shortlisted' },
  { id: 'adopted', labelZh: '⚙️ 制作中', labelEn: 'In Production' },
  { id: 'generated', labelZh: '♫ 已生成', labelEn: 'Generated' },
  { id: 'dismissed', labelZh: '🗑️ 已忽略', labelEn: 'Dismissed' },
];

const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

export function StoryRadar({
  candidates,
  browse,
}: { candidates: StoryRadarCandidateView[]; browse?: RadarBrowseView }) {
  const t = useTranslations('Dashboard.admin.storyRadar');
  const router = useLocaleRouter();
  const [isNavigating, startNavigation] = useTransition();
  const zh = useLocale() === 'zh';
  const submitting = useRef(new Set<string>());
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<
    Record<string, { status: string; workflowStatus?: string; stage?: string; error?: string; songId?: string }>
  >({});
  const [generated, setGenerated] = useState<Record<string, RadarGeneratedSong[]> | null>(null);

  const [activeStatus, setActiveStatus] = useState<'all' | 'generated' | StoryCandidateStatus>(
    browse?.params.status ?? 'all'
  );
  const [activeCategory, setActiveCategory] = useState<'all' | StoryRadarCategory>(
    (browse?.params.category ?? 'all') as 'all' | StoryRadarCategory
  );
  const [searchQuery, setSearchQuery] = useState(browse?.params.q ?? '');
  const [isScanning, setIsScanning] = useState(false);
  const [groupCoverage, setGroupCoverage] = useState(true);
  const [reviewOnly, setReviewOnly] = useState(browse?.params.review ?? false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(browse?.params.page ?? 1);
  const [pageSize, setPageSize] = useState(browse?.params.size ?? 10);

  const songsByCandidate =
    generated ?? Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate.generatedSongs ?? []]));
  const isCandidateGenerated = (c: StoryRadarCandidateView) => (songsByCandidate[c.id]?.length ?? 0) > 0;

  const matchesStatus = (candidate: StoryRadarCandidateView, status: typeof activeStatus) => {
    if (status === 'all') return true;
    if (status === 'generated') return isCandidateGenerated(candidate);
    if (status === 'shortlisted') return candidate.status === 'shortlisted';
    if (status === 'new') return candidate.status === 'new' && candidate.relevanceScore >= MIN_PASSING_RELEVANCE_SCORE;
    if (status === 'adopted') {
      // 制作中：仅包含正在制作中或失败的新闻；已成功生成音乐的新闻不在“制作中”重复显示
      if (isCandidateGenerated(candidate)) return false;
      return candidate.status === 'adopted' || !!jobs[candidate.id];
    }
    if (status === 'dismissed') return candidate.status === 'dismissed';
    return candidate.status === status;
  };

  const refreshJobs = async (signal?: AbortSignal) => {
    try {
      const timeout = AbortSignal.timeout(10_000);
      const response = await fetch(
        `/api/admin/story-radar/jobs?ids=${candidates.map((candidate) => candidate.id).join(',')}`,
        {
          signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
          cache: 'no-store',
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (signal?.aborted) return;
      if (Array.isArray(data.generatedSongs)) setGenerated(groupRadarSongs(data.generatedSongs));
      if (Array.isArray(data.jobs))
        setJobs(Object.fromEntries(data.jobs.map((job: { candidateId: string }) => [job.candidateId, job])));
      return data.jobs as Array<{ candidateId: string; status: string; workflowStatus?: string }> | undefined;
    } catch {
      /* 临时网络中断保留当前队列状态。 */
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      const currentJobs = document.visibilityState !== 'hidden' ? await refreshJobs(controller.signal) : undefined;
      const active = currentJobs?.some(
        (job) => job.status !== 'failed' && !['completed', 'failed'].includes(job.workflowStatus || '')
      );
      if (!controller.signal.aborted) timer = setTimeout(poll, active ? 3_000 : 15_000);
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [candidates]);

  const [hideLowScore, setHideLowScore] = useState(browse?.params.hideLow ?? false);
  useEffect(() => {
    if (!browse) return;
    const changed =
      activeStatus !== browse.params.status ||
      activeCategory !== browse.params.category ||
      searchQuery.trim() !== browse.params.q ||
      reviewOnly !== browse.params.review ||
      hideLowScore !== browse.params.hideLow ||
      pageSize !== browse.params.size;
    const next = {
      page: changed ? 1 : currentPage,
      size: pageSize,
      status: activeStatus,
      category: activeCategory,
      q: searchQuery.trim(),
      review: reviewOnly,
      hideLow: hideLowScore,
    };
    if (radarBrowseSearch(next) === radarBrowseSearch(browse.params)) return;
    const timer = setTimeout(
      () => startNavigation(() => router.push(`/admin/story-radar?${radarBrowseSearch(next)}`)),
      searchQuery.trim() !== browse.params.q ? 350 : 0
    );
    return () => clearTimeout(timer);
  }, [activeStatus, activeCategory, searchQuery, reviewOnly, hideLowScore, currentPage, pageSize, browse, router]);
  const [isAiScreening, setIsAiScreening] = useState(false);

  const filteredCandidates = useMemo(() => {
    if (browse) return candidates;
    const filtered = candidates.filter((candidate) => {
      if (hideLowScore && activeStatus !== 'dismissed' && candidate.relevanceScore < MIN_PASSING_RELEVANCE_SCORE)
        return false;
      if (reviewOnly && (candidate.status !== 'new' || candidate.matchedTerms.length > 0)) return false;
      const matchesCategory = activeCategory === 'all' || candidate.category === activeCategory;
      if (!matchesCategory || !matchesStatus(candidate, activeStatus)) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      return (
        candidate.sourceTitle.toLowerCase().includes(query) ||
        candidate.sourceDomain.toLowerCase().includes(query) ||
        candidate.matchedTerms.some((term) => term.toLowerCase().includes(query)) ||
        candidate.trendSignals?.some((signal) => signal.term.toLowerCase().includes(query))
      );
    });

    // 首页精选优先展示最新新闻，缺失时间排在最后；其余列表保留分数优先。
    return filtered.sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      if (activeStatus === 'shortlisted' && timeA !== timeB) return timeB - timeA;
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return timeB - timeA;
    });
  }, [browse, activeCategory, activeStatus, candidates, generated, jobs, searchQuery, reviewOnly, hideLowScore]);

  const coverageGroups = useMemo(() => {
    const groups = groupCoverage
      ? groupSimilarCoverage(filteredCandidates)
      : filteredCandidates.map((candidate) => ({ primary: candidate, articles: [candidate] }));

    // 分组卡片与分页排序保持一致，首页精选以最新报道作为分组主记录。
    return groups.sort((a, b) => {
      const timeA = a.primary.publishedAt ? new Date(a.primary.publishedAt).getTime() : 0;
      const timeB = b.primary.publishedAt ? new Date(b.primary.publishedAt).getTime() : 0;
      if (activeStatus === 'shortlisted' && timeA !== timeB) return timeB - timeA;
      if (b.primary.relevanceScore !== a.primary.relevanceScore) {
        return b.primary.relevanceScore - a.primary.relevanceScore;
      }
      return timeB - timeA;
    });
  }, [filteredCandidates, groupCoverage, activeStatus]);

  // 状态或筛选条件切换时，自动重置回第一页
  useEffect(() => {
    if (!browse) setCurrentPage(1);
  }, [activeStatus, activeCategory, searchQuery, reviewOnly, groupCoverage, hideLowScore]);

  const totalItems = browse?.total ?? coverageGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = browse ? browse.params.page : Math.min(currentPage, totalPages);

  const paginatedGroups = useMemo(
    () =>
      browse ? coverageGroups : coverageGroups.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize),
    [browse, coverageGroups, safeCurrentPage, pageSize]
  );

  // 状态计数动态联动当前所选类别，制作中排查已生成，精选由管理员决定
  const counts = useMemo(() => {
    if (browse) return browse.counts;
    const categoryMatched = candidates.filter((c) => activeCategory === 'all' || c.category === activeCategory);
    return {
      all: categoryMatched.length,
      new: categoryMatched.filter((c) => c.status === 'new' && c.relevanceScore >= MIN_PASSING_RELEVANCE_SCORE).length,
      shortlisted: categoryMatched.filter((c) => c.status === 'shortlisted').length,
      adopted: categoryMatched.filter((c) => !isCandidateGenerated(c) && (c.status === 'adopted' || !!jobs[c.id]))
        .length,
      dismissed: categoryMatched.filter((c) => c.status === 'dismissed').length,
      generated: categoryMatched.filter((c) => isCandidateGenerated(c)).length,
    };
  }, [browse, activeCategory, candidates, generated, jobs]);

  async function scanLatestStories() {
    setIsScanning(true);
    try {
      const response = await fetch('/api/admin/story-radar/refresh', { method: 'POST' });
      const result = (await response.json()) as {
        success: boolean;
        discovered?: number;
        stored?: number;
        inserted?: number;
        updated?: number;
        status?: string;
        shortlisted?: number;
        error?: string;
      };
      if (!response.ok || !result.success) throw new Error(result.error || 'Scan failed');

      const countDiscovered = result.discovered ?? 0;
      const summary = `${result.inserted ?? 0} new articles, ${result.updated ?? 0} existing articles refreshed. ${countDiscovered} collected.`;
      if (result.status === 'partial')
        toast.warning(`Partial scan: ${summary} Some sources failed. See source health.`);
      else if (countDiscovered > 0) toast.success(summary);
      else toast.info('Sources responded, but returned no valid articles. See source health.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh Story Radar');
      router.refresh();
    } finally {
      setIsScanning(false);
    }
  }

  async function runAiScreening(retryFailed = false) {
    setIsAiScreening(true);
    const toastId = toast.loading('AI is evaluating stories for meme-song fit...');
    try {
      const response = await fetch('/api/admin/story-radar/ai-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoDismiss: true, limit: 40, retryFailed }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI screening failed');
      }

      (data.partial ? toast.warning : toast.success)(
        `AI screening: ${data.processedCount} saved, ${data.failedCount ?? 0} failed, ${data.skippedCount ?? 0} skipped. ${data.dismissedCount} dismissed, ${data.highMatchCount} high-fit topics.`,
        { id: toastId }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI screening failed', { id: toastId });
    } finally {
      setIsAiScreening(false);
      router.refresh();
    }
  }

  async function updateStatus(id: string, status: StoryCandidateStatus) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/story-radar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || 'Update failed');
      toast.success(
        status === 'shortlisted'
          ? zh
            ? '已加入首页精选投票池！'
            : 'Story shortlisted for homepage voting.'
          : status === 'dismissed'
            ? zh
              ? '已忽略该新闻。'
              : 'Story dismissed.'
            : zh
              ? '已恢复为待精选状态。'
              : 'Story restored.'
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update candidate');
    } finally {
      setPendingId(null);
    }
  }

  async function openInStudio(id: string) {
    const existingJob = jobs[id];
    if (existingJob?.workflowStatus === 'failed' && existingJob.songId) {
      router.push(`/admin/create?songId=${encodeURIComponent(existingJob.songId)}`);
      return;
    }
    if (submitting.current.has(id)) return;
    submitting.current.add(id);
    setSubmittingIds(new Set(submitting.current));
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(`/api/admin/story-radar/${id}/generate`, {
        method: 'POST',
        signal: controller.signal,
      });
      const result = (await response.json()) as { success?: boolean; job?: { status: string }; error?: string };
      if (!response.ok || !result.success || !result.job) {
        throw new Error(result.error || 'Could not move this story into production');
      }
      const job = result.job;
      setJobs((current) => ({ ...current, [id]: job }));
      toast.success(
        zh ? '已加入后台制作队列，AI 将自动生成歌词与音乐。' : 'Added to the queue. AI will generate lyrics & music.'
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        const recovered = (await refreshJobs())?.find((job) => job.candidateId === id);
        if (recovered && recovered.status !== 'failed') {
          toast.success(
            zh ? '已确认任务已保存，后台将继续执行。' : 'Task confirmed. Background processing will continue.'
          );
        } else {
          toast.error(
            recovered
              ? zh
                ? '任务投递失败，请重试这条新闻。'
                : 'Queue delivery failed. Please retry this story.'
              : zh
                ? '尚未确认任务入队，请重试；相同新闻会复用同一个任务。'
                : 'Queue acceptance is not confirmed. Retry will reuse the same story task.'
          );
        }
        return;
      }
      toast.error(error instanceof Error ? error.message : t('openStudioError'));
      void refreshJobs();
    } finally {
      window.clearTimeout(timeoutId);
      submitting.current.delete(id);
      setSubmittingIds(new Set(submitting.current));
    }
  }

  return (
    <div className="space-y-4">
      {/* 筛选与操作控制条 */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
        {/* 第一行：题材分类按钮 + 实时搜索框 + 扫描与工坊操作 */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b pb-3.5">
          {/* 题材分类 */}
          <div className="flex flex-wrap items-center gap-1.5" aria-label={t('categoryFilters')}>
            <Button
              type="button"
              size="sm"
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveCategory('all')}
              className={`h-7.5 px-3 text-xs font-bold rounded-lg ${
                activeCategory === 'all' ? 'bg-pink-600 text-white hover:bg-pink-700' : ''
              }`}
            >
              {t('allTopics')}
            </Button>
            {Object.entries(categoryDetails).map(([id, details]) => {
              const isActive = activeCategory === id;
              return (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(id as StoryRadarCategory)}
                  className={`h-7.5 px-3 text-xs font-bold rounded-lg ${
                    isActive ? 'bg-pink-600 text-white hover:bg-pink-700' : ''
                  }`}
                >
                  {t(`categories.${details.labelKey}`)}
                </Button>
              );
            })}
          </div>

          {/* 搜索框与全局操作 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 实时搜索 */}
            <div className="relative min-w-[200px] flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={zh ? '搜索标题、域名、关键词...' : 'Search title, domain, keywords...'}
                className="h-8 w-full rounded-lg border border-border/80 bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-pink-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold"
              onClick={() => router.push('/admin/create')}
            >
              {zh ? '创作工坊队列' : 'Creation Queue'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => runAiScreening()}
              disabled={isAiScreening}
              className="h-8 bg-linear-to-r from-violet-600 to-pink-600 text-xs font-bold text-white hover:opacity-90 shadow-2xs"
              title={
                zh
                  ? '使用 AI 智能判断待精选新闻的主题契合度并自动过滤无关内容'
                  : 'AI screens and filters stories by meme fit'
              }
            >
              <Sparkles className={cn('mr-1.5 size-3.5', isAiScreening && 'animate-spin')} />
              {isAiScreening ? 'Screening...' : 'AI Screen'}
            </Button>
            <Button size="sm" variant="outline" disabled={isAiScreening} onClick={() => runAiScreening(true)}>
              Retry failed screening
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={scanLatestStories}
              disabled={isScanning}
              className="h-8 bg-pink-600 text-xs font-bold text-white hover:bg-pink-700 min-w-28 shadow-2xs"
            >
              <RefreshCw className={cn('mr-1.5 size-3.5', isScanning && 'animate-spin')} />
              {isScanning ? t('scanning') : t('scan')}
            </Button>
          </div>
        </div>

        {/* 第二行：状态过滤分组（与所选分类实时联动数字） */}
        <div className="flex flex-wrap items-center gap-1.5" aria-label={t('statusFilters')}>
          {statusFilters.map((filter) => {
            const isActive = activeStatus === filter.id;
            return (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => setActiveStatus(filter.id)}
                className={`h-7 px-2.5 text-xs font-bold rounded-md ${
                  isActive ? 'bg-foreground text-background dark:bg-foreground dark:text-background' : ''
                }`}
              >
                {zh ? filter.labelZh : filter.labelEn}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                    isActive ? 'bg-background/20 text-current' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {counts[filter.id]}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        {isNavigating && (
          <span role="status" className="flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" />
            Loading stories…
          </span>
        )}
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={groupCoverage} onChange={(event) => setGroupCoverage(event.target.checked)} />
          {browse ? 'Group similar coverage on this page' : zh ? '相似报道聚合' : 'Group similar coverage'}
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={hideLowScore} onChange={(event) => setHideLowScore(event.target.checked)} />
          {zh ? '仅看及格新闻 (分数 ≥ 50)' : 'Hide Low-Score / Noise (< 50)'}
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={reviewOnly} onChange={(event) => setReviewOnly(event.target.checked)} />
          {zh ? '仅看需人工复审' : 'Needs editorial review only'}
        </label>
        <span>
          {filteredCandidates.length} {zh ? '篇新闻' : 'articles'} · {coverageGroups.length} {zh ? '个分组' : 'groups'}{' '}
          (
          {activeStatus === 'shortlisted'
            ? 'Sorted by publication time: newest first'
            : zh
              ? '已按匹配分数从大到小排列'
              : 'Sorted by match score desc'}
          )
        </span>
      </div>
      {/* 候选新闻列表 */}
      {filteredCandidates.length === 0 ? (
        <Card className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <SearchX className="mb-3 size-8 text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">{t('emptyTitle')}</h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {searchQuery
              ? zh
                ? `未找到与 “${searchQuery}” 匹配的新闻，请尝试其他关键词。`
                : 'No matching stories found.'
              : t('emptyDescription')}
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs divide-y divide-border/60">
          {paginatedGroups.map(({ primary: candidate, articles }) => {
            const category = categoryDetails[candidate.category];
            const isPending = pendingId === candidate.id || submittingIds.has(candidate.id);
            const job = jobs[candidate.id];
            const completedSongs = songsByCandidate[candidate.id] ?? [];
            const latestSong = completedSongs[0];
            const studioHref =
              latestSong || job?.songId
                ? `/admin/create?songId=${encodeURIComponent(latestSong?.id || job?.songId || '')}`
                : `/admin/create?${new URLSearchParams({ content: candidate.sourceUrl, sourceTitle: candidate.sourceTitle, autoGenerate: 'false' })}`;

            const isShortlisted = candidate.status === 'shortlisted';
            const isJobFailed = job?.status === 'failed' || job?.workflowStatus === 'failed';
            const isAdoptedOrGenerating = (candidate.status === 'adopted' || !!job) && !isJobFailed;
            const hasVotes = candidate.voteStats && candidate.voteStats.todayVotes > 0;

            return (
              <article
                key={candidate.id}
                className={cn(
                  'group flex flex-col gap-3.5 p-4 transition-colors hover:bg-muted/20 md:flex-row md:items-start md:justify-between',
                  candidate.status === 'dismissed' && !latestSong && 'opacity-60'
                )}
              >
                {/* 缩略图 + 核心内容 */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* 缩略图 */}
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted shadow-2xs">
                    {candidate.sourceImageUrl ? (
                      <img
                        src={candidate.sourceImageUrl}
                        alt=""
                        className="size-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-pink-500/10 to-violet-500/10 text-muted-foreground">
                        <Newspaper className="size-6 text-pink-500/60" />
                      </div>
                    )}
                  </div>

                  {/* 详情与标签 */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {candidate.aiScreening?.status === 'failed' && (
                      <p className="text-xs text-destructive break-words">
                        AI screening failed · original score retained. {candidate.aiScreening.error}
                      </p>
                    )}
                    {candidate.aiScreening?.status === 'completed' && (
                      <p className="text-xs text-muted-foreground">AI assessed · {candidate.aiScreening.reason}</p>
                    )}
                    {isJobFailed && (
                      <div
                        className="rounded-md border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive"
                        role="status"
                      >
                        <p className="break-words">
                          {job?.error || 'Production stopped. Open Studio to inspect and retry the failed stage.'}
                        </p>
                        <LocaleLink
                          href={studioHref}
                          className="mt-1 inline-block font-medium underline underline-offset-2"
                        >
                          Review and retry in Studio
                        </LocaleLink>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.status === 'new' && candidate.matchedTerms.length === 0 && (
                        <Badge variant="outline">Needs review · suggested topic</Badge>
                      )}
                      {getStoryFreshness(candidate.publishedAt) === 'older' && (
                        <Badge variant="outline">Older than 3 days</Badge>
                      )}
                      {getStoryFreshness(candidate.publishedAt) === 'unknown' && (
                        <Badge variant="outline">Date unknown</Badge>
                      )}
                      {getStoryFreshness(candidate.publishedAt) === 'future' && (
                        <Badge variant="outline">Check publication date</Badge>
                      )}
                    </div>
                    {articles.length > 1 && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer">{articles.length} similar reports · view sources</summary>
                        <ul className="mt-2 space-y-1">
                          {articles.map((article) => (
                            <li key={article.id}>
                              <a
                                href={article.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2"
                              >
                                {article.sourceDomain}: {article.sourceTitle}
                              </a>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2">Turn off grouping to review or shortlist each article separately.</p>
                      </details>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {/* 已生成歌曲 */}
                      {latestSong && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400"
                        >
                          <Check className="mr-1 size-3" />
                          {zh ? '已生成歌曲' : 'Generated'}
                        </Badge>
                      )}

                      {/* 制作中/失败状态徽标（未生成歌曲且处于制作中或已失败） */}
                      {!latestSong && (candidate.status === 'adopted' || !!job) && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-bold',
                            isJobFailed
                              ? 'border-destructive/30 bg-destructive/10 text-destructive'
                              : 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                          )}
                        >
                          {isJobFailed ? (
                            <>
                              <X className="mr-1 size-3" />
                              {zh ? '制作失败' : 'Failed'}
                            </>
                          ) : (
                            <>
                              <Loader2 className="mr-1 size-3 animate-spin" />
                              {job?.stage
                                ? `${zh ? '制作中' : 'Generating'} · ${job.stage}`
                                : zh
                                  ? '制作中'
                                  : 'In Production'}
                            </>
                          )}
                        </Badge>
                      )}

                      {/* 首页精选（投票池） */}
                      {isShortlisted && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400"
                        >
                          <Flame className="mr-1 size-3 text-emerald-600" />
                          {zh ? '⭐️ 首页精选 (投票池)' : '⭐️ Shortlisted'}
                        </Badge>
                      )}

                      {/* 读者投票热度反哺 */}
                      {hasVotes && (
                        <Badge
                          variant="outline"
                          className="border-pink-500/30 bg-pink-500/10 font-black text-pink-700 dark:text-pink-300"
                        >
                          <Flame className="mr-1 size-3 text-pink-600 animate-pulse" />
                          {zh
                            ? `今日投票 ${candidate.voteStats?.todayVotes} 票 (第 ${candidate.voteStats?.rank} 名)`
                            : `${candidate.voteStats?.todayVotes} votes (#${candidate.voteStats?.rank})`}
                        </Badge>
                      )}

                      <Badge variant="outline" className={`font-bold ${category.className}`}>
                        {t(`categories.${category.labelKey}`)}
                      </Badge>

                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Globe className="size-3 text-muted-foreground/60" />
                        {candidate.sourceDomain}
                      </span>
                      {candidate.publishedAgo && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{candidate.publishedAgo}</span>
                        </>
                      )}
                    </div>

                    {/* 已生成歌曲试听条 */}
                    {latestSong && (
                      <div className="space-y-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-foreground">
                            ♫ {latestSong.title}
                            <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                              · {latestSong.isPublished ? (zh ? '已发布' : 'Published') : zh ? '未发布' : 'Unpublished'}
                            </span>
                          </p>
                        </div>
                        <audio
                          controls
                          preload="none"
                          src={latestSong.audioUrl}
                          aria-label={`${zh ? '试听' : 'Preview'} ${latestSong.title}`}
                          className="h-7 w-full max-w-md"
                        >
                          <track kind="captions" />
                        </audio>
                        {completedSongs.length > 1 && (
                          <details className="text-[11px] text-muted-foreground">
                            <summary className="cursor-pointer font-medium hover:text-foreground">
                              {zh
                                ? `查看全部 ${completedSongs.length} 个版本`
                                : `View all ${completedSongs.length} versions`}
                            </summary>
                            <ul className="mt-1 space-y-1 pl-2">
                              {completedSongs.map((version) => (
                                <li key={version.id}>
                                  {version.isPublished ? (
                                    <Link
                                      className="font-semibold underline underline-offset-4 hover:text-pink-600"
                                      href={`/songs/${version.id}`}
                                    >
                                      {version.title} · {zh ? '查看歌曲' : 'View'}
                                    </Link>
                                  ) : (
                                    <LocaleLink
                                      className="font-semibold underline underline-offset-4 hover:text-pink-600"
                                      href={`/admin/create?songId=${version.id}`}
                                    >
                                      {version.title} · {zh ? '创作台预览' : 'Preview'}
                                    </LocaleLink>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    )}

                    <a
                      href={candidate.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs font-bold leading-snug text-foreground hover:text-pink-600 hover:underline dark:hover:text-pink-400"
                    >
                      {candidate.sourceTitle}
                    </a>

                    {!!candidate.trendSignals?.length && (
                      <div
                        className="space-y-1 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5 text-xs"
                        aria-label="Google Trends context"
                      >
                        {candidate.trendSignals.map((signal) => (
                          <p key={`${signal.region}:${signal.term}`}>
                            <strong>Google Trends · {signal.region}</strong> · {signal.term}
                            {signal.approximateTraffic && ` · ${signal.approximateTraffic} searches (approx.)`}
                            <span className="block text-[10px] text-muted-foreground">
                              Observed {signal.observedAt.replace('T', ' ').slice(0, 16)} UTC
                              {signal.startedAt &&
                                ` · Trend started ${signal.startedAt.replace('T', ' ').slice(0, 16)} UTC`}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      {candidate.relevanceScore >= 80 ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300"
                        >
                          🔥{' '}
                          {zh
                            ? `匹配分: ${candidate.relevanceScore} (绝佳题材)`
                            : `Score: ${candidate.relevanceScore} (Top Match)`}
                        </Badge>
                      ) : candidate.relevanceScore >= 50 ? (
                        <Badge
                          variant="outline"
                          className="border-pink-500/30 bg-pink-500/10 font-bold text-pink-700 dark:text-pink-300"
                        >
                          ✨{' '}
                          {zh ? `匹配分: ${candidate.relevanceScore} (娱乐八卦)` : `Score: ${candidate.relevanceScore}`}
                        </Badge>
                      ) : candidate.relevanceScore > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/60 font-medium text-muted-foreground"
                        >
                          {zh ? `匹配分: ${candidate.relevanceScore}` : `Score: ${candidate.relevanceScore}`}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 font-medium text-amber-700 dark:text-amber-400"
                        >
                          ⚠️ {zh ? '匹配分: 0 (待审/不符)' : 'Score: 0 (Unmatched)'}
                        </Badge>
                      )}
                      {candidate.matchedTerms.length > 0 && (
                        <span className="truncate text-muted-foreground">
                          {t('matched', { terms: candidate.matchedTerms.join(', ') })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作动作栏：根据候选状态清晰分层 */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-dashed border-border/60 pt-2.5 md:border-t-0 md:pt-0 shrink-0 md:justify-end">
                  {/* 查看原文链接 */}
                  <Button
                    asChild
                    size="icon-sm"
                    variant="ghost"
                    className="size-7.5 text-muted-foreground hover:text-foreground"
                  >
                    <a
                      href={candidate.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('openOriginal')}
                      title="打开新闻原文"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>

                  {/* 状态 1: 新增待精选 (new) -> 可加入精选、可一键AI制作、可进创作台、可忽略 */}
                  {!latestSong && candidate.status === 'new' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => updateStatus(candidate.id, 'dismissed')}
                        className="h-7.5 px-2 text-xs font-bold text-muted-foreground hover:text-destructive"
                        title="忽略此新闻"
                      >
                        <X className="mr-1 size-3" /> {t('dismiss')}
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7.5 px-2.5 text-xs font-bold"
                        title="在工坊中手动编辑"
                      >
                        <LocaleLink href={studioHref}>{t('openStudio')}</LocaleLink>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => updateStatus(candidate.id, 'shortlisted')}
                        className="h-7.5 px-2.5 text-xs font-bold border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                        title="加入首页大众投票精选池"
                      >
                        <Check className="mr-1 size-3" /> {zh ? '加入精选' : 'Shortlist'}
                      </Button>

                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => openInStudio(candidate.id)}
                        className="h-7.5 px-3 text-xs font-bold bg-pink-600 text-white hover:bg-pink-700"
                        title="一键入队后台 AI 制作"
                      >
                        {isPending ? (
                          <Loader2 className="mr-1.5 size-3 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 size-3" />
                        )}
                        {zh ? 'AI 制作' : 'Generate'}
                      </Button>
                    </>
                  )}

                  {/* 状态 2: 已首页精选 (shortlisted) -> 可移出精选、可进工坊、可AI制作 */}
                  {!latestSong && candidate.status === 'shortlisted' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => updateStatus(candidate.id, 'new')}
                        className="h-7.5 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                        title="从首页投票池撤回，恢复为待精选"
                      >
                        <RotateCcw className="mr-1 size-3" /> {zh ? '移出精选' : 'Un-shortlist'}
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7.5 px-2.5 text-xs font-bold"
                        title="在工坊中手动编辑"
                      >
                        <LocaleLink href={studioHref}>{t('openStudio')}</LocaleLink>
                      </Button>

                      <Button
                        size="sm"
                        disabled={isPending || isAdoptedOrGenerating}
                        onClick={() => openInStudio(candidate.id)}
                        className="h-7.5 px-3 text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 min-w-24"
                      >
                        {isPending ? (
                          <Loader2 className="mr-1.5 size-3 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 size-3" />
                        )}
                        {isPending ? (zh ? '正在入队' : 'Submitting') : zh ? 'AI 制作' : t('createSong')}
                      </Button>
                    </>
                  )}

                  {/* 状态 3: 制作中 (adopted) -> 展示排队/生成状态与重试 */}
                  {!latestSong && candidate.status === 'adopted' && (
                    <>
                      <Button asChild size="sm" variant="outline" className="h-7.5 px-2.5 text-xs font-bold">
                        <LocaleLink href={studioHref}>{t('openStudio')}</LocaleLink>
                      </Button>

                      <Button
                        size="sm"
                        disabled={isPending || isAdoptedOrGenerating}
                        onClick={() => openInStudio(candidate.id)}
                        className="h-7.5 px-3 text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 min-w-24"
                      >
                        {isPending ? (
                          <Loader2 className="mr-1.5 size-3 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 size-3" />
                        )}
                        {isPending
                          ? zh
                            ? '正在入队'
                            : 'Submitting'
                          : job
                            ? job.workflowStatus === 'completed'
                              ? zh
                                ? '已完成'
                                : 'Completed'
                              : job.status === 'failed'
                                ? zh
                                  ? '重试任务'
                                  : 'Retry'
                                : job.workflowStatus === 'failed'
                                  ? zh
                                    ? '失败 · 重试'
                                    : 'Failed'
                                  : job.status === 'queued'
                                    ? zh
                                      ? '已排队'
                                      : 'Queued'
                                    : zh
                                      ? '制作中'
                                      : 'Generating'
                            : zh
                              ? '重新制作'
                              : 'Re-generate'}
                      </Button>
                    </>
                  )}

                  {/* 状态 4: 已生成歌曲 (generated) -> 试听、查看、工坊调优、支持手动加入/移出精选 */}
                  {latestSong && (
                    <>
                      {isShortlisted ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => updateStatus(candidate.id, 'new')}
                          className="h-7.5 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                          title="从首页投票池撤回，恢复为待精选"
                        >
                          <RotateCcw className="mr-1 size-3" /> {zh ? '移出精选' : 'Un-shortlist'}
                        </Button>
                      ) : (
                        candidate.status !== 'dismissed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => updateStatus(candidate.id, 'shortlisted')}
                            className="h-7.5 px-2.5 text-xs font-bold border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                            title="加入首页大众投票精选池"
                          >
                            <Check className="mr-1 size-3" /> {zh ? '加入精选' : 'Shortlist'}
                          </Button>
                        )
                      )}

                      <Button asChild size="sm" variant="outline" className="h-7.5 px-2.5 text-xs font-bold">
                        <LocaleLink href={studioHref}>{zh ? '工坊调优' : 'Studio Edit'}</LocaleLink>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        className="h-7.5 px-3 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {latestSong.isPublished ? (
                          <Link href={`/songs/${latestSong.id}`}>{zh ? '查看歌曲' : 'View'}</Link>
                        ) : (
                          <LocaleLink href={studioHref}>{zh ? '预览/发布' : 'Preview'}</LocaleLink>
                        )}
                      </Button>
                    </>
                  )}

                  {/* 状态 5: 已忽略 (dismissed) -> 恢复 */}
                  {!latestSong && candidate.status === 'dismissed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => updateStatus(candidate.id, 'new')}
                      className="h-7.5 px-2.5 text-xs font-bold"
                    >
                      <RotateCcw className="mr-1 size-3" /> {zh ? '恢复为待精选' : t('restore')}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 分页控制栏 */}
      {filteredCandidates.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-1 px-1">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-medium">
            <span>
              {zh
                ? `显示第 ${(safeCurrentPage - 1) * pageSize + 1} - ${Math.min(safeCurrentPage * pageSize, totalItems)} 条 · 共 ${totalItems} 条`
                : `Showing ${(safeCurrentPage - 1) * pageSize + 1}-${Math.min(safeCurrentPage * pageSize, totalItems)} of ${totalItems} stories`}
            </span>
            <div className="flex items-center gap-1 ml-1">
              <span className="text-muted-foreground/50">|</span>
              <span className="text-[11px] ml-1">{zh ? '每页' : 'Per page'}:</span>
              {[10, 20, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[11px] font-bold transition-colors cursor-pointer',
                    pageSize === size
                      ? 'bg-foreground text-background dark:bg-foreground dark:text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isNavigating || safeCurrentPage <= 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-8 px-2.5 text-xs font-bold"
              >
                <ChevronLeft className="size-3.5 mr-0.5" />
                {zh ? '上一页' : 'Prev'}
              </Button>

              <div className="flex items-center gap-1">
                {generatePagination(safeCurrentPage, totalPages).map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-muted-foreground">
                        …
                      </span>
                    );
                  }
                  const pageNum = Number(item);
                  const isCurrent = pageNum === safeCurrentPage;
                  return (
                    <Button
                      key={`page-${pageNum}`}
                      type="button"
                      variant={isCurrent ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        'h-8 min-w-8 px-2 text-xs font-bold',
                        isCurrent && 'bg-pink-600 text-white hover:bg-pink-700'
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isNavigating || safeCurrentPage >= totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-8 px-2.5 text-xs font-bold"
              >
                {zh ? '下一页' : 'Next'}
                <ChevronRight className="size-3.5 ml-0.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
