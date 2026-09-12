// @vitest-environment node
import { PgDialect } from 'drizzle-orm/pg-core';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getSession: vi.fn(), invalidate: vi.fn() }));
vi.mock('@/db', () => ({ getDb: mocks.getDb }));
vi.mock('@/db/index', () => ({ getDb: mocks.getDb }));
vi.mock('@/lib/auth/server', () => ({ getSession: mocks.getSession }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.invalidate }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/components/songs/song-detail-dialog', () => ({ SongDetailDialog: () => null }));
vi.mock('@/db/song-query', async () => {
  const { generationAttempt } = await import('@/db/schema');
  return { createLatestGenerationAttemptQuery: () => ({ ...generationAttempt, rowNumber: generationAttempt.id }) };
});

import Detail from '@/app/[locale]/@modal/(.)songs/[slug]/page';
import { revalidatePublicSongs } from '@/lib/songs/revalidate-public-songs';
import { POST as favorite } from './[id]/favorite/route';
import { POST as play } from './[id]/play/route';
import { GET as favorites } from './favorites/route';
import { GET as recent } from './recent/route';

describe('公开歌曲发布边界', () => {
  const filters: Array<{ sql: string; params: unknown[] }> = [];
  let db: any;
  beforeEach(() => {
    vi.clearAllMocks();
    filters.length = 0;
    const chain: any = {
      from: () => chain,
      innerJoin: () => chain,
      select: () => chain,
      limit: () => chain,
      offset: () => chain,
      groupBy: () => chain,
      orderBy: () => chain,
      set: () => chain,
      returning: () => chain,
      where: (condition: any) => {
        filters.push(new PgDialect().sqlToQuery(condition));
        return chain;
      },
      // biome-ignore lint/suspicious/noThenProperty: 模拟 Drizzle 查询结果。
      then: (resolve: (value: unknown) => unknown) => Promise.resolve([]).then(resolve),
    };
    db = { select: () => chain, update: () => chain, insert: vi.fn() };
    mocks.getDb.mockResolvedValue(db);
    mocks.getSession.mockResolvedValue({ user: { id: 'listener', role: 'user' } });
  });

  function expectPublishedFilter() {
    expect(filters.some((filter) => filter.sql.includes('"is_published" =') && filter.params.includes(true))).toBe(
      true
    );
  }

  it.each([
    ['收藏', favorites],
    ['最近播放', recent],
  ] as const)('%s 的列表与总数均排除下架歌曲', async (_name, get) => {
    const response = await get(new NextRequest('https://example.com/api/songs/list'));
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual([]);
    expect(filters).toHaveLength(2);
    for (const filter of filters) {
      expect(filter.sql).toContain('"is_published" =');
      expect(filter.params).toContain(true);
      expect(filter.params).toContain('listener');
    }
  });

  it.each([
    ['播放', play],
    ['新增收藏', favorite],
  ] as const)('未公开歌曲拒绝%s且不写入历史', async (_name, post) => {
    const response = await post(new Request('https://example.com'), { params: Promise.resolve({ id: 'hidden' }) });
    expect(response.status).toBe(404);
    expect(db.insert).not.toHaveBeenCalled();
    expectPublishedFilter();
  });

  it('弹窗详情拒绝未公开歌曲，404 不被错误页面吞掉', async () => {
    await expect(
      Detail({ params: Promise.resolve({ slug: 'hidden-1a67aef4-fbb1-41bc-b755-ac067aaf8e42', locale: 'en' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expectPublishedFilter();
  });

  it('发布变化清除国际化页面、弹窗及站点地图缓存', () => {
    revalidatePublicSongs();
    expect(mocks.invalidate).toHaveBeenCalledWith('/[locale]', 'layout');
    expect(mocks.invalidate).toHaveBeenCalledWith('/sitemap.xml');
  });
});
