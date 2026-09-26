// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/urls/urls', () => ({ getCanonicalBaseUrl: () => 'https://scooprym.app' }));

import { GET as getKeyFile } from '@/app/indexnow-key.txt/route';
import { getIndexNowPayload, getSongIndexNowPaths, notifyIndexNow } from './indexnow';

const key = 'indexnow-test-key-12345678';

describe('IndexNow 接入', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('INDEXNOW_KEY', key);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('验证文件提供与通知一致的 UTF-8 密钥', async () => {
    const response = getKeyFile();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await response.text()).toBe(key);
  });

  it('未配置或格式错误时不暴露验证文件', () => {
    vi.stubEnv('INDEXNOW_KEY', 'bad key');
    expect(getKeyFile().status).toBe(404);
    expect(getIndexNowPayload(['/songs'])).toBeNull();
  });

  it('只提交本站规范 URL 并去重', () => {
    expect(getIndexNowPayload(['/songs', '/songs', '/songs/abc', '//evil.example/x', '/songs?sort=new'])).toEqual({
      host: 'scooprym.app',
      key,
      keyLocation: 'https://scooprym.app/indexnow-key.txt',
      urlList: ['https://scooprym.app/songs', 'https://scooprym.app/songs/abc'],
    });
    expect(getSongIndexNowPaths(['a', 'b'])).toEqual(['/', '/songs', '/songs/a', '/songs/b']);
    expect(getSongIndexNowPaths(['a'], { a: 'story-funny-song' })).toEqual(['/', '/songs', '/songs/story-funny-song']);
    expect(getSongIndexNowPaths([])).toEqual([]);
  });

  it('生产环境向 IndexNow 批量提交，失败不影响发布流程', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ status: 202 }).mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await notifyIndexNow(['/songs/a', '/songs']);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [endpoint, init] = fetchMock.mock.calls[0];
    expect(endpoint).toBe('https://api.indexnow.org/indexnow');
    expect(JSON.parse(init.body)).toMatchObject({
      keyLocation: 'https://scooprym.app/indexnow-key.txt',
      urlList: ['https://scooprym.app/songs/a', 'https://scooprym.app/songs'],
    });

    await expect(notifyIndexNow(['/songs/b'])).resolves.toBeUndefined();
  });
});
