// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadCachedObject } from './cached-upload';

afterEach(() => vi.unstubAllGlobals());
describe('签名上传缓存元数据', () => {
  it('将缓存头与内容类型加入实际签名请求，并正确编码对象路径', async () => {
    const send = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', send);
    await uploadCachedObject(
      {
        region: 'auto',
        endpoint: 'https://storage.example.com/',
        bucketName: 'covers',
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
      'song-covers/a b/w160.webp',
      Buffer.from('test image'),
      'image/webp',
      'public, max-age=31536000, immutable'
    );
    const request = send.mock.calls[0][0] as Request;
    expect(request.url).toBe('https://storage.example.com/covers/song-covers/a%20b/w160.webp');
    expect(request.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(request.headers.get('Authorization')).toContain('AWS4-HMAC-SHA256');
    expect(request.headers.get('Content-Type')).toBe('image/webp');
    expect(await request.text()).toBe('test image');
  });
});
