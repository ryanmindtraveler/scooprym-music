import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

interface EngagementFunnelProps {
  data: {
    detailViews: number;
    playStarts: number;
    qualifiedPlays: number;
    completedPlays: number;
    shares: number;
  };
}

function percentage(value: number, base: number) {
  if (base === 0) return '0%';
  return `${Math.round((value / base) * 100)}%`;
}

export async function EngagementFunnel({ data }: EngagementFunnelProps) {
  const t = await getTranslations('Dashboard.admin.overview');
  const stages = [
    { label: t('storyViews'), value: data.detailViews, rate: t('days30') },
    { label: t('playStarts'), value: data.playStarts, rate: percentage(data.playStarts, data.detailViews) },
    {
      label: t('qualifiedListens'),
      value: data.qualifiedPlays,
      rate: percentage(data.qualifiedPlays, data.playStarts),
    },
    { label: t('completed'), value: data.completedPlays, rate: percentage(data.completedPlays, data.playStarts) },
    { label: t('shares'), value: data.shares, rate: percentage(data.shares, data.detailViews) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('listenerFunnel')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('funnelDescription')}</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-5">
        {stages.map((stage) => (
          <div key={stage.label} className="rounded-xl border bg-muted/25 p-4">
            <p className="text-xs font-medium text-muted-foreground">{stage.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{stage.value}</p>
            <p className="mt-1 text-xs font-semibold text-pink-600">{stage.rate}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
