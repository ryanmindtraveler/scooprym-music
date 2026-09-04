import {
  getAdminStats,
  getDailyStats,
  getEditorialOperations,
  getEngagementFunnel,
  getLiveSongs,
} from '@/actions/admin';
import { MINIMAX_MUSIC_MODEL } from '@/ai/config/models';
import { EditorialOperations } from '@/components/admin/dashboard/editorial-operations';
import { EngagementFunnel } from '@/components/admin/dashboard/engagement-funnel';
import { LiveSongFeed } from '@/components/admin/dashboard/live-feed';
import { OverviewChart } from '@/components/admin/dashboard/overview-chart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const t = await getTranslations('Dashboard.admin.overview');
  const [stats, dailyStats, editorialOperations, engagementFunnel, liveSongs] = await Promise.all([
    getAdminStats(),
    getDailyStats(),
    getEditorialOperations(),
    getEngagementFunnel(),
    getLiveSongs(20),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <EditorialOperations data={editorialOperations} />

      <EngagementFunnel data={engagementFunnel} />

      <div className="grid gap-6 lg:grid-cols-7">
        <OverviewChart data={dailyStats} />
        <div className="col-span-3 lg:col-span-3">
          <Card>
            <div className="p-4 flex items-center justify-between border-b">
              <h3 className="font-semibold text-sm">{t('system')}</h3>
              <Badge variant="outline">{t('liveConfiguration')}</Badge>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {t('musicProvider')}
                </span>
                <span className="font-medium">MiniMax {MINIMAX_MUSIC_MODEL}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {t('queue')}
                </span>
                <span className="font-medium">
                  {stats.queueLength} {stats.queueLength > 0 ? t('processing') : t('idle')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {t('database')}
                </span>
                <span className="font-medium">{t('connected')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LiveSongFeed songs={liveSongs} />
    </div>
  );
}
