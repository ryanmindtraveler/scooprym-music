import { type CommentHistoryItem, CommentHistoryList } from '@/components/dashboard/comment-history-list';
import { RecentListeningPagination } from '@/components/dashboard/recent-listening-pagination';
import { getDb } from '@/db';
import { song, songComment, story } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import { Routes } from '@/routes';
import { and, count, desc, eq } from 'drizzle-orm';
import { MessageSquareText } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

const COMMENT_PAGE_LIMIT = 10;

export default async function DashboardCommentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations('Dashboard.activity');
  const session = await getSession();
  const userId = session?.user?.id;
  const rawPage = (await searchParams).page;
  const parsedPage = Number.parseInt(Array.isArray(rawPage) ? rawPage[0] || '1' : rawPage || '1', 10);
  const requestedPage = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const comments: CommentHistoryItem[] = [];
  let commentCount = 0;
  let currentPage = requestedPage;
  let totalPages = 1;

  if (userId) {
    const db = await getDb();
    const visibleOwnComment = and(eq(songComment.userId, userId), eq(songComment.status, 'visible'));
    const [countRow] = await db.select({ count: count() }).from(songComment).where(visibleOwnComment);

    commentCount = Number(countRow?.count ?? 0);
    totalPages = Math.max(1, Math.ceil(commentCount / COMMENT_PAGE_LIMIT));
    currentPage = Math.min(requestedPage, totalPages);

    const rows = await db
      .select({
        id: songComment.id,
        content: songComment.content,
        createdAt: songComment.createdAt,
        songId: song.id,
        songTitle: song.title,
        coverImageUrl: song.coverImageUrl,
        newsSummary: story.newsSummary,
        sourceText: story.sourceText,
      })
      .from(songComment)
      .innerJoin(song, eq(song.id, songComment.songId))
      .innerJoin(story, eq(story.id, song.storyId))
      .where(visibleOwnComment)
      .orderBy(desc(songComment.createdAt))
      .limit(COMMENT_PAGE_LIMIT)
      .offset((currentPage - 1) * COMMENT_PAGE_LIMIT);

    comments.push(...rows);
  }

  return (
    <main className="min-h-full px-4 py-6 md:px-8 md:py-10 xl:px-12">
      <div className="mx-auto w-full max-w-[1560px]">
        <section aria-labelledby="my-comments-title">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-900/10 pb-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-pink-700">{t('commentHistory')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1
                  id="my-comments-title"
                  className="text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl"
                >
                  {t('myComments')}
                </h1>
                <span className="inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-pink-50/80 px-3 py-1.5 text-xs font-black text-pink-900 shadow-sm">
                  <MessageSquareText className="size-3.5 text-pink-600" />
                  {commentCount} {commentCount === 1 ? t('comment') : t('comments')}
                </span>
              </div>
            </div>
            <span className="hidden text-sm font-semibold text-slate-500 sm:block">{t('newestComments')}</span>
          </div>

          <CommentHistoryList comments={comments} startIndex={(currentPage - 1) * COMMENT_PAGE_LIMIT} />
          <RecentListeningPagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={Routes.DashboardComments}
            ariaLabel={t('myComments')}
          />
        </section>
      </div>
    </main>
  );
}
