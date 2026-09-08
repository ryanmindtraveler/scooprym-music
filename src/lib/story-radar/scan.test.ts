import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), collect: vi.fn() }));
vi.mock('@/db', () => ({ getDb: mocks.getDb }));
vi.mock('./index', () => ({ collectStoryRadarCandidates: mocks.collect }));
import { storyCandidate } from '@/db/schema';
import { RadarScanInProgressError, scanAndStoreRadar } from './scan';

beforeEach(() => vi.resetAllMocks());

function setup(claimed = true) {
  const scanUpdates: unknown[] = [];
  const candidateUpdates: Record<string, unknown>[] = [];
  const tx = {
    update: () => ({
      set: (value: unknown) => {
        scanUpdates.push(value);
        return { where: vi.fn().mockResolvedValue([]) };
      },
    }),
    insert: (table: unknown) => ({
      values: (rows: any) => ({
        onConflictDoNothing: () => ({
          returning: async () =>
            table === storyCandidate
              ? rows
                  .filter((row: any) => !row.sourceUrl.endsWith('/existing'))
                  .map((row: any) => ({ sourceUrl: row.sourceUrl }))
              : claimed
                ? [{ id: 'scan' }]
                : [],
        }),
        onConflictDoUpdate: async ({ set }: { set: Record<string, unknown> }) => {
          candidateUpdates.push(set);
        },
      }),
    }),
    select: () => ({ from: () => ({ where: () => ({ for: async () => [{ id: 'scan' }] }) }) }),
  };
  mocks.getDb.mockResolvedValue({ ...tx, transaction: async (work: (value: typeof tx) => unknown) => work(tx) });
  return { scanUpdates, candidateUpdates };
}

describe('扫描持久化', () => {
  it('超过100条分批保存；新增与刷新分别计数，刷新保留人工状态和歌曲关联', async () => {
    const { scanUpdates, candidateUpdates } = setup();
    mocks.collect.mockResolvedValue({
      status: 'partial',
      sources: [],
      candidates: Array.from({ length: 102 }, (_, index) => ({
        sourceUrl: `https://example.com/${index === 0 ? 'existing' : index}`,
        matchedTerms: ['viral'],
      })),
    });
    expect(await scanAndStoreRadar()).toMatchObject({ discovered: 102, inserted: 101, updated: 1, status: 'partial' });
    expect(candidateUpdates).toHaveLength(1);
    expect(candidateUpdates[0]).not.toHaveProperty('status');
    expect(candidateUpdates[0]).not.toHaveProperty('storyId');
    expect(scanUpdates.at(-1)).toMatchObject({ inserted: 101, updated: 1, status: 'partial' });
  });
  it('并发扫描未拿到租约时不会访问新闻源', async () => {
    setup(false);
    await expect(scanAndStoreRadar()).rejects.toBeInstanceOf(RadarScanInProgressError);
    expect(mocks.collect).not.toHaveBeenCalled();
  });
  it('所有源失败时记录失败，不能返回成功空扫描', async () => {
    const { scanUpdates } = setup();
    mocks.collect.mockResolvedValue({ status: 'failed', sources: [{ name: 'TMZ', status: 'failed' }], candidates: [] });
    expect(await scanAndStoreRadar()).toMatchObject({ status: 'failed', inserted: 0 });
    expect(scanUpdates.at(-1)).toMatchObject({ status: 'failed', error: expect.any(String) });
  });
  it('采集意外异常释放租约并保留失败记录', async () => {
    const { scanUpdates } = setup();
    mocks.collect.mockRejectedValue(new Error('unexpected'));
    await expect(scanAndStoreRadar()).rejects.toThrow('unexpected');
    expect(scanUpdates.at(-1)).toMatchObject({ status: 'failed' });
  });
});
