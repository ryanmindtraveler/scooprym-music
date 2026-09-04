import { RecentListeningList, type RecentListeningSong } from '@/components/dashboard/recent-listening-list';
import { RecentListeningPagination } from '@/components/dashboard/recent-listening-pagination';
import { getDb } from '@/db';
import { song, songFavorite, story } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSession } from '@/lib/server';
import { SONG_FAILURE_PROCESSING_STATUSES } from '@/lib/song-status';
import { Routes } from '@/routes';
import { and, count, desc, eq, notInArray } from 'drizzle-orm';
import { Heart } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

const SAVED_PAGE_LIMIT = 10;

export default async function DashboardSavedPage({
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
  const savedSongs: RecentListeningSong[] = [];
  let savedCount = 0;
  let currentPage = requestedPage;
  let totalPages = 1;

  if (userId) {
    const db = await getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const visibleAttempt = notInArray(latestAttempt.processingStatus, SONG_FAILURE_PROCESSING_STATUSES);
    const visibleSavedSong = and(eq(songFavorite.userId, userId), eq(song.isPublished, true), visibleAttempt);
    const [countRow] = await db
      .select({ count: count() })
      .from(songFavorite)
      .innerJoin(song, eq(song.id, songFavorite.songId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(visibleSavedSong);

    savedCount = Number(countRow?.count || 0);
    totalPages = Math.max(1, Math.ceil(savedCount / SAVED_PAGE_LIMIT));
    currentPage = Math.min(requestedPage, totalPages);

    const rows = await db
      .select({
        id: song.id,
        title: song.title,
        createdAt: song.createdAt,
        durationSec: song.durationSec,
        plays: song.plays,
        audioUrl: song.audioUrl,
        coverImageUrl: song.coverImageUrl,
        lyrics: song.lyrics,
        prompt: latestAttempt.prompt,
        sourceText: story.sourceText,
        sourceUrl: story.sourceUrl,
        newsSummary: story.newsSummary,
        lastPlayedAt: songFavorite.createdAt,
      })
      .from(songFavorite)
      .innerJoin(song, eq(song.id, songFavorite.songId))
      .innerJoin(story, eq(story.id, song.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(visibleSavedSong)
      .orderBy(desc(songFavorite.createdAt))
      .limit(SAVED_PAGE_LIMIT)
      .offset((currentPage - 1) * SAVED_PAGE_LIMIT);

    savedSongs.push(
      ...rows.map((row) => ({
        ...row,
        createdAt: row.createdAt!,
        durationSec: row.durationSec ?? null,
        plays: row.plays ?? 0,
        category: 'News',
        isLiked: true,
      }))
    );
  }

  return (
    <main className="min-h-full px-4 py-6 md:px-8 md:py-10 xl:px-12">
      <div className="mx-auto w-full max-w-[1560px]">
        <section aria-labelledby="saved-songs-title">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-900/10 pb-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-pink-700">{t('replayShelf')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1
                  id="saved-songs-title"
                  className="text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl"
                >
                  {t('savedSongs')}
                </h1>
                <span className="inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-pink-50/80 px-3 py-1.5 text-xs font-black text-pink-900 shadow-sm">
                  <Heart className="size-3.5 fill-pink-500 text-pink-600" />
                  {savedCount} {savedCount === 1 ? t('song') : t('songs')}
                </span>
              </div>
            </div>
            <span className="hidden text-sm font-semibold text-slate-500 sm:block">{t('newestSaves')}</span>
          </div>

          <RecentListeningList songs={savedSongs} startIndex={(currentPage - 1) * SAVED_PAGE_LIMIT} mode="saved" />
          <RecentListeningPagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={Routes.DashboardSaved}
            ariaLabel={t('savedSongs')}
          />
        </section>
      </div>
    </main>
  );
}
