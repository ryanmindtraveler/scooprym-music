'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LocaleLink, useLocaleRouter } from '@/i18n/navigation';
import type { StoryCandidateStatus, StoryRadarCategory } from '@/lib/story-radar/types';
import { cn } from '@/lib/utils';
import { groupRadarSongs, type RadarGeneratedSong } from '@/lib/story-radar/generated-song-view';
import { Check, ExternalLink, Loader2, Newspaper, RefreshCw, RotateCcw, SearchX, Sparkles, X } from 'lucide-react';
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
}

const categoryDetails: Record<
  StoryRadarCategory,
  { labelKey: 'celebrityDrama' | 'internetChaos' | 'absurdHeadlines'; className: string }
> = {
  celebrity_drama: {
    labelKey: 'celebrityDrama',
    className: 'border-pink-200 bg-pink-50 text-pink-800 dark:border-pink-900 dark:bg-pink-950 dark:text-pink-200',
  },
  internet_chaos: {
    labelKey: 'internetChaos',
    className: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200',
  },
  absurd_headlines: {
    labelKey: 'absurdHeadlines',
    className:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  },
};

const statusFilters: Array<{ id: 'all' | 'generated' | StoryCandidateStatus }> = [
  { id: 'all' },
  { id: 'new' },
  { id: 'shortlisted' },
  { id: 'adopted' },
  { id: 'generated' },
  { id: 'dismissed' },
];

export function StoryRadar({ candidates }: { candidates: StoryRadarCandidateView[] }) {
  const t = useTranslations('Dashboard.admin.storyRadar');
  const router = useLocaleRouter();
  const zh = useLocale() === 'zh';
  const submitting = useRef(new Set<string>());
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Record<string, { status: string; workflowStatus?: string; stage?: string }>>({});
  const [generated, setGenerated] = useState<Record<string, RadarGeneratedSong[]> | null>(null);
  const songsByCandidate =
    generated ?? Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate.generatedSongs ?? []]));
  const effectiveStatus = (candidate: StoryRadarCandidateView) =>
    songsByCandidate[candidate.id]?.length ? 'generated' : candidate.status;
  const refreshJobs = async (signal?: AbortSignal) => {
    try {
      const timeout = AbortSignal.timeout(10_000);
      const response = await fetch('/api/admin/story-radar/jobs', {
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout, cache: 'no-store',
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
  const [activeStatus, setActiveStatus] = useState<'all' | 'generated' | StoryCandidateStatus>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | StoryRadarCategory>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filteredCandidates = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          (activeStatus === 'all' || effectiveStatus(candidate) === activeStatus) &&
          (activeCategory === 'all' || candidate.category === activeCategory)
      ),
    [activeCategory, activeStatus, candidates, generated]
  );

  const counts = useMemo(
    () => ({
      all: candidates.length,
      new: candidates.filter((candidate) => effectiveStatus(candidate) === 'new').length,
      shortlisted: candidates.filter((candidate) => effectiveStatus(candidate) === 'shortlisted').length,
      adopted: candidates.filter((candidate) => effectiveStatus(candidate) === 'adopted').length,
      dismissed: candidates.filter((candidate) => effectiveStatus(candidate) === 'dismissed').length,
      generated: candidates.filter((candidate) => effectiveStatus(candidate) === 'generated').length,
    }),
    [candidates, generated]
  );

  async function scanLatestStories() {
    setIsScanning(true);
    try {
      const response = await fetch('/api/admin/story-radar/refresh', { method: 'POST' });
      const result = (await response.json()) as {
        success: boolean;
        discovered?: number;
        added?: number;
        error?: string;
      };
      if (!response.ok || !result.success) throw new Error(result.error || 'Scan failed');

      toast.success(
        result.added
          ? `${result.added} new candidates added from ${result.discovered ?? result.added} matches.`
          : 'Scan complete. No new matching stories were found.'
      );
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
          ? 'Story shortlisted and prioritized for the homepage vote.'
          : status === 'dismissed'
            ? 'Story dismissed.'
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
    // 开发模式首次编译可能超过 15 秒；接口只负责入队，不等待歌词生成。
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
        zh ? '已加入后台队列，可以继续选择其他新闻。' : 'Added to the background queue. You can select more stories.'
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        const recovered = (await refreshJobs())?.find((job) => job.candidateId === id);
        if (recovered && recovered.status !== 'failed') {
          toast.success(zh ? '已确认任务已保存，后台将继续执行。' : 'Task confirmed. Background processing will continue.');
        } else {
          toast.error(recovered
            ? (zh ? '任务投递失败，请重试这条新闻。' : 'Queue delivery failed. Please retry this story.')
            : (zh ? '尚未确认任务入队，请重试；相同新闻会复用同一个任务。' : 'Queue acceptance is not confirmed. Retry will reuse the same story task.'));
        }
        return;
      }
      toast.error(
        error instanceof Error
            ? error.message
            : t('openStudioError')
      );
      void refreshJobs();
    } finally {
      window.clearTimeout(timeoutId);
      submitting.current.delete(id);
      setSubmittingIds(new Set(submitting.current));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/create')}>
            {zh ? '查看创作队列' : 'View creation queue'}
          </Button>
          <Button onClick={scanLatestStories} disabled={isScanning} className="min-w-40">
            <RefreshCw className={cn('size-4', isScanning && 'motion-safe:animate-spin')} />
            {isScanning ? t('scanning') : t('scan')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex flex-wrap gap-2" aria-label={t('statusFilters')}>
          {statusFilters.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              size="sm"
              variant={activeStatus === filter.id ? 'secondary' : 'ghost'}
              aria-pressed={activeStatus === filter.id}
              onClick={() => setActiveStatus(filter.id)}
              className="rounded-lg"
            >
              {filter.id === 'generated' ? (zh ? '已生成' : 'Generated') : t(`statuses.${filter.id}`)}
              <span className="text-xs tabular-nums text-muted-foreground">{counts[filter.id]}</span>
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" aria-label={t('categoryFilters')}>
          <Button
            type="button"
            size="sm"
            variant={activeCategory === 'all' ? 'outline' : 'ghost'}
            aria-pressed={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          >
            {t('allTopics')}
          </Button>
          {Object.entries(categoryDetails).map(([id, details]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={activeCategory === id ? 'outline' : 'ghost'}
              aria-pressed={activeCategory === id}
              onClick={() => setActiveCategory(id as StoryRadarCategory)}
            >
              {t(`categories.${details.labelKey}`)}
            </Button>
          ))}
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
          <SearchX className="mb-4 size-8 text-muted-foreground" />
          <h2 className="font-semibold">{t('emptyTitle')}</h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredCandidates.map((candidate) => {
            const category = categoryDetails[candidate.category];
            const isPending = pendingId === candidate.id || submittingIds.has(candidate.id);
            const job = jobs[candidate.id];
            const completedSongs = songsByCandidate[candidate.id] ?? [];
            const latestSong = completedSongs[0];
            const studioHref = latestSong
              ? `/admin/create?songId=${encodeURIComponent(latestSong.id)}`
              : `/admin/create?${new URLSearchParams({ content: candidate.sourceUrl, sourceTitle: candidate.sourceTitle, autoGenerate: 'false' })}`;

            return (
              <article
                key={candidate.id}
                className={cn(
                  'grid gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/20 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center',
                  candidate.status === 'dismissed' && !latestSong && 'opacity-60'
                )}
              >
                <div
                  className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-muted bg-cover bg-center"
                  style={
                    candidate.sourceImageUrl
                      ? { backgroundImage: `url(${JSON.stringify(candidate.sourceImageUrl).slice(1, -1)})` }
                      : undefined
                  }
                  aria-hidden="true"
                >
                  {!candidate.sourceImageUrl && <Newspaper className="size-6 text-muted-foreground" />}
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {latestSong && (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200" variant="outline">
                        <Check className="mr-1 size-3" />
                        {zh ? '已生成' : 'Generated'}
                      </Badge>
                    )}
                    <Badge variant="outline" className={category.className}>
                      {t(`categories.${category.labelKey}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{candidate.sourceDomain}</span>
                    {candidate.publishedAgo && (
                      <span className="text-xs text-muted-foreground">{candidate.publishedAgo}</span>
                    )}
                  </div>
                  {latestSong && (
                    <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                      <p className="text-sm font-medium">
                        ♫ {latestSong.title}{' '}
                        <span className="text-xs text-muted-foreground">
                          · {latestSong.isPublished ? (zh ? '已发布' : 'Published') : zh ? '未发布' : 'Unpublished'}
                        </span>
                      </p>
                      <audio
                        controls
                        preload="none"
                        src={latestSong.audioUrl}
                        aria-label={`${zh ? '试听' : 'Preview'} ${latestSong.title}`}
                        className="h-8 w-full max-w-sm"
                      />
                      {completedSongs.length > 1 && (
                        <details>
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            {zh
                              ? `查看全部 ${completedSongs.length} 个版本`
                              : `View all ${completedSongs.length} versions`}
                          </summary>
                          <ul className="mt-2 space-y-2 text-sm">
                            {completedSongs.map((version) => (
                              <li key={version.id}>
                                <LocaleLink
                                  className="underline underline-offset-4"
                                  href={
                                    version.isPublished ? `/songs/${version.id}` : `/admin/create?songId=${version.id}`
                                  }
                                >
                                  {version.title} ·{' '}
                                  {version.isPublished
                                    ? zh
                                      ? '查看歌曲'
                                      : 'View song'
                                    : zh
                                      ? '工作台预览'
                                      : 'Studio preview'}
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
                    className="block text-base font-semibold leading-6 text-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {candidate.sourceTitle}
                  </a>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{t('matchScore', { score: candidate.relevanceScore })}</span>
                    {candidate.matchedTerms.length > 0 && (
                      <span className="truncate">{t('matched', { terms: candidate.matchedTerms.join(', ') })}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <Button asChild size="icon-sm" variant="ghost" aria-label={t('openOriginal')}>
                    <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                    </a>
                  </Button>
                  {(candidate.status !== 'dismissed' || latestSong) && (
                    <Button asChild size="sm" variant="outline">
                      <LocaleLink href={studioHref}>
                        <ExternalLink /> {t('openStudio')}
                      </LocaleLink>
                    </Button>
                  )}
                  {latestSong && (
                    <Button asChild size="sm">
                      <LocaleLink href={latestSong.isPublished ? `/songs/${latestSong.id}` : studioHref}>
                        {latestSong.isPublished ? (zh ? '查看歌曲' : 'View song') : zh ? '预览歌曲' : 'Preview song'}
                      </LocaleLink>
                    </Button>
                  )}
                  {!latestSong && candidate.status === 'new' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => updateStatus(candidate.id, 'dismissed')}
                      >
                        <X /> {t('dismiss')}
                      </Button>
                      <Button size="sm" disabled={isPending} onClick={() => updateStatus(candidate.id, 'shortlisted')}>
                        <Check /> {t('shortlist')}
                      </Button>
                    </>
                  )}
                  {!latestSong && (candidate.status === 'shortlisted' || candidate.status === 'adopted') && (
                    <Button
                      size="sm"
                      disabled={isPending || (!!job && job.status !== 'failed')}
                      onClick={() => openInStudio(candidate.id)}
                    >
                      {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
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
                                : 'Retry job'
                              : job.workflowStatus === 'failed'
                                ? zh
                                  ? '失败 · 查看创作队列'
                                  : 'Failed · Check studio queue'
                                : job.status === 'queued'
                                  ? zh
                                    ? '已排队'
                                    : 'Queued'
                                  : zh
                                    ? '制作中'
                                    : 'Generating'
                          : t('createSong')}
                    </Button>
                  )}
                  {!latestSong && candidate.status !== 'new' && candidate.status !== 'adopted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => updateStatus(candidate.id, 'new')}
                    >
                      <RotateCcw /> {t('restore')}
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
