import { describe, expect, it } from 'vitest';
import { getLoreTopicArchiveCases } from './archive-cases';
import { getLoreTopicPinnedSongIds } from './song-catalog';
import { internetLoreTopics } from './topics';

describe('旧六专题创作主题的来源与边界', () => {
  it('保留六页原主题及顺序，每页九个独立的可链接条目', () => {
    const firstTitles = [
      'The Kentucky Bourbon Raccoon (2025)',
      'The Coldplay Kiss-Cam Disaster (2025)',
      'The "Toxic Gossip Train" Apology (2025)',
      'The Eiffel Tower Demolition Hoax (2026)',
      'The "6-7" Meme Chaos (2025)',
      'The "Forgot Password" Loop',
    ];
    internetLoreTopics.forEach((topic, index) => {
      const cases = getLoreTopicArchiveCases(topic);
      expect(cases).toHaveLength(9);
      expect(cases[0].originalTitle).toBe(firstTitles[index]);
      expect(new Set(cases.map((entry) => entry.id)).size).toBe(9);
      expect(cases.map((entry) => entry.id)).toEqual(
        Array.from({ length: 9 }, (_, index) => `original-${String(index + 1).padStart(2, '0')}`)
      );
    });
  });

  it('九首固定原作保持原页绑定，不跨分类或按同题补位', () => {
    const topic = internetLoreTopics[0];
    expect(getLoreTopicArchiveCases(topic).map((entry) => entry.songId)).toEqual(getLoreTopicPinnedSongIds(topic));
    for (const other of internetLoreTopics.slice(1)) {
      expect(getLoreTopicArchiveCases(other).every((entry) => !entry.songId)).toBe(true);
    }
  });

  it('不把未经核实的旧年份或机器人法案写成新闻事实', () => {
    const cases = getLoreTopicArchiveCases(internetLoreTopics[0]);
    expect(cases.every((entry) => !/\(20\d{2}\)/.test(entry.title))).toBe(true);
    expect(cases[8].premise).toContain('creative premise');
    expect(cases[8].premise).toContain('rather than evidence of a real law');
    expect(getLoreTopicArchiveCases({ slug: 'unknown' })).toEqual([]);
  });
});
