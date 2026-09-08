'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocaleRouter } from '@/i18n/navigation';
import type { StoryCandidateStatus, StoryRadarCategory } from '@/lib/story-radar/types';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Loader2,
  Newspaper,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useMemo, useState } from 'react';
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

const categoryClasses: Record<StoryRadarCategory, string> = {
  celebrity_drama: 'border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300',
  internet_chaos: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  absurd_headlines: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

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

export function StoryVoteResults({ results, summary }: StoryVoteResultsProps) {
  const t = useTranslations('Dashboard.admin.voteResults');
  const router = useLocaleRouter();
  const zh = useLocale() === 'zh';
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = results.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedResults = useMemo(
    () => results.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize),
    [results, safeCurrentPage, pageSize]
  );

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
    <div className="space-y-4">
      {/* 3 个核心投票指标卡 */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-muted-foreground">{t('uniqueVoters')}</p>
            <p className="mt-0.5 text-2xl font-black tracking-tight tabular-nums text-foreground">{summary.voters}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Vote className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-muted-foreground">{t('storySelections')}</p>
            <p className="mt-0.5 text-2xl font-black tracking-tight tabular-nums text-foreground">
              {summary.selections}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-muted-foreground">{t('storiesReceivingVotes')}</p>
            <p className="mt-0.5 text-2xl font-black tracking-tight tabular-nums text-foreground">{summary.stories}</p>
          </div>
        </div>
      </div>

      {/* 投票排行榜列表 */}
      {results.length === 0 ? (
        <Card className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <Vote className="mb-3 size-8 text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">{t('emptyTitle')}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t('emptyDescription')}</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs divide-y divide-border/60">
          <div className="bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-pink-500/10 text-pink-600">
                <Flame className="size-3.5" />
              </span>
              <span className="text-xs font-bold text-foreground">大众投票风向榜 TOP 10</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">
              {t('liveUpdate')}
            </Badge>
          </div>

          {paginatedResults.map((result, index) => {
            const globalIndex = (safeCurrentPage - 1) * pageSize + index;
            const isTop1 = globalIndex === 0;
            const isTop2 = globalIndex === 1;
            const isTop3 = globalIndex === 2;

            return (
              <article
                key={result.id}
                className="group relative flex flex-col gap-3 p-4 transition-colors hover:bg-muted/20 lg:flex-row lg:items-center lg:justify-between"
              >
                {/* 排名 + 封面 + 标题信息 */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* 排名标牌 */}
                  <div className="flex size-8 shrink-0 items-center justify-center pt-1">
                    {isTop1 ? (
                      <span className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-black text-amber-600 dark:text-amber-400">
                        1
                      </span>
                    ) : isTop2 ? (
                      <span className="flex size-7 items-center justify-center rounded-full bg-slate-500/20 text-xs font-black text-slate-700 dark:text-slate-300">
                        2
                      </span>
                    ) : isTop3 ? (
                      <span className="flex size-7 items-center justify-center rounded-full bg-orange-500/20 text-xs font-black text-orange-700 dark:text-orange-400">
                        3
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {String(globalIndex + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* 缩略图 */}
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted shadow-2xs">
                    {result.sourceImageUrl ? (
                      <img
                        src={result.sourceImageUrl}
                        alt=""
                        className="size-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                        <Newspaper className="size-5" />
                      </div>
                    )}
                  </div>

                  {/* 标题 & 题材 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <Badge variant="outline" className={`font-bold ${categoryClasses[result.category]}`}>
                        {t(`categories.${categoryKeys[result.category]}`)}
                      </Badge>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-bold text-muted-foreground">
                        {t(`statuses.${result.status}`)}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground truncate max-w-[140px]">{result.sourceDomain}</span>
                    </div>

                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 line-clamp-2 text-xs font-bold text-foreground hover:text-pink-600 hover:underline dark:hover:text-pink-400"
                    >
                      {result.sourceTitle}
                    </a>

                    {/* 投票分布 */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>
                        今日得票: <strong className="font-mono text-foreground font-black">{result.todayVotes}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        近3日总票:{' '}
                        <strong className="font-mono text-foreground font-black">{result.threeDayVotes}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        独立选民:{' '}
                        <strong className="font-mono text-foreground font-black">{result.uniqueVoters}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 加权占比与操作按钮 */}
                <div className="flex items-center justify-between gap-4 border-t border-dashed border-border/60 pt-3 lg:border-t-0 lg:pt-0 shrink-0">
                  {/* 占比条 */}
                  <div className="w-28 text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="font-mono text-base font-black tabular-nums text-pink-600 dark:text-pink-400">
                        {result.share}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">{t('weighted')}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-pink-500 to-violet-500"
                        style={{ width: `${Math.max(result.share, 4)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      size="icon-sm"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-foreground"
                    >
                      <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label="查看原文">
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openInStudio(result.id)}
                      disabled={pendingId === result.id}
                      className="h-8 px-3 text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 min-w-24"
                    >
                      {pendingId === result.id ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 size-3.5" />
                      )}
                      {pendingId === result.id
                        ? t('openingStudio')
                        : result.status === 'adopted'
                          ? t('openStudio')
                          : t('createSong')}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 分页控制栏 */}
      {results.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-1 px-1">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-medium">
            <span>
              {zh
                ? `显示第 ${(safeCurrentPage - 1) * pageSize + 1} - ${Math.min(safeCurrentPage * pageSize, totalItems)} 条 · 共 ${totalItems} 条`
                : `Showing ${(safeCurrentPage - 1) * pageSize + 1}-${Math.min(safeCurrentPage * pageSize, totalItems)} of ${totalItems} results`}
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
                disabled={safeCurrentPage <= 1}
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
                disabled={safeCurrentPage >= totalPages}
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
