import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ process: vi.fn() }));
vi.mock('@/lib/creation/radar-creation-job', () => ({ processRadarCreation: mocks.process }));
vi.mock('@upstash/qstash/nextjs', () => ({ verifySignatureAppRouter: (handler: unknown) => handler }));
import { POST } from './route';
const request = () =>
  new Request('http://localhost/api/worker/radar-creation', {
    method: 'POST',
    body: JSON.stringify({ candidateId: '11111111-1111-4111-8111-111111111111' }),
  });

describe('后台创作错误分类', () => {
  beforeEach(() => vi.clearAllMocks());
  it('明确拒绝的输入进入队列失败终态，不自动重试八次', async () => {
    mocks.process.mockRejectedValue(Object.assign(new Error('Editorial source rejected'), { statusCode: 422 }));
    const response = await POST(request());
    expect(response.status).toBe(489);
    expect(response.headers.get('Upstash-NonRetryable-Error')).toBe('true');
  });
  it('供应商暂时失败仍允许按检查点重试', async () => {
    mocks.process.mockRejectedValue(Object.assign(new Error('Provider unavailable'), { statusCode: 503 }));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('Upstash-NonRetryable-Error')).toBeNull();
  });
  it('损坏消息不反复进入工作流', async () => {
    const response = await POST(
      new Request('http://localhost/api/worker/radar-creation', { method: 'POST', body: '{' })
    );
    expect(response.status).toBe(489);
    expect(mocks.process).not.toHaveBeenCalled();
  });
});
