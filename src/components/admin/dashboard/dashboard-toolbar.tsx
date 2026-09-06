'use client';

import { Button } from '@/components/ui/button';
import { Clock, Radio, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'America/Los_Angeles',
  month: 'short',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function DashboardToolbar() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="inline-flex items-center gap-2 rounded-lg border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-2xs backdrop-blur-xs">
        <Clock className="size-3.5 text-pink-500" />
        <span className="font-semibold text-foreground">洛杉矶运营时区</span>
        <span className="font-mono font-medium text-foreground/80" suppressHydrationWarning>
          {now ? timeFormatter.format(now) : '正在同步…'}
        </span>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-lg border border-pink-500/20 bg-pink-500/10 px-3 py-1.5 text-xs font-black text-pink-600 dark:text-pink-400">
        <Radio className="size-3.5 animate-pulse" />
        实时监控
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-8 rounded-lg font-medium shadow-2xs transition-all hover:bg-muted"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        <RefreshCw className={`mr-2 size-3.5 ${pending ? 'animate-spin' : ''}`} />
        {pending ? '刷新中…' : '刷新数据'}
      </Button>
    </div>
  );
}
