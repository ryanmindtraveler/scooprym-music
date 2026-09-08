import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), enqueue: vi.fn() }));
vi.mock('@/db', () => ({ getDb: mocks.getDb }));
vi.mock('./music-continuation', () => ({ enqueueMusicContinuation: mocks.enqueue }));
import { recoverStalledMusicJobs } from './music-recovery';

describe('音乐巡检接续', () => {
  beforeEach(() => vi.resetAllMocks());
  function setup(status: string, claimed = true) {
    const rows = [{ id: 'attempt-1', songId: 'song-1', status, version: '2026-09-07 01:00:00.123456' }];
    const chain: any = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: async () => rows,
    };
    const mutations: any[] = [];
    const db: any = {
      select: () => chain,
      update: () => ({
        set: (value: any) => {
          mutations.push(value);
          return { where: () => ({ returning: async () => (claimed ? [{ id: 'attempt-1' }] : []) }) };
        },
      }),
      transaction: async (fn: (tx: any) => unknown) => fn(db),
    };
    mocks.getDb.mockReturnValue(db);
    return mutations;
  }
  it('领取失败时不更新工作流，也不发布接续消息', async () => {
    setup('generating_audio', false);
    expect(await recoverStalledMusicJobs()).toMatchObject({ resumed: 0, stopped: 0 });
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
  it('模型调用结果不明时只标记失败，不再次投递生成', async () => {
    const writes = setup('generating_audio');
    expect(await recoverStalledMusicJobs()).toMatchObject({ stopped: 1 });
    expect(writes[0].processingStatus).toBe('failed_interrupted');
    expect(writes[1].status).toBe('failed');
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
  it('恢复边界投递失败时保留可恢复状态，供下一轮巡检补投', async () => {
    const writes = setup('audio_generated');
    mocks.enqueue.mockRejectedValue(new Error('Queue offline'));
    expect(await recoverStalledMusicJobs()).toMatchObject({ resumed: 0, deliveryFailed: 1 });
    expect(writes).toHaveLength(1);
    expect(writes[0].processingStatus).toBe('audio_generated');
  });
});
