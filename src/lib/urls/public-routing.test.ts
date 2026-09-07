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
  ])('%s 统一到 %s', (input, output) => {
    expect(getPublicEnglishPath(input)).toBe(output);
  });
  it.each(['/zh/admin/create', '/zh/dashboard', '/zh/auth/login', '/api/songs', '/songsmith'])(
    '%s 不改变后台与非公开路径',
    (path) => {
      expect(getPublicEnglishPath(path)).toBeNull();
    }
  );
});
