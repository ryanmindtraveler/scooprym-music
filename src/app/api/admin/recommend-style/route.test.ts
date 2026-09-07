import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), limit: vi.fn(), recommend: vi.fn() }));
vi.mock('@/lib/auth/server', () => ({ getSession: mocks.session }));
vi.mock('@/lib/infrastructure/ratelimit', () => ({ getRateLimiter: () => ({ limit: mocks.limit }) }));
vi.mock('@/ai/text/lib/source-analysis', () => ({ recommendSourceStyle: mocks.recommend }));
import { POST } from './route';
const request = (body: unknown) =>
  new Request('http://localhost/api/admin/recommend-style', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
describe('独立风格推荐入口', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ user: { id: 'admin', role: 'admin' } });
    mocks.limit.mockResolvedValue({ success: true });
  });
  it('拒绝非管理员', async () => {
    mocks.session.mockResolvedValue({ user: { id: 'user', role: 'user' } });
    expect((await POST(request({ newsContent: 'news' }))).status).toBe(403);
    expect(mocks.recommend).not.toHaveBeenCalled();
  });
  it('空新闻不调用模型', async () => {
    expect((await POST(request({}))).status).toBe(400);
    expect(mocks.recommend).not.toHaveBeenCalled();
  });
  it('准确传入当前链接和背景，支持自定义推荐', async () => {
    const result = { styleId: 'viral_pop', tags: ['Boom Bap'], reason: '适合这个新闻' };
    mocks.recommend.mockResolvedValue(result);
    const response = await POST(
      request({ newsLink: 'https://example.com/story-a', newsContent: '背景A', locale: 'zh' })
    );
    expect(mocks.recommend).toHaveBeenCalledWith('https://example.com/story-a', '背景A', 'zh');
    expect(await response.json()).toEqual(result);
  });
  it('仅正文也支持预设推荐', async () => {
    mocks.recommend.mockResolvedValue({ styleId: 'algorithm_circus', tags: ['Jersey Club'], reason: 'Fits' });
    expect((await POST(request({ newsContent: 'A viral game' }))).status).toBe(200);
    expect(mocks.recommend).toHaveBeenCalledWith('', 'A viral game', 'en');
  });
  it('提供商失败不泄露原始错误', async () => {
    mocks.recommend.mockRejectedValue(new Error('private provider credentials'));
    const response = await POST(request({ newsContent: 'News' }));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('credentials');
  });
});
