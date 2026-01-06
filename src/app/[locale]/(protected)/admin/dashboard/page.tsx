import { getAdminStats, getDailyStats, getLiveSongs, getRecentTransactions } from '@/actions/admin';
import { LiveSongFeed } from '@/components/admin/dashboard/live-feed';
import { OverviewChart } from '@/components/admin/dashboard/overview-chart';
import { AdminStatsCards } from '@/components/admin/dashboard/status-cards';
import { TransactionList } from '@/components/admin/dashboard/transaction-list';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [stats, dailyStats, liveSongs, transactions] = await Promise.all([
    getAdminStats(),
    getDailyStats(),
    getLiveSongs(20),
    getRecentTransactions(10),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. KPI Cards */}
      <AdminStatsCards stats={stats} />

      {/* 2. Charts & Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <OverviewChart data={dailyStats} />

        {/* 3. Recent Transactions (Narrow) */}
        <div className="col-span-3 lg:col-span-3 space-y-6">
            <TransactionList transactions={transactions} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* 4. Live Generation Feed (Wide) */}
        <div className="col-span-4 lg:col-span-4">
          <LiveSongFeed songs={liveSongs} />
        </div>

        {/* 5. System Health Monitor */}
        <div className="col-span-3 lg:col-span-3">

            {/* 4. System Health Monitor */}
            <Card>
                <div className="p-4 flex items-center justify-between border-b">
                     <h3 className="font-semibold text-sm">System Health</h3>
                     <Badge variant="outline" className="text-green-500 border-green-500">
                        Operational
                     </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                     <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            API Status (Suno)
                        </span>
                        <span className="font-medium">99.9% Uptime</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            QStash Queue
                        </span>
                        <span className="font-medium">
                            {stats.queueLength} {stats.queueLength > 0 ? 'Processing' : 'Idle'}
                        </span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Database Latency
                        </span>
                        <span className="font-medium">12ms</span>
                     </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
