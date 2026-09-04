import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  resolveLyricsReview: vi.fn(),
}));

vi.mock('@/lib/server', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/song-creation-workflow', () => ({ resolveLyricsReview: mocks.resolveLyricsReview }));

import { POST } from './route';

const context = { params: Promise.resolve({ runId: '11111111-1111-4111-8111-111111111111' }) };

function request(body: unknown) {
  return new Request('http://localhost/api/generate/workflows/run/review', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/generate/workflows/[runId]/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mocks.resolveLyricsReview.mockResolvedValue({ id: 'run-1', currentStage: 'lyrics_ready' });
  });

  it('只有管理员可以审核歌词', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
    const response = await POST(request({ decision: 'approved' }), context);
    expect(response.status).toBe(403);
    expect(mocks.resolveLyricsReview).not.toHaveBeenCalled();
  });

  it('批准时可同时保存管理员修订后的标题和歌词', async () => {
    const response = await POST(
      request({ decision: 'approved', title: 'Group Chat Court', lyrics: '[Verse 1]\nReceipts hit the table' }),
      context
    );
    expect(response.status).toBe(200);
    expect(mocks.resolveLyricsReview).toHaveBeenCalledWith({
      runId: '11111111-1111-4111-8111-111111111111',
      userId: 'admin-1',
      decision: 'approved',
      title: 'Group Chat Court',
      lyrics: '[Verse 1]\nReceipts hit the table',
    });
  });

  it('拒绝会保留明确的审核决定', async () => {
    const response = await POST(request({ decision: 'rejected' }), context);
    expect(response.status).toBe(200);
    expect(mocks.resolveLyricsReview).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'rejected', userId: 'admin-1' })
    );
  });
});
