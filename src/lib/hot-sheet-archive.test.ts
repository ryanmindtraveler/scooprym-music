import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), refresh: vi.fn() }));
vi.mock('@/db', () => ({ getDb: mocks.getDb }));
vi.mock('@/lib/editorial-workflow', () => ({ refreshEditorialRadar: mocks.refresh }));
import { archiveDailyHotSheet } from './hot-sheet-archive';

describe('每日归档执行', () => {
  const now = new Date('2026-09-05T01:00:00Z');
  beforeEach(() => vi.resetAllMocks());

  function setup(claimed = true, count = 10) {
    const set = vi.fn();
    const where = vi.fn(() => ({ returning: vi.fn().mockResolvedValue([]) }));
    set.mockReturnValue({ where });
    const candidates = Array.from({ length: count }, (_, i) => ({
      id: String(i),
      sourceTitle: `Story ${i}`,
      sourceUrl: `https://example.com/${i}`,
      sourceDomain: 'example.com',
      category: 'internet_chaos',
      publishedAt: now,
      status: 'shortlisted',
      relevanceScore: 100 - i,
    }));
    mocks.getDb.mockResolvedValue({
      insert: () => ({
        values: () => ({
          onConflictDoNothing: () => ({ returning: vi.fn().mockResolvedValue(claimed ? [{ day: '2026-09-04' }] : []) }),
        }),
      }),
      update: () => ({ set }),
      select: () => ({
        from: () => ({ where: () => ({ orderBy: () => ({ limit: vi.fn().mockResolvedValue(candidates) }) }) }),
      }),
    });
    mocks.refresh.mockResolvedValue({ discovered: 12 });
    return { set };
  }

  it('非18点不访问数据库或抓取源', async () => {
    expect(await archiveDailyHotSheet(new Date('2026-09-05T02:00:00Z'))).toMatchObject({ skipped: true });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it('未获得领取权不重复抓取', async () => {
    setup(false);
    expect(await archiveDailyHotSheet(now)).toMatchObject({ reason: 'already_claimed' });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('保存10条完整快照', async () => {
    const { set } = setup();
    expect(await archiveDailyHotSheet(now)).toMatchObject({ day: '2026-09-04', count: 10 });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed', stories: expect.any(Array) }));
    expect(set.mock.calls[0][0].stories[0].publishedAt).toBe(now.toISOString());
  });
  it('不足10条明确标记而不伪造补齐', async () => {
    const { set } = setup(true, 3);
    await archiveDailyHotSheet(now);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'partial' }));
  });
  it('抓取零结果记录失败而不归档旧池为成功', async () => {
    const { set } = setup();
    mocks.refresh.mockResolvedValue({ discovered: 0 });
    await expect(archiveDailyHotSheet(now)).rejects.toThrow('No stories');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });
});
