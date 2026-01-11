import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeDollarSign, Music, Users, Zap } from 'lucide-react';
import type { AdminStats } from './types';

export function AdminStatsCards({ stats }: { stats: AdminStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(stats.revenue / 100).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {stats.revenue - stats.recentRevenue < 500 ? ( // Baseline < $5.00
              <span>+{(stats.recentRevenue / 100).toFixed(2)} this month</span>
            ) : (
              <>
                <span className={`${stats.revenueGrowth >= 0 ? 'text-green-500' : 'text-destructive'} font-medium`}>
                  {stats.revenueGrowth >= 0 ? '+' : ''}
                  {stats.revenueGrowth > 999 ? '>999' : stats.revenueGrowth.toFixed(1)}%
                </span>{' '}
                from last 30 days
              </>
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSubs}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {stats.activeSubs - stats.recentSubs < 5 ? (
              <span>+{stats.recentSubs} new</span>
            ) : (
              <>
                <span className={`${stats.subsGrowth >= 0 ? 'text-green-500' : 'text-destructive'} font-medium`}>
                  {stats.subsGrowth >= 0 ? '+' : ''}
                  {stats.subsGrowth > 999 ? '>999' : stats.subsGrowth.toFixed(1)}%
                </span>{' '}
                from last 30 days
              </>
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Songs Generated</CardTitle>
          <Music className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{stats.songs}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {stats.songs - stats.recentSongs < 10 ? (
              <span>+{stats.recentSongs} new</span>
            ) : (
              <>
                <span className={`${stats.songsGrowth >= 0 ? 'text-green-500' : 'text-destructive'} font-medium`}>
                  {stats.songsGrowth >= 0 ? '+' : ''}
                  {stats.songsGrowth > 999 ? '>999' : stats.songsGrowth.toFixed(1)}%
                </span>{' '}
                from last 30 days
              </>
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{stats.users}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {stats.users - stats.recentUsers < 5 ? (
              <span>+{stats.recentUsers} new</span>
            ) : (
              <>
                <span className={`${stats.usersGrowth >= 0 ? 'text-green-500' : 'text-destructive'} font-medium`}>
                  {stats.usersGrowth >= 0 ? '+' : ''}
                  {stats.usersGrowth > 999 ? '>999' : stats.usersGrowth.toFixed(1)}%
                </span>{' '}
                from last 30 days
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
