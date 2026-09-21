import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import middleware from './middleware';

describe('公开页面规范地址', () => {
  it.each(['/auth/login', '/dashboard', '/unknown-page', '/admin/dashboard'])(
    '历史中文地址统一英文：%s',
    async (path) => {
      vi.stubEnv('NODE_ENV', 'production');
      const response = await middleware(
        new NextRequest(`https://scooprym.app/zh${path}?from=test`, { headers: { host: 'scooprym.app' } })
      );
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toBe(`https://scooprym.app${path}?from=test`);
    }
  );

  it('英文用户页面仍保留认证保护', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest('https://scooprym.app/dashboard', { headers: { host: 'scooprym.app' } })
    );
    expect(response.headers.get('location')).toContain('/auth/login?callbackUrl=');
  });

  it('已退出页面的中文旧地址直接返回 410', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest('https://scooprym.app/zh/docs?from=test', { headers: { host: 'scooprym.app' } })
    );
    expect(response.status).toBe(410);
    expect(response.headers.get('location')).toBeNull();
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

  it('将中文前缀和历史歌曲标题一次归并到 UUID 永久地址', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest('https://scooprym.app/zh/songs/old-title-9ac474b0-e5bb-4d77-a505-6199ff73e489?from=google', {
        headers: { host: 'scooprym.app' },
      })
    );
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      'https://scooprym.app/songs/9ac474b0-e5bb-4d77-a505-6199ff73e489?from=google'
    );
  });

  it.each([
    ['http://scooprym.app/about', 'scooprym.app', 'http', 'https://scooprym.app/about'],
    ['http://www.scooprym.app/zh/about', 'www.scooprym.app', 'http', 'https://scooprym.app/about'],
    ['https://www.scooprym.app/en/about', 'www.scooprym.app', 'https', 'https://scooprym.app/about'],
  ])('协议、主机和语言前缀一次永久归并：%s', async (url, host, proto, expected) => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await middleware(
      new NextRequest(url, {
        headers: { host, 'x-forwarded-host': host, 'x-forwarded-proto': proto },
      })
    );
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(expected);
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
        headers: { host: 'scooprym.app', cookie: 'NEXT_LOCALE=en' },
      })
    );
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('link')).toBeNull();
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en/songs/example');
  });
});
