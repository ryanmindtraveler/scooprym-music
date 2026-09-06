import {
  getDailyStats,
  getEditorialOperations,
  getEngagementFunnel,
  getInfrastructureOverview,
  getLiveSongs,
} from '@/actions/admin';
import { DashboardToolbar } from '@/components/admin/dashboard/dashboard-toolbar';
import { EditorialOperations } from '@/components/admin/dashboard/editorial-operations';
import { EngagementFunnel } from '@/components/admin/dashboard/engagement-funnel';
import { InfrastructureHealth } from '@/components/admin/dashboard/infrastructure-health';
import { LiveSongFeed } from '@/components/admin/dashboard/live-feed';
import { OperationsCommandCenter } from '@/components/admin/dashboard/operations-command-center';
import { OverviewChart } from '@/components/admin/dashboard/overview-chart';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const t = await getTranslations('Dashboard.admin.overview');
  const [dailyStats, editorialOperations, engagementFunnel, liveSongs, infrastructure] = await Promise.all([
    getDailyStats(),
    getEditorialOperations(),
    getEngagementFunnel(),
    getLiveSongs(20),
    getInfrastructureOverview(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[2160px] flex-col gap-5 pb-8">
      {/* 头部标题与时区控制条 */}
      <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/20 bg-pink-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
              <span className="size-1.5 rounded-full bg-pink-500 animate-ping" />
              ScoopRYM Newsroom
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            实时把控今日选材、流水线堵点、AI 模型网关及核心收听增长指标。
          </p>
        </div>
        <DashboardToolbar />
      </div>

      {/* 核心运营 KPI 与流水线状态总览 */}
      <OperationsCommandCenter editorial={editorialOperations} infrastructure={infrastructure} />

      {/* 双栏响应式现代工作台布局 */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        {/* 左侧核心业务流 (8/12 列) */}
        <div className="space-y-5 lg:col-span-7 xl:col-span-8">
          {/* 编辑部 4 阶段流水线 */}
          <EditorialOperations data={editorialOperations} />

          {/* 消费与转化增长分析 (2 列并排) */}
          <div className="grid gap-5 sm:grid-cols-2">
            <OverviewChart data={dailyStats} />
            <EngagementFunnel data={engagementFunnel} />
          </div>

          {/* 实时最新生成曲目流 */}
          <LiveSongFeed songs={liveSongs} />
        </div>

        {/* 右侧系统与模型网关监控 (4/12 列) */}
        <div className="space-y-5 lg:col-span-5 xl:col-span-4">
          <InfrastructureHealth data={infrastructure} />
        </div>
      </div>
    </div>
  );
}
