'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocaleLink, useLocaleRouter } from '@/i18n/navigation';
import { type RadarGeneratedSong, groupRadarSongs } from '@/lib/story-radar/generated-song-view';
import type { StoryCandidateStatus, StoryRadarCategory } from '@/lib/story-radar/types';
import { cn } from '@/lib/utils';
import {
  Check,
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface StoryRadarCandidateView {
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

export function StoryRadar({ candidates }: { candidates: StoryRadarCandidateView[] }) {
  const t = useTranslations('Dashboard.admin.storyRadar');
  const router = useLocaleRouter();
  const zh = useLocale() === 'zh';
  const submitting = useRef(new Set<string>());
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Record<string, { status: string; workflowStatus?: string; stage?: string }>>({});
  const [generated, setGenerated] = useState<Record<string, RadarGeneratedSong[]> | null>(null);

  const [activeStatus, setActiveStatus] = useState<'all' | 'generated' | StoryCandidateStatus>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | StoryRadarCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const songsByCandidate =
    generated ?? Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate.generatedSongs ?? []]));
  const isCandidateGenerated = (c: StoryRadarCandidateView) => (songsByCandidate[c.id]?.length ?? 0) > 0;

  const matchesStatus = (candidate: StoryRadarCandidateView, status: typeof activeStatus) => {
    if (status === 'all') return true;
    if (status === 'generated') return isCandidateGenerated(candidate);
    if (status === 'shortlisted') return candidate.status === 'shortlisted';
    if (status === 'new') return candidate.status === 'new';
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
      const response = await fetch('/api/admin/story-radar/jobs', {
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        cache: 'no-store',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (signal?.aborted) return;
      if (Array.isArray(data.generatedSongs)) setGenerated(groupRadarSongs(data.generatedSongs));
      if (Array.isArray(data.jobs))
        setJobs(Object.fromEntries(data.jobs.map((job: { candidateId: string }) => [job.candidateId, job])));
      return data.jobs as Array<{ candidateId: string; status: string }> | undefined;
    } catch {
      /* 临时网络中断保留当前队列状态。 */
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await refreshJobs(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(poll, 10_000);
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  const filteredCandidates = useMemo(
    () =>
      candidates.filter((candidate) => {
        const matchesCategory = activeCategory === 'all' || candidate.category === activeCategory;
        if (!matchesCategory || !matchesStatus(candidate, activeStatus)) return false;
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();
        return (
          candidate.sourceTitle.toLowerCase().includes(query) ||
          candidate.sourceDomain.toLowerCase().includes(query) ||
          candidate.matchedTerms.some((term) => term.toLowerCase().includes(query))
        );
      }),
    [activeCategory, activeStatus, candidates, generated, jobs, searchQuery]
  );

  // 状态计数动态联动当前所选类别，制作中排查已生成，精选由管理员决定
  const counts = useMemo(() => {
    const categoryMatched = candidates.filter((c) => activeCategory === 'all' || c.category === activeCategory);
    return {
      all: categoryMatched.length,
      new: categoryMatched.filter((c) => c.status === 'new').length,
      shortlisted: categoryMatched.filter((c) => c.status === 'shortlisted').length,
      adopted: categoryMatched.filter((c) => !isCandidateGenerated(c) && (c.status === 'adopted' || !!jobs[c.id]))
        .length,
      dismissed: categoryMatched.filter((c) => c.status === 'dismissed').length,
      generated: categoryMatched.filter((c) => isCandidateGenerated(c)).length,
    };
  }, [activeCategory, candidates, generated, jobs]);

  async function scanLatestStories() {
    setIsScanning(true);
    try {
      const response = await fetch('/api/admin/story-radar/refresh', { method: 'POST' });
      const result = (await response.json()) as {
        success: boolean;
        discovered?: number;
        stored?: number;
        shortlisted?: number;
        error?: string;
      };
      if (!response.ok || !result.success) throw new Error(result.error || 'Scan failed');

      const countDiscovered = result.discovered ?? 0;
      const countStored = result.stored ?? countDiscovered;
      const countShortlisted = result.shortlisted ?? 0;

      if (countDiscovered > 0 || countStored > 0) {
        toast.success(
          zh
            ? `全网扫描完成：发现 ${countDiscovered} 条新闻，入库 ${countStored} 条，精选 ${countShortlisted} 条。`
            : `Scan complete: ${countDiscovered} discovered, ${countStored} stored, ${countShortlisted} shortlisted.`
        );
      } else {
        toast.info(zh ? '全网扫描完成，暂无新的匹配新闻。' : 'Scan complete. No new matching stories found.');
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh Story Radar');
    } finally {
      setIsScanning(false);
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
              onClick={scanLatestStories}
              disabled={isScanning}
              className="h-8 bg-pink-600 text-xs font-bold text-white hover:bg-pink-700 min-w-32 shadow-2xs"
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
          {filteredCandidates.map((candidate) => {
            const category = categoryDetails[candidate.category];
            const isPending = pendingId === candidate.id || submittingIds.has(candidate.id);
            const job = jobs[candidate.id];
            const completedSongs = songsByCandidate[candidate.id] ?? [];
            const latestSong = completedSongs[0];
            const studioHref = latestSong
              ? `/admin/create?songId=${encodeURIComponent(latestSong.id)}`
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
                                  <LocaleLink
                                    className="font-semibold underline underline-offset-4 hover:text-pink-600"
                                    href={
                                      version.isPublished
                                        ? `/songs/${version.id}`
                                        : `/admin/create?songId=${version.id}`
                                    }
                                  >
                                    {version.title} ·{' '}
                                    {version.isPublished ? (zh ? '查看歌曲' : 'View') : zh ? '创作台预览' : 'Preview'}
                                  </LocaleLink>
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

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.2 font-mono font-bold text-foreground">
                        {t('matchScore', { score: candidate.relevanceScore })}
                      </span>
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
                        <LocaleLink href={latestSong.isPublished ? `/songs/${latestSong.id}` : studioHref}>
                          {latestSong.isPublished ? (zh ? '查看歌曲' : 'View') : zh ? '预览/发布' : 'Preview'}
                        </LocaleLink>
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
    </div>
  );
}
