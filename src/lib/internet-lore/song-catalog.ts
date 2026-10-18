import type { Song } from '@/types/song';
import type { LoreTopic } from './topics';

/** 只接受旧页面源码中的显式歌曲关联，不用当前曲库关键词填充历史专题。 */
export const historicalLoreSongIds: Record<string, readonly string[]> = {
  'absurd-social-phenomena': [
    'f8a8e177-6f18-4cbd-9f70-1f479128954a',
    '4f0de696-b9d1-451a-abed-b96044514491',
    '91658fb9-b0f0-4cdd-b586-fcebb7b2d0c7',
    '6523bb10-c6d0-41d6-b0a8-f04b4fd63cd1',
    '63ce09c5-b702-4ec9-8bd4-14b5624d9e1a',
    '3523b8c0-3fde-4fa9-be52-64ebf3683894',
    '316d278c-993c-47b6-973d-0e90d19a5301',
    'f358b6af-c0a9-4ca1-85ed-d450a4e2cb37',
    'e64e85ac-19ff-4ca2-bc06-8429c9a569e4',
  ],
  'entertainment-topics': [],
  'gossip-roast': [],
  'news-parody': [],
  'meme-culture': [],
  'comedy-drill': [],
};

export interface HistoricalLoreSong {
  id: string;
  title: string;
}

// 名称来自旧链接及已核对的原记录；不读取下架歌曲的音频、歌词或私人字段。
const historicalSongTitles: Record<string, string> = {
  'f8a8e177-6f18-4cbd-9f70-1f479128954a': 'The Bardstown Bender',
  '4f0de696-b9d1-451a-abed-b96044514491': 'Al Dente Felony',
  '91658fb9-b0f0-4cdd-b586-fcebb7b2d0c7': 'The Gavel and the Gas',
  '6523bb10-c6d0-41d6-b0a8-f04b4fd63cd1': 'The Sunshine State Silhouette',
  '63ce09c5-b702-4ec9-8bd4-14b5624d9e1a': 'The Golden Waterfall',
  '3523b8c0-3fde-4fa9-be52-64ebf3683894': 'Lights, Sirens, and Lagers',
  '316d278c-993c-47b6-973d-0e90d19a5301': 'The Flannel Felony',
  'f358b6af-c0a9-4ca1-85ed-d450a4e2cb37': 'Pasta-Engine Paralysis',
  'e64e85ac-19ff-4ca2-bc06-8429c9a569e4': 'Chrome Claw Oklahoma',
};

export function getLoreTopicArchiveSongs(topic: Pick<LoreTopic, 'slug'>): HistoricalLoreSong[] {
  return getLoreTopicPinnedSongIds(topic).map((id) => ({ id, title: historicalSongTitles[id] }));
}

export function getLoreTopicPinnedSongIds(topic: Pick<LoreTopic, 'slug'>) {
  return [...new Set(historicalLoreSongIds[topic.slug] ?? [])];
}

export function matchesInternetLoreTopic(topic: Pick<LoreTopic, 'slug'>, song: Pick<Song, 'id'>) {
  return getLoreTopicPinnedSongIds(topic).includes(song.id);
}
