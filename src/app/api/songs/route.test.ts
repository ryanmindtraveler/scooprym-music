import { PgDialect } from 'drizzle-orm/pg-core';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getSession: vi.fn() }));
vi.mock('@/db/index', () => ({ getDb: mocks.getDb }));
vi.mock('@/lib/auth/server', () => ({ getSession: mocks.getSession }));
vi.mock('@/db/song-query', async () => {
  const { generationAttempt } = await import('@/db/schema');
  return { createLatestGenerationAttemptQuery: () => ({ ...generationAttempt, rowNumber: generationAttempt.id }) };
});
vi.mock('@/lib/creation/song-creation-workflow', () => ({ getSongCreationPhase: () => 'product_check' }));

import { GET } from './route';

describe('管理员恢复创作队列', () => {
  const filters: string[] = [];
  let db: { select: ReturnType<typeof vi.fn>; selectDistinctOn: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.clearAllMocks();
    filters.length = 0;
    let queryIndex = 0;
    const rows = [
      {
        song: {
          id: 'song-1',
          audioKey: 'audio/key',
          audioUrl: 'https://assets.example/song.mp3',
          coverImageKey: null,
          coverImageUrl: '/fallback.png',
        },
        story: { newsSummary: 'A public story', sourceText: 'Story', sourceUrl: 'https://example.com' },
        processingStatus: 'failed_quality_check',
        processingError: 'Cover missing',
        attemptUpdatedAt: '2026-09-03T00:00:00Z',
        prompt: 'meme',
      },
    ];
    function chain(result: unknown, capture = false) {
      const builder: any = {
        from: () => builder,
        innerJoin: () => builder,
        limit: () => builder,
        offset: () => builder,
        where: (filter: any) => {
          if (capture) filters.push(new PgDialect().sqlToQuery(filter).sql);
          return builder;
        },
        orderBy: () => builder,
        // biome-ignore lint/suspicious/noThenProperty: 模拟 Drizzle 可等待查询链。
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
      };
      return builder;
    }
    db = {
      select: vi.fn(() => chain(queryIndex++ === 0 ? [{ count: 1 }] : rows, true)),
      selectDistinctOn: vi.fn(() =>
        chain([{ id: 'run-1', songId: 'song-1', status: 'failed', currentStage: 'checking_product' }])
      ),
    };
    mocks.getDb.mockReturnValue(db);
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
  });

  it('显式恢复时包含失败任务，计数和列表使用同一过滤条件，并给出补封面阶段', async () => {
    const response = await GET(new NextRequest('http://localhost/api/songs?includeProcessing=true&limit=50'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(filters).toHaveLength(2);
    expect(filters.every((filter) => !filter.includes('not in'))).toBe(true);
    expect(filters[0]).toBe(filters[1]);
    expect(body.data[0]).toMatchObject({
      processingStatus: 'failed_quality_check',
      processingError: 'Cover missing',
      workflow: { id: 'run-1', currentStage: 'checking_product', retryableStage: 'generating_cover' },
    });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it.each(['user', 'admin'])('普通列表保留失败过滤：%s', async (role) => {
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1', role } });
    const url = role === 'user' ? '?includeProcessing=true' : '';
    const response = await GET(new NextRequest(`http://localhost/api/songs${url}`));
    const body = await response.json();
    expect(filters.every((filter) => filter.includes('not in'))).toBe(true);
    expect(db.selectDistinctOn).not.toHaveBeenCalled();
    expect(body.data[0].workflow).toBeUndefined();
  });

  it('未登录不读取任务', async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await GET(new NextRequest('http://localhost/api/songs?includeProcessing=true'))).status).toBe(401);
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
});
