'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocaleRouter } from '@/i18n/navigation';
import type { StoryCandidateStatus, StoryRadarCategory } from '@/lib/story-radar/types';
import { ArrowUpRight, BarChart3, Loader2, Newspaper, Sparkles, Users, Vote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

export interface StoryVoteResultView {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  sourceImageUrl: string | null;
  category: StoryRadarCategory;
  status: StoryCandidateStatus;
  todayVotes: number;
  threeDayVotes: number;
  uniqueVoters: number;
  weightedScore: number;
  share: number;
}

interface StoryVoteResultsProps {
  results: StoryVoteResultView[];
  summary: {
    selections: number;
    voters: number;
    stories: number;
  };
}

const categoryKeys: Record<StoryRadarCategory, 'celebrityDrama' | 'internetChaos' | 'absurdHeadlines'> = {
  celebrity_drama: 'celebrityDrama',
  internet_chaos: 'internetChaos',
  absurd_headlines: 'absurdHeadlines',
};

export function StoryVoteResults({ results, summary }: StoryVoteResultsProps) {
  const t = useTranslations('Dashboard.admin.voteResults');
  const router = useLocaleRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function openInStudio(candidateId: string) {
    setPendingId(candidateId);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`/api/admin/story-radar/${candidateId}/adopt`, {
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
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-8 md:px-8" aria-labelledby="vote-results-heading">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 id="vote-results-heading" className="text-2xl font-semibold tracking-tight">
            {t('title')}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('description')}</p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1.5 text-xs">
          {t('liveUpdate')}
        </Badge>
      </div>

      <div className="grid border-x border-b sm:grid-cols-3">
        <div className="flex items-center gap-3 border-b p-4 sm:border-b-0 sm:border-r">
          <Users className="size-5 text-primary" />
          <div>
            <p className="text-2xl font-semibold tabular-nums">{summary.voters}</p>
            <p className="text-xs text-muted-foreground">{t('uniqueVoters')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-b p-4 sm:border-b-0 sm:border-r">
          <Vote className="size-5 text-primary" />
          <div>
            <p className="text-2xl font-semibold tabular-nums">{summary.selections}</p>
            <p className="text-xs text-muted-foreground">{t('storySelections')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <BarChart3 className="size-5 text-primary" />
          <div>
            <p className="text-2xl font-semibold tabular-nums">{summary.stories}</p>
            <p className="text-xs text-muted-foreground">{t('storiesReceivingVotes')}</p>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center border-x border-b bg-muted/15 px-6 text-center">
          <Vote className="mb-3 size-7 text-muted-foreground" />
          <h2 className="font-semibold">{t('emptyTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className="grid border-x border-b lg:grid-cols-2">
          {results.map((result, index) => (
            <article
              key={result.id}
              className="relative grid min-w-0 grid-cols-[2.75rem_4.5rem_minmax(0,1fr)] items-center gap-3 border-b p-3 last:border-b-0 lg:odd:border-r xl:grid-cols-[2.75rem_4.5rem_minmax(0,1fr)_auto]"
            >
              <span className="text-center text-lg font-semibold tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-muted">
                {result.sourceImageUrl ? (
                  <img src={result.sourceImageUrl} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <Newspaper className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] font-medium text-muted-foreground">
                  <span className="text-primary">{t(`categories.${categoryKeys[result.category]}`)}</span>
                  <span>/</span>
                  <span>{t(`statuses.${result.status}`)}</span>
                </div>
                <a
                  href={result.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 line-clamp-2 block text-sm font-semibold leading-5 hover:text-primary hover:underline"
                >
                  {result.sourceTitle}
                </a>
                <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
                  {t('voteBreakdown', {
                    today: result.todayVotes,
                    threeDays: result.threeDayVotes,
                    voters: result.uniqueVoters,
                  })}
                </p>
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2 border-t pt-2 xl:col-span-1 xl:border-t-0 xl:pt-0 xl:pl-2">
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums">{result.share}%</p>
                  <p className="text-[0.65rem] text-muted-foreground">{t('weighted')}</p>
                </div>
                <a
                  href={result.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('openSource', { domain: result.sourceDomain })}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ArrowUpRight className="size-4" />
                </a>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openInStudio(result.id)}
                  disabled={pendingId === result.id}
                  className="min-w-28"
                >
                  {pendingId === result.id ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {pendingId === result.id
                    ? t('openingStudio')
                    : result.status === 'adopted'
                      ? t('openStudio')
                      : t('createSong')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
