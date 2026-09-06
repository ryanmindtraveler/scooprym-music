import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Eye, Filter, Play, Radio, Share2 } from 'lucide-react';
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
  if (base === 0) return 0;
  return Math.min(100, Math.round((value / base) * 100));
}

export async function EngagementFunnel({ data }: EngagementFunnelProps) {
  const t = await getTranslations('Dashboard.admin.overview');
  const baseViews = Math.max(data.detailViews, 1);

  const stages = [
    {
      label: t('storyViews'),
      value: data.detailViews,
      rateText: '基准流量 (30天)',
      pct: 100,
      icon: Eye,
      color: 'bg-slate-500',
    },
    {
      label: t('playStarts'),
      value: data.playStarts,
      rateText: `${percentage(data.playStarts, baseViews)}% 试听转化`,
      pct: percentage(data.playStarts, baseViews),
      icon: Play,
      color: 'bg-pink-500',
    },
    {
      label: t('qualifiedListens'),
      value: data.qualifiedPlays,
      rateText: `${percentage(data.qualifiedPlays, data.playStarts || 1)}% 有效收听`,
      pct: percentage(data.qualifiedPlays, baseViews),
      icon: CheckCircle,
      color: 'bg-violet-500',
    },
    {
      label: t('completed'),
      value: data.completedPlays,
      rateText: `${percentage(data.completedPlays, data.playStarts || 1)}% 完整完播`,
      pct: percentage(data.completedPlays, baseViews),
      icon: Radio,
      color: 'bg-cyan-500',
    },
    {
      label: t('shares'),
      value: data.shares,
      rateText: `${percentage(data.shares, baseViews)}% 裂变分享`,
      pct: percentage(data.shares, baseViews),
      icon: Share2,
      color: 'bg-amber-500',
    },
  ];

  return (
    <Card className="overflow-hidden rounded-xl border border-border/80 bg-card py-0 shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <Filter className="size-4" />
          </span>
          <div>
            <CardTitle className="text-sm font-bold leading-none text-foreground">{t('listenerFunnel')}</CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t('funnelDescription')}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold">
          30 天累计
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2.5 p-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="space-y-1.5 rounded-lg border bg-muted/20 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="font-bold text-foreground">{stage.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">{stage.rateText}</span>
                  <span className="font-mono text-sm font-black tabular-nums">{stage.value.toLocaleString()}</span>
                </div>
              </div>

              {/* 进度条 */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                  style={{ width: `${Math.max(stage.pct, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
