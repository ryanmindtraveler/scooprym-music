import { getDb } from '@/db';
import { song as songTable, story as storyTable, user } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import type { Song } from '@/types/song';
import { and, count, desc, eq, notInArray, sql } from 'drizzle-orm';

export const HOME_GALLERY_PAGE_SIZE = 20;

const failedStatuses = [
  'failed_generation',
  'processing_queue_failed',
  'failed_audio_upload',
  'failed_internal_error',
  'failed_credit_deduction',
];

export async function getHomeGalleryPage(page: number) {
  const db = getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const publicFilter = and(
    eq(user.role, 'admin'),
    eq(songTable.isPublished, true),
    notInArray(latestAttempt.processingStatus, failedStatuses)
  );

  const [[totalRow], rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(songTable)
      .innerJoin(user, eq(songTable.userId, user.id))
      .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(publicFilter),
    db
      .select({
        id: songTable.id,
        seoSlug: songTable.seoSlug,
        storyId: songTable.storyId,
        title: songTable.title,
        createdAt: songTable.createdAt,
        publishedAt: songTable.publishedAt,
        durationSec: songTable.durationSec,
        plays: songTable.plays,
        audioUrl: songTable.audioUrl,
        coverImageUrl: songTable.coverImageUrl,
        sourceUrl: storyTable.sourceUrl,
        newsSummary: storyTable.newsSummary,
      })
      .from(songTable)
      .innerJoin(user, eq(songTable.userId, user.id))
      .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(publicFilter)
      .orderBy(desc(sql`coalesce(${songTable.publishedAt}, ${songTable.createdAt})`), desc(songTable.id))
      .limit(HOME_GALLERY_PAGE_SIZE)
      .offset((page - 1) * HOME_GALLERY_PAGE_SIZE),
  ]);

  const songs = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  })) as Song[];

  return { songs, total: Number(totalRow?.total ?? 0), page };
}

export async function getHomeGallerySong(id: string) {
  const db = getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const [row] = await db
    .select({
      id: songTable.id,
      seoSlug: songTable.seoSlug,
      storyId: songTable.storyId,
      title: songTable.title,
      lyrics: songTable.lyrics,
      createdAt: songTable.createdAt,
      publishedAt: songTable.publishedAt,
      durationSec: songTable.durationSec,
      plays: songTable.plays,
      audioUrl: songTable.audioUrl,
      coverImageUrl: songTable.coverImageUrl,
      prompt: latestAttempt.prompt,
      sourceUrl: storyTable.sourceUrl,
      sourceText: storyTable.sourceText,
      newsSummary: storyTable.newsSummary,
    })
    .from(songTable)
    .innerJoin(user, eq(songTable.userId, user.id))
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        eq(songTable.id, id),
        eq(user.role, 'admin'),
        eq(songTable.isPublished, true),
        notInArray(latestAttempt.processingStatus, failedStatuses)
      )
    )
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  } as Song;
}

export async function getHomeChartCandidates() {
  const db = getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const rows = await db
    .select({
      id: songTable.id,
      seoSlug: songTable.seoSlug,
      seoTopic: songTable.seoTopic,
      storyId: songTable.storyId,
      title: songTable.title,
      createdAt: songTable.createdAt,
      publishedAt: songTable.publishedAt,
      durationSec: songTable.durationSec,
      plays: songTable.plays,
      audioUrl: songTable.audioUrl,
      coverImageUrl: songTable.coverImageUrl,
      newsSummary: storyTable.newsSummary,
      sourceUrl: storyTable.sourceUrl,
    })
    .from(songTable)
    .innerJoin(user, eq(songTable.userId, user.id))
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        eq(user.role, 'admin'),
        eq(songTable.isPublished, true),
        notInArray(latestAttempt.processingStatus, failedStatuses)
      )
    )
    .orderBy(desc(sql`coalesce(${songTable.publishedAt}, ${songTable.createdAt})`), desc(songTable.id))
    .limit(100);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  })) as Song[];
}

/** 累计播放榜独立查询全部已发布歌曲，避免只在最新 100 首中挑选。 */
export async function getAllTimeChartCandidates() {
  const db = getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const rows = await db
    .select({
      id: songTable.id,
      seoSlug: songTable.seoSlug,
      storyId: songTable.storyId,
      title: songTable.title,
      createdAt: songTable.createdAt,
      publishedAt: songTable.publishedAt,
      durationSec: songTable.durationSec,
      plays: songTable.plays,
      audioUrl: songTable.audioUrl,
      coverImageUrl: songTable.coverImageUrl,
      newsSummary: storyTable.newsSummary,
      sourceUrl: storyTable.sourceUrl,
    })
    .from(songTable)
    .innerJoin(user, eq(songTable.userId, user.id))
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        eq(user.role, 'admin'),
        eq(songTable.isPublished, true),
        notInArray(latestAttempt.processingStatus, failedStatuses),
        sql`${songTable.plays} > 0`
      )
    )
    .orderBy(desc(songTable.plays), desc(sql`coalesce(${songTable.publishedAt}, ${songTable.createdAt})`))
    .limit(20);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  })) as Song[];
}
