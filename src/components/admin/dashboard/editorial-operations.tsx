import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Routes } from '@/routes';
import { AlertTriangle, ArrowRight, CircleCheck, Music2, Newspaper, Radio, Send, Users } from 'lucide-react';
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
      label: t('radar'),
      description: t('radarDescription'),
      value: data.radar.fresh,
      valueLabel: t('freshStories'),
      detail: t('shortlistedCount', { count: data.radar.shortlisted }),
      href: Routes.AdminStoryRadar,
      action: t('openRadar'),
      icon: Newspaper,
      accent: 'border-cyan-500/35 bg-cyan-500/6 text-cyan-700 dark:text-cyan-300',
    },
    {
      number: '02',
      label: t('audience'),
      description: t('audienceDescription'),
      value: data.audience.voters,
      valueLabel: t('votersToday'),
      detail: t('selectionDetail', { selections: data.audience.selections, stories: data.audience.stories }),
      href: Routes.AdminStoryRadar,
      action: t('reviewVotes'),
      icon: Users,
      accent: 'border-pink-500/35 bg-pink-500/6 text-pink-700 dark:text-pink-300',
    },
    {
      number: '03',
      label: t('production'),
      description: t('productionDescription'),
      value: data.production.active,
      valueLabel: t('jobsActive'),
      detail: t('productionDetail', { count: data.radar.inProduction }),
      href: Routes.AdminCreate,
      action: t('openStudio'),
      icon: Music2,
      accent: 'border-violet-500/35 bg-violet-500/6 text-violet-700 dark:text-violet-300',
    },
    {
      number: '04',
      label: t('publish'),
      description: t('publishDescription'),
      value: data.publishing.readyForReview,
      valueLabel: t('waitingReview'),
      detail: t('publishDetail', {
        scheduled: data.publishing.scheduled,
        published: data.publishing.publishedToday,
      }),
      href: Routes.AdminSongs,
      action: t('reviewSongs'),
      icon: Send,
      accent: 'border-amber-500/40 bg-amber-500/7 text-amber-700 dark:text-amber-300',
    },
  ];

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="gap-4 border-b bg-[linear-gradient(110deg,rgba(6,182,212,0.08),rgba(236,72,153,0.07)_48%,rgba(250,204,21,0.08))] px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-foreground text-background hover:bg-foreground">{t('desk')}</Badge>
            <span className="text-xs font-medium text-muted-foreground">{t('ballot', { date: data.voteDay })}</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{t('operationTitle')}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t('operationDescription')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {needsAttention > 0 ? (
            <Badge variant="outline" className="gap-1.5 border-amber-500/35 bg-amber-500/10 text-amber-800">
              <AlertTriangle className="size-3.5" />
              {t('needAttention', { count: needsAttention })}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 border-emerald-500/35 bg-emerald-500/10 text-emerald-700">
              <CircleCheck className="size-3.5" />
              {t('pipelineClear')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid lg:grid-cols-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <section
                key={stage.label}
                className="relative flex min-h-60 flex-col border-b p-5 last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-[0.18em] text-muted-foreground">{stage.number}</span>
                  <span className={`flex size-9 items-center justify-center rounded-xl border ${stage.accent}`}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{stage.label}</h3>
                <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{stage.description}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums tracking-tight">{stage.value}</span>
                  <span className="text-xs font-medium text-muted-foreground">{stage.valueLabel}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{stage.detail}</p>
                <Button asChild variant="ghost" className="mt-auto h-9 justify-between px-0 hover:bg-transparent">
                  <Link href={stage.href}>
                    {stage.action}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {index < stages.length - 1 ? (
                  <span className="absolute top-7 -right-2.5 z-10 hidden size-5 items-center justify-center rounded-full border bg-background text-muted-foreground lg:flex">
                    <ArrowRight className="size-3" />
                  </span>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="grid border-t bg-muted/20 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex min-w-0 items-start gap-3 px-5 py-4 md:px-6">
            <Radio className="mt-0.5 size-4 shrink-0 text-pink-600" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t('audienceSignal')}
              </p>
              <p className="mt-1 line-clamp-1 text-sm font-medium">
                {data.audience.topStory
                  ? t('topStory', { title: data.audience.topStory.title, votes: data.audience.topStory.votes })
                  : t('noVotes')}
              </p>
            </div>
          </div>
          <div className="border-t px-5 py-3 text-xs text-muted-foreground md:border-t-0 md:border-l md:px-6">
            {t('operationSummary', { adopted: data.radar.adoptedToday, failed: data.production.failed })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
