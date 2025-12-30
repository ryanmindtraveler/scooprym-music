import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { getDb } from '@/db/index';
import { songFavorite, songPlay, song as songTable } from '@/db/schema';
import { getSession } from '@/lib/server';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { SongsPageClient } from './songs-client';
import type { SongItem } from './types';

export default async function MySongsPage() {
  const t = await getTranslations();

  const breadcrumbs = [
    { label: t('Dashboard.dashboard.title'), href: '/dashboard' },
    {
      label: t('Dashboard.songs.title', { default: 'My Songs' }),
      isCurrentPage: true,
    },
  ];

  // 读取真实歌曲数据
  const session = await getSession();
  const userId = session?.user?.id;
  const db = await getDb();
  const rows = userId
    ? await db.select().from(songTable).where(eq(songTable.userId, userId)).orderBy(desc(songTable.createdAt)).limit(9)
    : [];
  const creations: SongItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt!,
    durationSec: r.durationSec ?? null,
    plays: r.plays ?? 0,
    audioUrl: r.audioUrl,
    category: 'News',
    coverImageUrl: r.coverImageUrl ?? null,
    lyrics: r.lyrics,
    prompt: r.prompt,
    sourceText: r.sourceText,
    sourceUrl: r.sourceUrl,
    newsSummary: r.newsSummary,
  }));

  // 读取服务端持久化的最近播放记录（按播放时间倒序去重）
  let recent: SongItem[] = [];
  let favorites: SongItem[] = [];
  if (userId) {
    const recentPlays = await db
      .select({
        songId: songPlay.songId,
        playedAt: songPlay.createdAt,
      })
      .from(songPlay)
      .where(eq(songPlay.userId, userId))
      .orderBy(desc(songPlay.createdAt))
      .limit(20); // Still fetch a bit more for de-duplication if needed, but 20 is enough for page 1

    const recentSongIdsOrdered = Array.from(new Set(recentPlays.map((p) => p.songId)));

    if (recentSongIdsOrdered.length > 0) {
      const recentSongRows = await db.select().from(songTable).where(inArray(songTable.id, recentSongIdsOrdered));

      const byId = new Map(recentSongRows.map((r) => [r.id, r]));

      recent = recentSongIdsOrdered
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((r) => ({
          id: r!.id,
          title: r!.title,
          createdAt: r!.createdAt!,
          durationSec: r!.durationSec ?? null,
          plays: r!.plays ?? 0,
          audioUrl: r!.audioUrl,
          category: 'News',
          coverImageUrl: r!.coverImageUrl ?? null,
          lyrics: r!.lyrics,
          prompt: r!.prompt,
          sourceText: r!.sourceText,
          sourceUrl: r!.sourceUrl,
          newsSummary: r!.newsSummary,
        }));
    }

    const favoriteRows = await db
      .select({
        songId: songFavorite.songId,
        createdAt: songFavorite.createdAt,
      })
      .from(songFavorite)
      .where(eq(songFavorite.userId, userId))
      .orderBy(desc(songFavorite.createdAt))
      .limit(9);

    const favoriteSongIdsOrdered = favoriteRows.map((f) => f.songId);

    if (favoriteSongIdsOrdered.length > 0) {
      const favoriteSongRows = await db.select().from(songTable).where(inArray(songTable.id, favoriteSongIdsOrdered));

      const byId = new Map(favoriteSongRows.map((r) => [r.id, r]));

      favorites = favoriteSongIdsOrdered
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((r) => ({
          id: r!.id,
          title: r!.title,
          createdAt: r!.createdAt!,
          durationSec: r!.durationSec ?? null,
          plays: r!.plays ?? 0,
          audioUrl: r!.audioUrl,
          category: 'News',
          coverImageUrl: r!.coverImageUrl ?? null,
          lyrics: r!.lyrics,
          prompt: r!.prompt,
          sourceText: r!.sourceText,
          sourceUrl: r!.sourceUrl,
          newsSummary: r!.newsSummary,
        }));
    }
  }

  // Fetch counts for pagination
  let creationsCount = 0;
  let recentCount = 0;
  let favoritesCount = 0;

  if (userId) {
    const [cCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(songTable)
      .where(eq(songTable.userId, userId));
    creationsCount = Number(cCount?.count || 0);

    const [fCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(songFavorite)
      .where(eq(songFavorite.userId, userId));
    favoritesCount = Number(fCount?.count || 0);

    const [rCount] = await db
      .select({ count: sql<number>`count(distinct ${songPlay.songId})` })
      .from(songPlay)
      .where(eq(songPlay.userId, userId));
    recentCount = Number(rCount?.count || 0);
  }

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col bg-muted/10">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 p-4 md:p-8">
            <SongsPageClient
              creations={creations}
              recent={recent}
              favorites={favorites}
              userId={userId ?? undefined}
              initialPagination={{
                creations: Math.ceil(creationsCount / 9),
                recent: Math.ceil(recentCount / 9),
                favorites: Math.ceil(favoritesCount / 9),
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
