import { describe, expect, it } from 'vitest';
import { getPublicEnglishPath } from './public-routing';

describe('公开英文路由', () => {
  it.each([
    ['/zh', '/'],
    ['/zh/songs/old-id', '/songs/old-id'],
    ['/en/songs', '/songs'],
    ['/zh/features/meme-culture', '/features/meme-culture'],
    ['/songs/example', '/songs/example'],
    ['/zh/about', '/about'],
    ['/zh/docs', '/docs'],
    ['/zh/dashboard', '/dashboard'],
    ['/zh/auth/login', '/auth/login'],
    ['/songsmith', '/songsmith'],
  ])('%s 统一到 %s', (input, output) => {
    expect(getPublicEnglishPath(input)).toBe(output);
  });
  it('/zh/admin/create 同样归并到英文后台', () => {
    expect(getPublicEnglishPath('/zh/admin/create')).toBe('/admin/create');
  });
  it.each(['/api/songs', '/_next/static/app.js'])('%s 不改变内部路径', (path) => {
    expect(getPublicEnglishPath(path)).toBeNull();
  });
});
