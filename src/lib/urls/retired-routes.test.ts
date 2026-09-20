import { describe, expect, it } from 'vitest';
import { isRetiredRoute, retiredRouteResponse } from './retired-routes';

describe('弃用路由边界', () => {
  it.each([
    '/ai/chat',
    '/zh/docs/intro',
    '/en/blog/category/test',
    '/features/gossip-roast',
    '/roadmap/',
    '/waitlist',
    '/api/chat',
    '/api/generate/image',
  ])('%s 退出访问', (path) => {
    expect(isRetiredRoute(path)).toBe(true);
  });
  it.each([
    '/songs',
    '/songs/ai-song-id',
    '/admin/create',
    '/zh/admin/songs',
    '/api/generate/music',
    '/api/generate/cover/retry',
    '/api/auth/callback/google',
    '/api/webhooks/stripe',
    '/pricing',
    '/api/proxy-image',
    '/ai-tools',
  ])('%s 不被误拦', (path) => {
    expect(isRetiredRoute(path)).toBe(false);
  });
  it('页面与接口均真实退出且不输出可索引内容', async () => {
    for (const isApi of [true, false]) {
      const response = retiredRouteResponse(isApi);
      expect(response.status).toBe(410);
      expect(response.headers.get('x-robots-tag')).toBe('noindex');
      expect(response.headers.get('location')).toBeNull();
      expect(await response.text()).not.toContain('canonical');
    }
  });
});
