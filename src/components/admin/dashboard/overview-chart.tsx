'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface OverviewChartProps {
  data: {
    date: string;
    count: number;
  }[];
}

export function OverviewChart({ data }: OverviewChartProps) {
  const t = useTranslations('Dashboard.admin.overview');
  const total7Days = data.reduce((acc, cur) => acc + cur.count, 0);

  return (
    <Card className="overflow-hidden rounded-xl border border-border/80 bg-card py-0 shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <TrendingUp className="size-4" />
          </span>
          <div>
            <CardTitle className="text-sm font-bold leading-none text-foreground">{t('totalGenerations')}</CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">近 7 个业务日曲目生成走势</p>
          </div>
        </div>
        <Badge variant="secondary" className="font-bold text-xs">
          7 日总量: <span className="ml-1 text-pink-600 dark:text-pink-400 font-mono">{total7Days}</span>
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-4">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#db2777" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#db2777" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} dy={6} />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-md backdrop-blur-xs">
                        <p className="font-bold text-popover-foreground">{payload[0].payload.date}</p>
                        <p className="mt-0.5 text-pink-600 dark:text-pink-400 font-extrabold">
                          生成曲目: <span className="font-mono text-sm">{payload[0].value}</span> 首
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#db2777"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCount)"
                activeDot={{ r: 5, fill: '#db2777', strokeWidth: 2, stroke: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
