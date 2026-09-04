'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  // If data is scarce, fill with mock or just render what we have.
  // The backend returns { date: 'Jan 01', count: 12 }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{t('totalGenerations')}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorCount)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
