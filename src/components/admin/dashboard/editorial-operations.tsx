import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Routes } from '@/routes';
import { AlertTriangle, ArrowRight, CheckCircle2, Flame, Music2, Newspaper, Radio, Send, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

interface EditorialOperationsData {
  voteDay: string;
  radar: {
    fresh: number;
    shortlisted: number;
    inProduction: number;
    adoptedToday: number;
  };
  audience: {
    selections: number;
    voters: number;
    stories: number;
    topStory: { id: string; title: string; votes: number } | null;
  };
  production: {
    active: number;
    failed: number;
  };
  publishing: {
    readyForReview: number;
    scheduled: number;
    publishedToday: number;
  };
}

export async function EditorialOperations({ data }: { data: EditorialOperationsData }) {
  const t = await getTranslations('Dashboard.admin.overview');
  const needsAttention = data.production.failed + data.publishing.readyForReview;
  const stages = [
    {
      number: '01',
      step: 'STEP 1',
      label: t('radar'),
      value: data.radar.fresh,
      valueLabel: t('freshStories'),
      detail: t('shortlistedCount', { count: data.radar.shortlisted }),
      href: Routes.AdminStoryRadar,
      action: t('openRadar'),
      icon: Newspaper,
      accent: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      badgeColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    },
    {
      number: '02',
      step: 'STEP 2',
      label: t('audience'),
      value: data.audience.voters,
      valueLabel: t('votersToday'),
      detail: t('selectionDetail', { selections: data.audience.selections, stories: data.audience.stories }),
      href: Routes.AdminStoryRadar,
      action: t('reviewVotes'),
      icon: Users,
      accent: 'border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400',
      badgeColor: 'bg-pink-500/15 text-pink-700 dark:text-pink-300',
    },
    {
      number: '03',
      step: 'STEP 3',
      label: t('production'),
      value: data.production.active,
      valueLabel: t('jobsActive'),
      detail: t('productionDetail', { count: data.radar.inProduction }),
      href: Routes.AdminCreate,
      action: t('openStudio'),
      icon: Music2,
      accent: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
      badgeColor: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    },
    {
      number: '04',
      step: 'STEP 4',
      label: t('publish'),
      value: data.publishing.readyForReview,
      valueLabel: t('waitingReview'),
      detail: t('publishDetail', {
        scheduled: data.publishing.scheduled,
        published: data.publishing.publishedToday,
      }),
      href: Routes.AdminSongs,
      action: t('reviewSongs'),
      icon: Send,
      accent: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-2xs transition-all">
      <header className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Badge variant="secondary" className="font-bold text-xs">
            {t('desk')}
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground">{t('ballot', { date: data.voteDay })}</span>
        </div>

        <div className="flex items-center gap-2">
          {needsAttention > 0 ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle className="size-3.5" />
              {t('needAttention', { count: needsAttention })}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="size-3.5" />
              {t('pipelineClear')}
            </Badge>
          )}
        </div>
      </header>

      <div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <section
                key={stage.label}
                className="group relative flex min-w-0 flex-col justify-between border-b p-4 transition-colors hover:bg-muted/15 sm:border-r xl:border-b-0 xl:last:border-r-0"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-2xs ${stage.accent}`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground">
                          {stage.step}
                        </span>
                        <h3 className="text-sm font-bold text-foreground leading-tight">{stage.label}</h3>
                      </div>
                    </div>
                    <span className="text-2xl font-black tabular-nums tracking-tight">{stage.value}</span>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold text-foreground/90">{stage.valueLabel}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{stage.detail}</p>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-dashed border-border/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground">流水线阶段 {stage.number}</span>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs font-bold text-pink-600 hover:text-pink-700 dark:text-pink-400"
                  >
                    <Link href={stage.href}>
                      {stage.action}
                      <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>

                {index < stages.length - 1 ? (
                  <span className="absolute top-1/2 -right-3 z-10 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-2xs xl:flex">
                    <ArrowRight className="size-3" />
                  </span>
                ) : null}
              </section>
            );
          })}
        </div>

        {/* 底部今日热点投票信号条 */}
        <div className="grid border-t bg-gradient-to-r from-pink-500/5 via-muted/30 to-muted/20 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-3 px-4 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400">
              <Flame className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
                {t('audienceSignal')}
              </span>
              <p className="line-clamp-1 text-xs font-bold text-foreground">
                {data.audience.topStory
                  ? t('topStory', { title: data.audience.topStory.title, votes: data.audience.topStory.votes })
                  : t('noVotes')}
              </p>
            </div>
          </div>
          <div className="border-t px-4 py-2.5 text-xs font-medium text-muted-foreground md:border-t-0 md:border-l">
            {t('operationSummary', { adopted: data.radar.adoptedToday, failed: data.production.failed })}
          </div>
        </div>
      </div>
    </section>
  );
}
