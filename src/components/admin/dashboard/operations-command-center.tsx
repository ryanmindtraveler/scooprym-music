import { Button } from '@/components/ui/button';
import { Routes } from '@/routes';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Layers,
  Music2,
  Newspaper,
  Radio,
  Send,
  ShieldAlert,
  Users,
} from 'lucide-react';
import Link from 'next/link';

type EditorialData = {
  radar: { fresh: number; shortlisted: number; inProduction: number; adoptedToday: number };
  production: { active: number; failed: number };
  publishing: { readyForReview: number; scheduled: number; publishedToday: number };
  audience?: { voters: number; selections: number };
};

type InfrastructureData = {
  queues: {
    music: { queued: number; processing: number; failed: number; stale: number };
    radar: { queued: number; processing: number; failed: number; stale: number };
  };
  pendingReports: number;
  hotSheet: { day: string; status: string; completedAt: string | null } | null;
  costTrackingAvailable: boolean;
};

export function OperationsCommandCenter({
  editorial,
  infrastructure,
}: {
  editorial: EditorialData;
  infrastructure: InfrastructureData;
}) {
  const stale = infrastructure.queues.music.stale + infrastructure.queues.radar.stale;
  const failed = editorial.production.failed + infrastructure.queues.music.failed + infrastructure.queues.radar.failed;
  const hotSheetHealthy = infrastructure.hotSheet?.status === 'completed';
  const hasAttention = failed > 0 || stale > 0 || infrastructure.pendingReports > 0 || !hotSheetHealthy;

  const stats = [
    {
      label: '今日热点候选',
      sublabel: 'Radar Fresh',
      value: editorial.radar.fresh,
      detail: `${editorial.radar.shortlisted} 条入选精选`,
      href: Routes.AdminStoryRadar,
      actionText: '查看雷达',
      icon: Newspaper,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      badge: `${editorial.radar.adoptedToday} 篇已采纳`,
    },
    {
      label: 'AI 制作队列',
      sublabel: 'In Production',
      value: editorial.production.active,
      detail: failed > 0 ? `${failed} 个任务异常` : '流水线正常',
      href: Routes.AdminCreate,
      actionText: '打开工坊',
      icon: Music2,
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      badge: failed > 0 ? '需关注' : '正常',
      isWarning: failed > 0,
    },
    {
      label: '待审与排期',
      sublabel: 'Ready for Review',
      value: editorial.publishing.readyForReview,
      detail: `${editorial.publishing.scheduled} 首已排期待发`,
      href: Routes.AdminSongs,
      actionText: '审核曲目',
      icon: Clock3,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      badge: `${editorial.publishing.scheduled} 排期`,
    },
    {
      label: '今日已发布',
      sublabel: 'Published Today',
      value: editorial.publishing.publishedToday,
      detail: '今日首发已上架',
      href: Routes.AdminSongs,
      actionText: '曲目列表',
      icon: Send,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      badge: '已上线',
    },
    {
      label: '大众投票互动',
      sublabel: 'Audience Signal',
      value: editorial.audience?.voters || 0,
      detail: `${editorial.audience?.selections || 0} 次题材投票`,
      href: Routes.AdminStoryRadar,
      actionText: '投票看板',
      icon: Users,
      color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      badge: '今日活跃',
    },
  ];

  return (
    <section className="space-y-3.5">
      {/* 状态告警与快捷控制条 */}
      <div
        className={`relative overflow-hidden rounded-xl border p-3.5 shadow-2xs backdrop-blur-xs transition-all ${
          hasAttention
            ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/8 via-amber-500/4 to-transparent dark:from-amber-950/30'
            : 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/8 via-emerald-500/4 to-transparent dark:from-emerald-950/30'
        }`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
                hasAttention
                  ? 'border-amber-500/30 bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {hasAttention ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold tracking-tight">
                  {hasAttention ? '内容流水线有待处理事项' : '新闻编辑部与内容流水线运转正常'}
                </p>
                {hasAttention && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300">
                    需要注意
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                失败任务: <span className={failed > 0 ? 'font-bold text-destructive' : ''}>{failed}</span> · 超时处理:{' '}
                <span className={stale > 0 ? 'font-bold text-amber-600' : ''}>{stale}</span> · 待审评论举报:{' '}
                <span className={infrastructure.pendingReports > 0 ? 'font-bold text-amber-600' : ''}>
                  {infrastructure.pendingReports}
                </span>{' '}
                · Hot Sheet 归档: <span>{hotSheetHealthy ? '正常完成' : '待归档'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {infrastructure.pendingReports > 0 && (
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href={Routes.AdminComments}>
                  <ShieldAlert className="mr-1.5 size-3.5 text-amber-500" />
                  处理 {infrastructure.pendingReports} 条举报
                </Link>
              </Button>
            )}
            <Button asChild size="sm" className="h-8 bg-pink-600 text-xs font-semibold text-white hover:bg-pink-700">
              <Link href={Routes.AdminCreate}>
                进入音乐工坊
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 5 个核心 KPI 卡片 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${stat.color}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold leading-none text-foreground">{stat.label}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{stat.sublabel}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {stat.badge}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-3xl font-black tracking-tight tabular-nums">{stat.value}</p>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-dashed border-border/60">
                <Link
                  href={stat.href}
                  className="inline-flex items-center text-xs font-bold text-pink-600 transition-colors hover:text-pink-700 dark:text-pink-400"
                >
                  {stat.actionText}
                  <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
