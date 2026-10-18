import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock('@/db', () => ({ getDb: mocks.getDb }));
vi.mock('@/db/song-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db/song-query')>();
  const { generationAttempt } = await import('@/db/schema');
  return {
    ...actual,
    // 仅替换最新记录子查询；栏目和公开成品过滤仍使用真实实现。
    createLatestGenerationAttemptQuery: () => ({ ...generationAttempt, rowNumber: generationAttempt.id }),
  };
});

import {
  getAllTimeChartCandidates,
  getHomeChartCandidates,
  getHomeGalleryPage,
  getHomeGallerySong,
} from './home-gallery';

type CompiledFilter = { sql: string; params: unknown[] };

describe('首页 Gallery 与榜单的公开成品边界', () => {
  const filters: CompiledFilter[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    filters.length = 0;
    const row = {
      id: 'published-gallery-song',
      createdAt: new Date('2026-10-14T00:00:00Z'),
      publishedAt: new Date('2026-10-14T00:00:00Z'),
      audioUrl: 'https://assets.example/song.mp3',
    };
    mocks.getDb.mockReturnValue({
      select: vi.fn((selection: Record<string, unknown>) => {
        const result = Object.hasOwn(selection, 'total') ? [{ total: 1 }] : [row];
        const query = {
          from: () => query,
          innerJoin: () => query,
          orderBy: () => query,
          limit: () => query,
          offset: () => query,
          where: (condition: SQL) => {
            filters.push(new PgDialect().sqlToQuery(condition));
            return query;
          },
          // biome-ignore lint/suspicious/noThenProperty: 模拟 Drizzle 可等待查询链，保留真实 SQL 条件。
          then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
        };
        return query;
      }),
    });
  });

  function expectPublicGalleryBoundary(filter: CompiledFilter) {
    const valuesFor = (column: string) => {
      const matches = [...filter.sql.matchAll(new RegExp(`"${column}" = \\$(\\d+)`, 'g'))];
      expect(matches.length, `缺少 ${column} 的等值过滤`).toBeGreaterThan(0);
      return matches.map((match) => filter.params[Number(match[1]) - 1]);
    };
    expect(valuesFor('is_published').every((value) => value === true)).toBe(true);
    expect(valuesFor('publication_channel')).toEqual(['gallery']);
    expect(valuesFor('role')).toEqual(['admin']);

    // 正向成品白名单能排除 processing、未知新状态；旧失败黑名单会在这里失败。
    const status = filter.sql.match(/"processing_status" in \(([^)]+)\)/);
    expect(status, '必须显式限定公开成品状态').not.toBeNull();
    const statuses = [...status![1].matchAll(/\$(\d+)/g)].map((match) => filter.params[Number(match[1]) - 1]);
    expect(statuses).toEqual(['completed', 'completed_without_cover']);
    expect(filter.sql).not.toMatch(/"processing_status" not in/);

    // HTTP(S) 条件同时挡住 NULL、空字符串、pending-stream 和其他非公开音频地址。
    expect(filter.sql).toMatch(/"audio_url" ~ '\^https\?:\/\/'/);
  }

  it('分页计数与列表都使用相同的栏目、成品状态和可用音频条件', async () => {
    const result = await getHomeGalleryPage(2);
    expect(filters).toHaveLength(2);
    for (const filter of filters) expectPublicGalleryBoundary(filter);
    expect(filters[0]).toEqual(filters[1]);
    expect(result).toMatchObject({ total: 1, page: 2, publicationChannelsVersion: 1 });
    expect(result.songs[0].createdAt).toBe('2026-10-14T00:00:00.000Z');
  });

  it.each([
    ['单曲入口', () => getHomeGallerySong('published-gallery-song')],
    ['近期榜单', getHomeChartCandidates],
    ['累计播放榜', getAllTimeChartCandidates],
  ])('%s 不会放出专题歌曲、进行中任务或缺少公开音频的作品', async (_name, query) => {
    await query();
    expect(filters).toHaveLength(1);
    expectPublicGalleryBoundary(filters[0]);
  });
});
