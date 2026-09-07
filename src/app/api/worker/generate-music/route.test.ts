import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  processMusicJob: vi.fn(),
  failActiveMusicJob: vi.fn(),
}));

vi.mock('@/lib/creation/song-workflow', () => ({
  processMusicJob: mocks.processMusicJob,
  failActiveMusicJob: mocks.failActiveMusicJob,
}));
vi.mock('@upstash/qstash/nextjs', () => ({ verifySignatureAppRouter: (handler: unknown) => handler }));

import { NextRequest } from 'next/server';
import { handleGenerateMusicWorker } from './handler';

const songId = '11111111-1111-4111-8111-111111111111';

function createRequest(body: unknown) {
  return new NextRequest('http://localhost/api/worker/generate-music', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('generate music worker contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('只接受 songId，不信任消息中的 owner、歌词或模型参数', async () => {
    const response = await handleGenerateMusicWorker(
      createRequest({ songId, userId: 'attacker', lyrics: 'replaced', prompt: 'injected' })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'rejected' });
    expect(mocks.processMusicJob).not.toHaveBeenCalled();
  });

  it('明确失败与重复投递均返回 2xx，避免队列从头生成', async () => {
    mocks.processMusicJob
      .mockResolvedValueOnce({ success: false, processingStatus: 'failed_generation', error: 'provider error' })
      .mockResolvedValueOnce({ success: true, skipped: true, processingStatus: 'completed' });

    const failedResponse = await handleGenerateMusicWorker(createRequest({ songId }));
    const duplicateResponse = await handleGenerateMusicWorker(createRequest({ songId }));

    expect(failedResponse.status).toBe(200);
    expect(duplicateResponse.status).toBe(200);
    expect(await failedResponse.json()).toMatchObject({ status: 'failed' });
    expect(await duplicateResponse.json()).toMatchObject({ status: 'duplicate' });
  });

  it('仅在尚未领取任务的数据库故障时返回可重试状态', async () => {
    mocks.processMusicJob.mockResolvedValue({ success: false, retryable: true, error: 'database unavailable' });
    const response = await handleGenerateMusicWorker(createRequest({ songId }));
    expect(response.status).toBe(503);
  });

  it('领取后的未预期异常会尽力写入终态且不触发队列重试', async () => {
    mocks.processMusicJob.mockRejectedValue(new Error('unexpected'));
    const response = await handleGenerateMusicWorker(createRequest({ songId }));

    expect(response.status).toBe(200);
    expect(mocks.failActiveMusicJob).toHaveBeenCalledWith(songId, expect.any(Error));
  });
});
