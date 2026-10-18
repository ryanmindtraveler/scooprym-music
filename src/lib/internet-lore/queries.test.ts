import { type SQL, sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInternetLoreTopicContent, getInternetLoreTopicPreviews } from './queries';

const mocked = vi.hoisted(() => {
  const query = { from: vi.fn(), innerJoin: vi.fn(), where: vi.fn(), orderBy: vi.fn() };
  query.from.mockReturnValue(query);
  query.innerJoin.mockReturnValue(query);
  query.where.mockReturnValue(query);
  return { query, getDb: vi.fn(() => ({ select: () => query })) };
});
vi.mock('@/db', () => ({ getDb: mocked.getDb }));
vi.mock('@/db/song-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db/song-query')>();
  const { sql } = await import('drizzle-orm');
  return {
    ...actual,
    createLatestGenerationAttemptQuery: () => ({
      songId: sql`latest_song_id`,
      rowNumber: sql`latest_row_number`,
      processingStatus: sql`latest_status`,
    }),
  };
});

beforeEach(() => {
  mocked.getDb.mockClear();
  mocked.query.where.mockClear();
  mocked.query.orderBy.mockResolvedValue([]);
});

describe('原始专题歌单的关联与公开边界', () => {
  it('只展示显式归入专题的公开成品，重试中和无 HTTP 音频的作品不进入页面', async () => {
    await getInternetLoreTopicContent('absurd-social-phenomena');
    const condition = mocked.query.where.mock.calls[0][0] as SQL;
    const query = new PgDialect().sqlToQuery(sql`${condition}`);
    expect(query.sql).toContain('"is_published"');
    expect(query.sql).toContain('"audio_url"');
    expect(query.sql).toContain('latest_status');
    expect(query.sql).not.toContain('ilike');
    expect(query.params).toContain(true);
    expect(query.sql).toContain('"audio_url" ~ \'^https?://\'');
    expect(query.sql).toContain('latest_status in');
    expect(query.params).toContain('completed');
    expect(query.params).toContain('completed_without_cover');
    expect(query.params).toContain('internet_lore');
    expect(query.params).toContain('absurd-social-phenomena');
    expect(query.sql).toContain('"publication_channel"');
    expect(query.sql).toContain('"lore_topic_slug"');
    expect(query.params).not.toContain('5ccdaff4-3a70-46cb-a4a8-4f52d96939e4');
  });

  it('当前曲库作品不能替代原歌单，预览不输出音频或创作数据', async () => {
    mocked.query.orderBy.mockResolvedValue([
      {
        id: 'f8a8e177-6f18-4cbd-9f70-1f479128954a',
        title: 'The Bardstown Bender',
        newsSummary: 'Original archived track.',
        seoTopic: null,
        coverImageUrl: 'https://example.com/bardstown.webp',
        audioUrl: 'https://example.com/audio.mp3',
        createdAt: new Date('2026-10-13'),
        publicationChannel: 'internet_lore',
        loreTopicSlug: 'absurd-social-phenomena',
      },
      {
        id: 'another-performance',
        title: 'Another Stage',
        newsSummary: 'An actor at a film premiere.',
        seoTopic: null,
        coverImageUrl: null,
        audioUrl: 'https://example.com/another.mp3',
        createdAt: new Date('2026-10-12'),
      },
    ]);
    const previews = await getInternetLoreTopicPreviews();
    expect(previews['absurd-social-phenomena'].songCount).toBe(1);
    expect(previews['absurd-social-phenomena'].archiveCount).toBe(9);
    expect(previews['meme-culture'].songCount).toBe(0);
    expect(previews['entertainment-topics'].songCount).toBe(0);
    expect(previews['gossip-roast'].songCount).toBe(0);
    expect(Object.keys(previews['meme-culture']).sort()).toEqual([
      'archiveCount',
      'coverImageUrl',
      'songCount',
      'themeCount',
      'title',
    ]);
    expect(JSON.stringify(previews)).not.toContain('audio.mp3');
  });

  it('其他专题也按明确栏目与专题查询，不回退关键词匹配或当前曲库', async () => {
    const result = await getInternetLoreTopicContent('entertainment-topics');
    const condition = mocked.query.where.mock.calls[0][0] as SQL;
    const query = new PgDialect().sqlToQuery(sql`${condition}`);
    expect(query.params).toContain('internet_lore');
    expect(query.params).toContain('entertainment-topics');
    expect(query.sql).not.toContain('ilike');
    expect(result).toEqual({ entries: [], songs: [] });
  });
});
