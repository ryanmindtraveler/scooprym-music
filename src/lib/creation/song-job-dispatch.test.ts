import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), after: vi.fn(), canUseQStash: vi.fn(), publish: vi.fn() }));
vi.mock('@/db/index', () => ({ getDb: mocks.getDb }));
vi.mock('next/server', () => ({ after: mocks.after }));
vi.mock('@/lib/creation/song-workflow', () => ({ processMusicJob: vi.fn() }));
vi.mock('@/lib/creation/song-creation-workflow', () => ({
  getWorkflowRunBySongId: vi.fn(async () => undefined),
  startWorkflowStage: vi.fn(),
  failWorkflowStep: vi.fn(),
}));
vi.mock('@/lib/infrastructure/queue', () => ({
  canUseQStash: mocks.canUseQStash,
  getWorkerUrl: (path: string) => `https://example.com${path}`,
  qstash: { publishJSON: mocks.publish },
}));
import { dispatchMusicJob } from './song-job-dispatch';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('生产环境持久队列', () => {
  it.each([false, true])('队列不可用或发布失败都不能降级到 after：%s', async (configured) => {
    vi.stubEnv('NODE_ENV', 'production');
    const chain: any = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: async () => [{ id: 'attempt-1' }],
    };
    const updateWhere = vi.fn(async () => undefined);
    mocks.getDb.mockResolvedValue({ select: () => chain, update: () => ({ set: () => ({ where: updateWhere }) }) });
    mocks.canUseQStash.mockReturnValue(configured);
    mocks.publish.mockRejectedValue(new Error('Queue offline'));
    await expect(dispatchMusicJob('song-1', 'admin-1')).rejects.toThrow(
      configured ? 'Queue offline' : 'Persistent music queue is not configured'
    );
    expect(mocks.after).not.toHaveBeenCalled();
    expect(updateWhere).toHaveBeenCalledOnce();
  });
});
