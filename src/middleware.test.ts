import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import middleware from './middleware';

describe('公开页面规范地址', () => {
  it.each(['/auth/login', '/dashboard', '/docs', '/unknown-page'])('非后台中文地址统一英文：%s', async (path) => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest(`https://scooprym.app/zh${path}?from=test`, { headers: { host: 'scooprym.app' } })
    );
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(`https://scooprym.app${path}?from=test`);
  });

  it('英文用户页面仍保留认证保护', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest('https://scooprym.app/dashboard', { headers: { host: 'scooprym.app' } })
    );
    expect(response.headers.get('location')).toContain('/auth/login?callbackUrl=');
  });

  it('管理后台保留中文', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest('https://scooprym.app/zh/admin/dashboard', {
        headers: { host: 'scooprym.app', cookie: 'better-auth.session_token=test' },
      })
    );
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('将 www 和中文前缀一次合并，并保留查询参数', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest('https://www.scooprym.app/zh/songs/example?from=share', {
        headers: { host: 'www.scooprym.app' },
      })
    );
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://scooprym.app/songs/example?from=share');
  });

  it('中文公开首页重定向到英文首页', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest('https://scooprym.app/zh', { headers: { host: 'scooprym.app' } })
    );
    expect(response.headers.get('location')).toBe('https://scooprym.app/');
  });

  it('正式英文页面不循环跳转，也不发布中文备用链接', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest('https://scooprym.app/songs/example', {
        headers: { host: 'scooprym.app', cookie: 'NEXT_LOCALE=zh' },
      })
    );
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('link')).toBeNull();
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en/songs/example');
  });
});
