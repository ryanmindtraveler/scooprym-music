import { getDb } from '@/db';
import { hotSheetEdition } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
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
  if (!editions)
    return (
      <section className="rounded-xl border p-5 text-sm text-muted-foreground">
        {zh
          ? '每日归档尚未启用，请先应用数据库迁移 0033。'
          : 'Daily archive is not enabled yet. Apply database migration 0033 first.'}
      </section>
    );
  const categories: Record<string, string> = zh
    ? { celebrity_drama: '明星八卦', internet_chaos: '荒诞社会', absurd_headlines: '离谱新闻' }
    : { celebrity_drama: 'Celebrity Drama', internet_chaos: 'Internet Chaos', absurd_headlines: 'Absurd Headlines' };
  const labels: Record<string, string> = zh
    ? { completed: '已归档', partial: '不足 10 条', failed: '抓取失败', running: '抓取中' }
    : { completed: 'Archived', partial: 'Fewer than 10 stories', failed: 'Failed', running: 'Collecting' };
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{zh ? 'The Hot Sheet 每日归档' : 'The Hot Sheet · Daily archive'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {zh
              ? '每天洛杉矶时间 18:00 开始抓取；默认显示最近 7 期。'
              : 'Collection starts daily at 6 PM Los Angeles time. Showing the latest 7 editions.'}
          </p>
        </div>
        <form className="flex gap-2" method="get">
          <input
            aria-label={zh ? '归档日期' : 'Archive date'}
            name="edition"
            type="date"
            defaultValue={day}
            className="rounded-md border bg-background px-3 py-2 text-sm"
            required
          />
          <button className="rounded-md border px-3 py-2 text-sm" type="submit">
            {zh ? '查看' : 'View'}
          </button>
        </form>
      </div>
      {editions.length === 0 && (
        <p className="py-6 text-sm text-muted-foreground">
          {zh
            ? '暂无归档。首次定时抓取完成后将在这里显示。'
            : 'No archive yet. Editions appear here after the first scheduled collection.'}
        </p>
      )}
      <div className="mt-4 space-y-3">
        {editions.map((edition) => (
          <details key={edition.day} className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              {edition.day} · {labels[edition.status] ?? edition.status} · {edition.stories.length}/10
            </summary>
            {edition.error && (
              <p className="mt-3 text-sm text-destructive">{zh ? '抓取失败，请检查服务端日志。' : edition.error}</p>
            )}
            <ol className="mt-3 space-y-2">
              {edition.stories.map((story, i) => (
                <li key={story.id} className="border-t pt-2 text-sm">
                  <span className="mr-2 text-muted-foreground">
                    {String(i + 1).padStart(2, '0')} · {categories[story.category] ?? story.category}
                  </span>
                  <a href={story.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    {story.sourceTitle}
                  </a>
                  <span className="ml-2 text-xs text-muted-foreground">{story.sourceDomain}</span>
                </li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </section>
  );
}
