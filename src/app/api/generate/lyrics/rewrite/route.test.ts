import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  limit: vi.fn(),
  rewriteLyrics: vi.fn(),
  getWorkflowRun: vi.fn(),
}));

vi.mock('@/lib/creation/song-creation-workflow', () => ({ getWorkflowRun: mocks.getWorkflowRun }));

vi.mock('@/lib/auth/server', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/infrastructure/ratelimit', () => ({ getRateLimiter: () => ({ limit: mocks.limit }) }));
vi.mock('@/ai/text/lib/generation', () => ({ rewriteLyrics: mocks.rewriteLyrics }));

import { POST } from './route';

function createRequest(body: unknown) {
  return new Request('http://localhost/api/generate/lyrics/rewrite', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/generate/lyrics/rewrite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue({ success: true });
  });

  it('区分未登录和无管理员权限', async () => {
    mocks.getSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ user: { id: 'user-1', role: 'user' } });

    expect((await POST(createRequest({ selectedText: 'A lyric line' }))).status).toBe(401);
    expect((await POST(createRequest({ selectedText: 'A lyric line' }))).status).toBe(403);
    expect(mocks.rewriteLyrics).not.toHaveBeenCalled();
  });

  it('管理员可以重写通过校验的歌词', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mocks.rewriteLyrics.mockResolvedValue('Sharper rewritten lyric');

    const response = await POST(createRequest({ selectedText: 'Original lyric', style: 'Satirical rap' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, rewrittenText: 'Sharper rewritten lyric' });
  });
});

describe('重写创作上下文', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mocks.limit.mockResolvedValue({ success: true });
  });
  it('从当前管理员的工作流加载约束，忽略客户端伪造的工作坊', async () => {
    const workshop = { satireTarget: 'A public contradiction' };
    mocks.getWorkflowRun.mockResolvedValue({ lyricWorkshop: workshop, sourceText: 'Original report' });
    mocks.rewriteLyrics.mockResolvedValue('New line');
    const response = await POST(
      createRequest({
        workflowRunId: 'run-1',
        selectedText: 'Old line',
        context: '  Old line',
        selectionStart: 2,
        workshop: { satireTarget: 'Injected' },
      })
    );
    expect(response.status).toBe(200);
    expect(mocks.getWorkflowRun).toHaveBeenCalledWith('run-1', 'admin-1');
    expect(mocks.rewriteLyrics).toHaveBeenCalledWith(
      expect.objectContaining({ workshop, sourceText: 'Original report', selectionStart: 2 })
    );
  });
  it('不读取其他管理员或不存在的工作流', async () => {
    mocks.getWorkflowRun.mockResolvedValue(undefined);
    const response = await POST(createRequest({ workflowRunId: 'other-run', selectedText: 'Old line' }));
    expect(response.status).toBe(404);
    expect(mocks.rewriteLyrics).not.toHaveBeenCalled();
  });
  it('偏移与选中文字不符时不调用模型', async () => {
    const response = await POST(
      createRequest({ selectedText: 'Old line', context: 'Changed line', selectionStart: 0 })
    );
    expect(response.status).toBe(409);
    expect(mocks.rewriteLyrics).not.toHaveBeenCalled();
  });
});
