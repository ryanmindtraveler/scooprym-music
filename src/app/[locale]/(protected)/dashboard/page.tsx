import { RecentListeningList, type RecentListeningSong } from '@/components/dashboard/recent-listening-list';
import { RecentListeningPagination } from '@/components/dashboard/recent-listening-pagination';
import { getDb } from '@/db';
import { song, songFavorite, songPlay, story } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSession } from '@/lib/server';
import { SONG_FAILURE_PROCESSING_STATUSES } from '@/lib/song-status';
import { and, countDistinct, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { History } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

const RECENT_LISTENING_LIMIT = 10;

export default async function DashboardPage({
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
  const recentSongs: RecentListeningSong[] = [];
  let listeningCount = 0;
  let currentPage = requestedPage;
  let totalPages = 1;

  if (userId) {
    const db = await getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const visibleAttempt = notInArray(latestAttempt.processingStatus, SONG_FAILURE_PROCESSING_STATUSES);
    const lastPlayedAt = sql<Date>`max(${songPlay.createdAt})`;

    const [countRow] = await db
      .select({ count: countDistinct(songPlay.songId) })
      .from(songPlay)
      .innerJoin(song, eq(song.id, songPlay.songId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(songPlay.userId, userId), visibleAttempt));

    listeningCount = Number(countRow?.count ?? 0);
    totalPages = Math.max(1, Math.ceil(listeningCount / RECENT_LISTENING_LIMIT));
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
        lastPlayedAt,
      })
      .from(songPlay)
      .innerJoin(song, eq(song.id, songPlay.songId))
      .innerJoin(story, eq(story.id, song.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(songPlay.userId, userId), visibleAttempt))
      .groupBy(song.id, story.id, latestAttempt.prompt)
      .orderBy(desc(lastPlayedAt))
      .limit(RECENT_LISTENING_LIMIT)
      .offset((currentPage - 1) * RECENT_LISTENING_LIMIT);

    const favoriteSongIds = new Set<string>();
    if (rows.length > 0) {
      const favorites = await db
        .select({ songId: songFavorite.songId })
        .from(songFavorite)
        .where(
          and(
            eq(songFavorite.userId, userId),
            inArray(
              songFavorite.songId,
              rows.map((row) => row.id)
            )
          )
        );
      favorites.forEach((favorite) => favoriteSongIds.add(favorite.songId));
    }

    recentSongs.push(
      ...rows.map((row) => ({
        ...row,
        createdAt: row.createdAt!,
        durationSec: row.durationSec ?? null,
        plays: row.plays ?? 0,
        category: 'News',
        isLiked: favoriteSongIds.has(row.id),
      }))
    );
  }

  return (
    <main className="min-h-full px-4 py-6 md:px-8 md:py-10 xl:px-12">
      <div className="mx-auto w-full max-w-[1560px]">
        <section aria-labelledby="recently-played-title">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-900/10 pb-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-700">{t('listeningTrail')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h2
                  id="recently-played-title"
                  className="text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl"
                >
                  {t('recentlyPlayed')}
                </h2>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50/80 px-3 py-1.5 text-xs font-black text-cyan-900 shadow-sm">
                  <History className="size-3.5 text-cyan-600" />
                  {listeningCount} {listeningCount === 1 ? t('song') : t('songs')}
                </span>
              </div>
            </div>
            <span className="hidden text-sm font-semibold text-slate-500 sm:block">{t('newestListens')}</span>
          </div>

          <RecentListeningList songs={recentSongs} startIndex={(currentPage - 1) * RECENT_LISTENING_LIMIT} />
          <RecentListeningPagination currentPage={currentPage} totalPages={totalPages} />
        </section>
      </div>
    </main>
  );
}
