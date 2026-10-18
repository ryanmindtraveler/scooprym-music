'use server';

import { getDb } from '@/db';
import { song as songTable, story as storyTable } from '@/db/schema';
import {
  createLatestGenerationAttemptQuery,
  lorePublicationCondition,
  publicSongIndexCondition,
} from '@/db/song-query';
import type { Song } from '@/types/song';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getLoreTopicArchiveCases } from './archive-cases';
import { internetLoreEntries } from './content';
import { getLoreTopicPinnedSongIds } from './song-catalog';
import { type LoreTopic, type LoreTopicPreview, getInternetLoreTopic, internetLoreTopics } from './topics';

/** 与曲库使用相同公开条件；只读取播放与编辑摘要需要的字段。 */
async function getPublicLoreSongs(topic?: LoreTopic): Promise<Map<string, Song>> {
  const db = getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const songs = await db
    .select({
      id: songTable.id,
      seoSlug: songTable.seoSlug,
      seoTopic: songTable.seoTopic,
      publicationChannel: songTable.publicationChannel,
      loreTopicSlug: songTable.loreTopicSlug,
      title: songTable.title,
      createdAt: songTable.createdAt,
      durationSec: songTable.durationSec,
      plays: songTable.plays,
      audioUrl: songTable.audioUrl,
      coverImageUrl: songTable.coverImageUrl,
      newsSummary: storyTable.newsSummary,
      sourceUrl: storyTable.sourceUrl,
    })
    .from(songTable)
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(and(lorePublicationCondition(topic?.slug), publicSongIndexCondition(latestAttempt.processingStatus)))
    .orderBy(desc(sql`coalesce(${songTable.publishedAt}, ${songTable.createdAt})`), desc(songTable.id));

  const byId = new Map(songs.map((song) => [song.id, { ...song, createdAt: song.createdAt.toISOString() }]));
  const originalIds = topic ? getLoreTopicPinnedSongIds(topic) : internetLoreTopics.flatMap(getLoreTopicPinnedSongIds);
  const orderedIds = [
    ...originalIds.filter((id) => byId.has(id)),
    ...songs.map((song) => song.id).filter((id) => !originalIds.includes(id)),
  ];
  return new Map(orderedIds.map((id) => [id, byId.get(id)!]));
}

/** 六专题只读取管理员明确选择的专题作品；旧原歌顺序保持稳定。 */
export async function getInternetLoreTopicPreviews(): Promise<Record<string, LoreTopicPreview>> {
  const publicSongs = await getPublicLoreSongs();
  const catalog = [...publicSongs.values()];
  return Object.fromEntries(
    internetLoreTopics.map((topic) => {
      const songs = catalog.filter((song) => song.loreTopicSlug === topic.slug);
      return [
        topic.slug,
        {
          title: topic.title,
          coverImageUrl: null,
          songCount: songs.length,
          archiveCount: getLoreTopicPinnedSongIds(topic).length,
          themeCount: getLoreTopicArchiveCases(topic).length,
        },
      ];
    })
  );
}

/** 返回已公开且显式归入当前专题的作品，不按关键词重排 Gallery。 */
export async function getInternetLoreTopicContent(slug: string) {
  const topic = getInternetLoreTopic(slug);
  if (!topic) throw new Error('未知的 Internet Lore 专题');

  const selectedEntries = internetLoreEntries.filter((entry) => topic.entrySlugs.includes(entry.slug));
  const publicSongs = await getPublicLoreSongs(topic);
  const entries = selectedEntries.map((entry) => ({ ...entry, song: publicSongs.get(entry.songId) ?? null }));
  return { entries, songs: [...publicSongs.values()] };
}
