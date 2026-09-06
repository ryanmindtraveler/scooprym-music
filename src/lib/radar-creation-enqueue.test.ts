import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: vi.fn(), publish: vi.fn() }));
vi.mock('@/db', () => ({ getDb: mocks.db }));
vi.mock('@/lib/queue', () => ({
  canUseQStash: () => true,
  getWorkerUrl: () => 'http://localhost:3000/api/worker/radar-creation',
  qstash: { publishJSON: mocks.publish },
}));
import { enqueueRadarCreation } from './radar-creation-enqueue';

describe('热点入队与投递结果', () => {
  beforeEach(() => vi.resetAllMocks());
  function setup() {
    const candidate = {
      id: 'candidate',
      sourceTitle: 'Raccoon steals a hot dog',
      sourceUrl: 'https://example.com/raccoon',
      status: 'shortlisted',
    };
    const job = { candidateId: 'candidate', runId: 'stable-run', songId: 'stable-song', status: 'queued', sequence: 0 };
    const limit = vi.fn().mockResolvedValueOnce([candidate]).mockResolvedValueOnce([job]);
    const values = vi.fn(() => ({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }));
    const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
    mocks.db.mockReturnValue({
      select: () => ({ from: () => ({ where: () => ({ limit }) }) }),
      insert: () => ({ values }),
      update: () => ({ set }),
    });
    return { candidate, values, set };
  }
  it('使用选中新闻的数据并返回数据库中的固定任务 ID', async () => {
    const { candidate, values } = setup();
    mocks.publish.mockResolvedValue({ messageId: 'message' });
    await expect(enqueueRadarCreation('candidate', 'admin')).resolves.toEqual({
      candidateId: 'candidate',
      runId: 'stable-run',
      songId: 'stable-song',
      status: 'queued',
    });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ sourceUrl: candidate.sourceUrl, sourceTitle: candidate.sourceTitle })
    );
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({ deduplicationId: 'radar-candidate-0', body: { candidateId: 'candidate' } })
    );
  });
  it('队列拒绝时标记失败，不把新闻伪装成已进入制作', async () => {
    const { set } = setup();
    mocks.publish.mockRejectedValue(new Error('Queue unavailable'));
    await expect(enqueueRadarCreation('candidate', 'admin')).rejects.toThrow('Queue unavailable');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
    expect(set).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'adopted' }));
  });
});
