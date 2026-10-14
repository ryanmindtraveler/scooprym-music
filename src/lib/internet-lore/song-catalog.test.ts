import { describe, expect, it } from 'vitest';
import { getLoreTopicArchiveSongs, getLoreTopicPinnedSongIds, matchesInternetLoreTopic } from './song-catalog';
import { internetLoreTopics } from './topics';

describe('历史内页原始歌曲关联', () => {
  it('恢复旧源码明确链接的九首及原顺序，不拿同名新版本替换', () => {
    const topic = internetLoreTopics[0];
    const ids = getLoreTopicPinnedSongIds(topic);
    expect(ids).toHaveLength(9);
    expect(ids[0]).toBe('f8a8e177-6f18-4cbd-9f70-1f479128954a');
    expect(ids[1]).toBe('4f0de696-b9d1-451a-abed-b96044514491');
    expect(getLoreTopicArchiveSongs(topic).map((song) => song.title)).toEqual([
      'The Bardstown Bender',
      'Al Dente Felony',
      'The Gavel and the Gas',
      'The Sunshine State Silhouette',
      'The Golden Waterfall',
      'Lights, Sirens, and Lagers',
      'The Flannel Felony',
      'Pasta-Engine Paralysis',
      'Chrome Claw Oklahoma',
    ]);
    expect(matchesInternetLoreTopic(topic, { id: '96b5f038-ba88-4b49-8419-911b15c61cd1' })).toBe(false);
  });

  it('当前曲库即使标题或主题相同也不能混入历史专题', () => {
    expect(matchesInternetLoreTopic(internetLoreTopics[0], { id: '5ccdaff4-3a70-46cb-a4a8-4f52d96939e4' })).toBe(false);
    expect(matchesInternetLoreTopic(internetLoreTopics[1], { id: '6cc68d73-23d7-45c2-a161-a886709349a6' })).toBe(false);
    expect(matchesInternetLoreTopic(internetLoreTopics[4], { id: '9daf2bb1-5d24-408e-810f-f5cf85fe7e6a' })).toBe(false);
  });

  it('尚未找回绑定的五专题保留空列表，不退回当前曲库', () => {
    for (const topic of internetLoreTopics.slice(1)) {
      expect(getLoreTopicPinnedSongIds(topic)).toEqual([]);
      expect(getLoreTopicArchiveSongs(topic)).toEqual([]);
    }
  });
});
