import { describe, expect, it } from 'vitest';
import { getPublicEnglishPath } from './public-routing';

describe('公开英文路由', () => {
  it.each([
    ['/zh', '/'],
    ['/zh/songs/old-id', '/songs/old-id'],
    [
      '/zh/songs/old-title-9ac474b0-e5bb-4d77-a505-6199ff73e489',
      '/songs/old-title-9ac474b0-e5bb-4d77-a505-6199ff73e489',
    ],
    [
      '/songs/another-title-9ac474b0-e5bb-4d77-a505-6199ff73e489/',
      '/songs/another-title-9ac474b0-e5bb-4d77-a505-6199ff73e489/',
    ],
    ['/en/songs', '/songs'],
    ['/zh/features/meme-culture', '/features/meme-culture'],
    ['/songs/example', '/songs/example'],
    ['/zh/about', '/about'],
    ['/zh/docs', '/docs'],
    ['/zh/auth/login', '/auth/login'],
    ['/en/dashboard', '/dashboard'],
    ['/en/admin/create', '/admin/create'],
    ['/songsmith', '/songsmith'],
  ])('%s 统一到 %s', (input, output) => {
    expect(getPublicEnglishPath(input)).toBe(output);
  });
  it.each(['/zh/admin/create', '/zh/dashboard', '/admin/create', '/dashboard'])('%s 保留后台语言路由', (path) => {
    expect(getPublicEnglishPath(path)).toBeNull();
  });
  it.each(['/api/songs', '/_next/static/app.js'])('%s 不改变内部路径', (path) => {
    expect(getPublicEnglishPath(path)).toBeNull();
  });
});
