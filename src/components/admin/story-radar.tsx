'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocaleRouter } from '@/i18n/navigation';
import type { StoryCandidateStatus, StoryRadarCategory } from '@/lib/story-radar/types';
import { cn } from '@/lib/utils';
import { Check, ExternalLink, Loader2, Newspaper, RefreshCw, RotateCcw, SearchX, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface StoryRadarCandidateView {
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

const statusFilters: Array<{ id: 'all' | StoryCandidateStatus }> = [
  { id: 'all' },
  { id: 'new' },
  { id: 'shortlisted' },
  { id: 'adopted' },
  { id: 'dismissed' },
];

export function StoryRadar({ candidates }: { candidates: StoryRadarCandidateView[] }) {
  const t = useTranslations('Dashboard.admin.storyRadar');
  const router = useLocaleRouter();
  const [activeStatus, setActiveStatus] = useState<'all' | StoryCandidateStatus>('new');
  const [activeCategory, setActiveCategory] = useState<'all' | StoryRadarCategory>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filteredCandidates = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          (activeStatus === 'all' || candidate.status === activeStatus) &&
          (activeCategory === 'all' || candidate.category === activeCategory)
      ),
    [activeCategory, activeStatus, candidates]
  );

  const counts = useMemo(
    () => ({
      all: candidates.length,
      new: candidates.filter((candidate) => candidate.status === 'new').length,
      shortlisted: candidates.filter((candidate) => candidate.status === 'shortlisted').length,
      adopted: candidates.filter((candidate) => candidate.status === 'adopted').length,
      dismissed: candidates.filter((candidate) => candidate.status === 'dismissed').length,
    }),
    [candidates]
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
    setPendingId(id);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`/api/admin/story-radar/${id}/adopt`, {
        method: 'POST',
        signal: controller.signal,
      });
      const result = (await response.json()) as { success?: boolean; createUrl?: string; error?: string };
      if (!response.ok || !result.success || !result.createUrl) {
        throw new Error(result.error || 'Could not move this story into production');
      }
      router.push(result.createUrl);
    } catch (error) {
      toast.error(
        error instanceof DOMException && error.name === 'AbortError' ? t('openStudioTimeout') : t('openStudioError')
      );
      setPendingId(null);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={scanLatestStories} disabled={isScanning} className="min-w-40">
          <RefreshCw className={cn('size-4', isScanning && 'motion-safe:animate-spin')} />
          {isScanning ? t('scanning') : t('scan')}
        </Button>
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
              {t(`statuses.${filter.id}`)}
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
            const isPending = pendingId === candidate.id;

            return (
              <article
                key={candidate.id}
                className={cn(
                  'grid gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/20 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center',
                  candidate.status === 'dismissed' && 'opacity-60'
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
                    <Badge variant="outline" className={category.className}>
                      {t(`categories.${category.labelKey}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{candidate.sourceDomain}</span>
                    {candidate.publishedAgo && (
                      <span className="text-xs text-muted-foreground">{candidate.publishedAgo}</span>
                    )}
                  </div>
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

                <div className="flex items-center gap-2 md:justify-end">
                  <Button asChild size="icon-sm" variant="ghost" aria-label={t('openOriginal')}>
                    <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                    </a>
                  </Button>
                  {candidate.status === 'new' && (
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
                  {(candidate.status === 'shortlisted' || candidate.status === 'adopted') && (
                    <Button size="sm" disabled={isPending} onClick={() => openInStudio(candidate.id)}>
                      {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      {isPending
                        ? t('openingStudio')
                        : candidate.status === 'adopted'
                          ? t('openStudio')
                          : t('createSong')}
                    </Button>
                  )}
                  {candidate.status !== 'new' && candidate.status !== 'adopted' && (
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
