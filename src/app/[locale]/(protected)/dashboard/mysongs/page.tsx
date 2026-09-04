import { getDb } from '@/db/index';
import { songFavorite, songPlay, song as songTable, story as storyTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSession } from '@/lib/server';
import { and, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';

import { SongsPageClient } from './songs-client';
import type { SongItem } from './types';

export default async function MySongsPage() {
  // 从用户控制台读取真实歌曲数据
  const session = await getSession();
  const userId = session?.user?.id;
  const db = await getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const songSelection = {
    id: songTable.id,
    title: songTable.title,
    createdAt: songTable.createdAt,
    durationSec: songTable.durationSec,
    plays: songTable.plays,
    audioUrl: songTable.audioUrl,
    coverImageUrl: songTable.coverImageUrl,
    lyrics: songTable.lyrics,
    prompt: latestAttempt.prompt,
    sourceText: storyTable.sourceText,
    sourceUrl: storyTable.sourceUrl,
    newsSummary: storyTable.newsSummary,
    processingStatus: latestAttempt.processingStatus,
  };
  const visibleAttempt = notInArray(latestAttempt.processingStatus, [
    'failed_generation',
    'processing_queue_failed',
    'failed_audio_upload',
    'failed_credit_deduction',
  ]);
  const rows = userId
    ? await db
        .select(songSelection)
        .from(songTable)
        .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
        .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
        .where(and(eq(songTable.userId, userId), visibleAttempt))
        .orderBy(desc(songTable.createdAt))
        .limit(9)
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
    processingStatus: r.processingStatus,
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
      .limit(50); // Fetch more to ensure we get 9 unique songs after deduplication

    const recentSongIdsOrdered = Array.from(new Set(recentPlays.map((p) => p.songId)));

    if (recentSongIdsOrdered.length > 0) {
      const recentSongRows = await db
        .select(songSelection)
        .from(songTable)
        .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
        .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
        .where(and(inArray(songTable.id, recentSongIdsOrdered), visibleAttempt));

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
          processingStatus: r!.processingStatus,
        }))
        .slice(0, 9);
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
      const favoriteSongRows = await db
        .select(songSelection)
        .from(songTable)
        .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
        .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
        .where(and(inArray(songTable.id, favoriteSongIdsOrdered), visibleAttempt));

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
          processingStatus: r!.processingStatus,
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
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(songTable.userId, userId), visibleAttempt));
    creationsCount = Number(cCount?.count || 0);

    const [fCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(songFavorite)
      .innerJoin(songTable, eq(songFavorite.songId, songTable.id))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(songFavorite.userId, userId), visibleAttempt));
    favoritesCount = Number(fCount?.count || 0);

    const [rCount] = await db
      .select({ count: sql<number>`count(distinct ${songPlay.songId})` })
      .from(songPlay)
      .innerJoin(songTable, eq(songPlay.songId, songTable.id))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(songPlay.userId, userId), visibleAttempt));
    recentCount = Number(rCount?.count || 0);
  }

  return (
    <>
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
