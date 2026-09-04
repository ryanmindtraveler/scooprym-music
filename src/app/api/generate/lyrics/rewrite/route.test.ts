import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  limit: vi.fn(),
  rewriteLyrics: vi.fn(),
}));

vi.mock('@/lib/server', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/ratelimit', () => ({ getRateLimiter: () => ({ limit: mocks.limit }) }));
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
