import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  limit: vi.fn(),
  generateLyrics: vi.fn(),
  startLyricsWorkflow: vi.fn(),
  completeLyricsWorkflow: vi.fn(),
  failWorkflowStep: vi.fn(),
  getWorkflowRun: vi.fn(),
  recordLyricsCheckpoint: vi.fn(),
}));

vi.mock('@/lib/server', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/ratelimit', () => ({ getRateLimiter: () => ({ limit: mocks.limit }) }));
vi.mock('@/ai/text/lib/generation', () => ({ generateLyrics: mocks.generateLyrics }));
vi.mock('@/lib/song-creation-workflow', () => ({
  startLyricsWorkflow: mocks.startLyricsWorkflow,
  completeLyricsWorkflow: mocks.completeLyricsWorkflow,
  failWorkflowStep: mocks.failWorkflowStep,
  getWorkflowRun: mocks.getWorkflowRun,
  recordLyricsCheckpoint: mocks.recordLyricsCheckpoint,
}));

import { POST } from './route';

function createRequest(body: unknown) {
  return new Request('http://localhost/api/generate/lyrics', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/generate/lyrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue({ success: true });
    mocks.startLyricsWorkflow.mockResolvedValue({ runId: 'run-1', stepId: 'step-1' });
    mocks.completeLyricsWorkflow.mockResolvedValue(undefined);
    mocks.failWorkflowStep.mockResolvedValue(undefined);
    mocks.getWorkflowRun.mockResolvedValue(undefined);
    mocks.recordLyricsCheckpoint.mockResolvedValue(undefined);
  });

  it('未登录返回 401', async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await POST(createRequest({ prompt: 'A complete source story.' }));
    expect(response.status).toBe(401);
    expect(mocks.generateLyrics).not.toHaveBeenCalled();
  });

  it('非管理员返回 403', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
    const response = await POST(createRequest({ prompt: 'A complete source story.' }));
    expect(response.status).toBe(403);
    expect(mocks.generateLyrics).not.toHaveBeenCalled();
  });

  it('兼容 style 字段并透传规范化来源快照', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mocks.generateLyrics.mockResolvedValue({
      title: 'Viral Receipt',
      summary: 'A concise source summary.',
      angle: 'A satirical diss.',
      lyrics: '[Intro]\nReceipts on the table',
      source: {
        url: 'https://example.com/story',
        title: 'Original report',
        text: 'The exact extracted source text used by the model.',
        fetchedAt: '2026-08-22T00:00:00.000Z',
      },
    });

    const response = await POST(
      createRequest({
        newsUrl: 'https://example.com/story',
        prompt: '',
        style: 'Aggressive comedy rap with a sarcastic hook',
        modelProvider: 'openrouter',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.generateLyrics).toHaveBeenCalledWith(
      expect.objectContaining({ directionPrompt: 'Aggressive comedy rap with a sarcastic hook' })
    );
    expect(body.source).toEqual({
      url: 'https://example.com/story',
      title: 'Original report',
      text: 'The exact extracted source text used by the model.',
      fetchedAt: '2026-08-22T00:00:00.000Z',
    });
    expect(body.workflowStage).toBe('lyrics_ready');
  });

  it('普通质量建议只记录不再阻断自动生产', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mocks.generateLyrics.mockResolvedValue({
      title: 'Needs One More Pass',
      summary: 'A concise source summary.',
      lyrics: '[Verse 1]\nOne supported scene',
      source: { text: 'Source text' },
      requiresReview: false,
      workshop: { safety: { decision: 'allow' }, qualityGate: { passed: false } },
    });

    const response = await POST(createRequest({ prompt: 'A complete source story.' }));
    const body = await response.json();
    expect(body.workflowStage).toBe('lyrics_ready');
    expect(mocks.completeLyricsWorkflow).toHaveBeenCalledWith(
      'run-1',
      'step-1',
      expect.objectContaining({ requiresReview: false })
    );
  });

  it('安全边界不允许通过人工赞成绕过', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mocks.generateLyrics.mockResolvedValue({
      title: 'Unsafe Draft',
      summary: 'A sensitive source summary.',
      lyrics: '[Verse 1]\nUnsafe material',
      source: { text: 'Source text' },
      requiresReview: true,
      workshop: {
        safety: { decision: 'review', reason: 'Sensitive protected-topic framing.' },
        qualityGate: { passed: true },
      },
    });

    const response = await POST(createRequest({ prompt: 'A sensitive source story.' }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toContain('clearer evidence or attribution');
    expect(mocks.completeLyricsWorkflow).not.toHaveBeenCalled();
  });

  it('不向前端泄露模型供应商的密钥错误', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    const providerError = new Error('Incorrect API key provided: sk-proj-sensitive-value');
    Object.assign(providerError, { statusCode: 401 });
    mocks.generateLyrics.mockRejectedValue(providerError);

    const response = await POST(createRequest({ prompt: 'A complete source story.' }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      success: false,
      category: 'SYSTEM',
      error:
        'The AI writing service is temporarily unavailable. Please check the configured provider credentials and try again.',
      code: 503,
    });
    expect(JSON.stringify(body)).not.toContain('sk-proj');
  });
});
