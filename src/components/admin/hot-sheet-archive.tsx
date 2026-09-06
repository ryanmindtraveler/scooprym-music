import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDb } from '@/db';
import { hotSheetEdition } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import {
  Archive,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { getLocale } from 'next-intl/server';

export async function HotSheetArchive({ day }: { day?: string }) {
  const zh = (await getLocale()) === 'zh';
  const db = await getDb();
  const editions = await db
    .select()
    .from(hotSheetEdition)
    .where(day ? eq(hotSheetEdition.day, day) : undefined)
    .orderBy(desc(hotSheetEdition.day))
    .limit(day ? 1 : 7)
    .catch((error: unknown) => {
      // 滚动部署期间只降级处理归档表尚未迁移，其他数据库异常仍交给错误边界。
      const outer = error as { code?: string; cause?: { code?: string } };
      if (outer?.code === '42P01' || outer?.cause?.code === '42P01') return null;
      throw error;
    });

  if (!editions) {
    return (
      <Card className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-sm text-amber-800 dark:text-amber-200">
        {zh
          ? '每日归档尚未启用，请先应用数据库迁移 0033。'
          : 'Daily archive is not enabled yet. Apply database migration 0033 first.'}
      </Card>
    );
  }

  const categories: Record<string, { label: string; color: string }> = zh
    ? {
        celebrity_drama: {
          label: '明星八卦',
          color: 'border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300',
        },
        internet_chaos: {
          label: '荒诞社会',
          color: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
        },
        absurd_headlines: {
          label: '离谱新闻',
          color: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        },
      }
    : {
        celebrity_drama: {
          label: 'Celebrity Drama',
          color: 'border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300',
        },
        internet_chaos: {
          label: 'Internet Chaos',
          color: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
        },
        absurd_headlines: {
          label: 'Absurd Headlines',
          color: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        },
      };

  const statusMap: Record<string, { label: string; badge: string }> = {
    completed: {
      label: zh ? '已归档' : 'Archived',
      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    },
    partial: {
      label: zh ? '不足 10 条' : 'Partial (<10)',
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
    failed: {
      label: zh ? '抓取失败' : 'Failed',
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
    },
    running: {
      label: zh ? '抓取中' : 'Collecting',
      badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    },
  };

  return (
    <div className="space-y-4">
      {/* 头部筛选栏 */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <Archive className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {zh ? 'The Hot Sheet 每日归档历史' : 'The Hot Sheet · Daily Archive Editions'}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {zh
                ? '每日洛杉矶时间 18:00 (PT) 定时抓取；默认呈现近 7 期归档。'
                : 'Automated collection at 18:00 PT daily. Showing recent 7 editions.'}
            </p>
          </div>
        </div>

        <form className="flex items-center gap-2" method="get">
          <div className="relative">
            <input
              aria-label={zh ? '归档日期' : 'Archive date'}
              name="edition"
              type="date"
              defaultValue={day}
              className="h-8.5 rounded-lg border border-border/80 bg-background px-3 text-xs font-medium text-foreground shadow-2xs outline-none focus:border-pink-500"
              required
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-8.5 px-3 text-xs font-bold">
            <Calendar className="mr-1.5 size-3.5" />
            {zh ? '按期查看' : 'Filter Edition'}
          </Button>
          {day && (
            <Button asChild size="sm" variant="ghost" className="h-8.5 px-2.5 text-xs text-muted-foreground">
              <a href="?">{zh ? '重置' : 'Reset'}</a>
            </Button>
          )}
        </form>
      </div>

      {editions.length === 0 ? (
        <Card className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <Sparkles className="mb-2.5 size-8 text-muted-foreground/60" />
          <p className="text-sm font-bold text-foreground">{zh ? '暂无归档记录' : 'No Archive Editions'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {zh
              ? '首次定时抓取或发布完成后将自动在此归档展示。'
              : 'Editions will appear here automatically after scheduled runs.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {editions.map((edition) => {
            const statusInfo = statusMap[edition.status] || {
              label: edition.status,
              badge: 'border-muted bg-muted text-muted-foreground',
            };

            return (
              <details
                key={edition.day}
                className="group overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs transition-all open:ring-1 open:ring-border"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between bg-muted/20 px-4 py-3.5 transition-colors hover:bg-muted/40">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-black tracking-tight text-foreground sm:text-sm">
                      {edition.day}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </Badge>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {edition.stories.length} / 10 条收录
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="hidden sm:inline text-[11px]">点击展开详情</span>
                    <ChevronRight className="size-4 transition-transform duration-200 group-open:rotate-90" />
                  </div>
                </summary>

                <div className="border-t border-border/60 p-4">
                  {edition.error && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                      <TriangleAlert className="size-4 shrink-0" />
                      <span>
                        {zh ? '抓取异常：' : 'Collection Error: '} {edition.error}
                      </span>
                    </div>
                  )}

                  <div className="divide-y divide-border/40">
                    {edition.stories.map((story, i) => {
                      const cat = categories[story.category] || {
                        label: story.category,
                        color: 'border-muted bg-muted text-muted-foreground',
                      };

                      return (
                        <div
                          key={story.id}
                          className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-muted-foreground/80 shrink-0 pt-0.5">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <Badge variant="outline" className={`shrink-0 text-[10px] font-bold ${cat.color}`}>
                              {cat.label}
                            </Badge>
                            <a
                              href={story.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-xs font-bold text-foreground hover:text-pink-600 hover:underline dark:hover:text-pink-400"
                            >
                              {story.sourceTitle}
                            </a>
                          </div>

                          <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Globe className="size-3 text-muted-foreground/70" />
                              {story.sourceDomain}
                            </span>
                            <Button
                              asChild
                              size="icon-sm"
                              variant="ghost"
                              className="size-6 text-muted-foreground hover:text-foreground"
                            >
                              <a href={story.sourceUrl} target="_blank" rel="noreferrer" aria-label="查看原文">
                                <ExternalLink className="size-3" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
