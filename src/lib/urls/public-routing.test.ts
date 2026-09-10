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
  it.each(['/zh/admin/create', '/api/songs'])('%s 不改变后台与非公开路径', (path) => {
    expect(getPublicEnglishPath(path)).toBeNull();
  });
});
