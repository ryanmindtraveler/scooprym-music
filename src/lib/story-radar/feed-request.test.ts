// @vitest-environment node
import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedRequestError, requestFeed } from './feed-request';

afterEach(() => vi.unstubAllGlobals());

describe('新闻请求容错', () => {
  it('临时服务错误重试，403 不重复请求', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('<rss/>'));
    vi.stubGlobal('fetch', fetcher);
    expect(await requestFeed('https://example.com/feed', 1000, 2, 1)).toMatchObject({ text: '<rss/>' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    fetcher.mockReset().mockResolvedValue(new Response('', { status: 403 }));
    await expect(requestFeed('https://example.com/feed', 1000, 2, 1)).rejects.toBeInstanceOf(FeedRequestError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('响应头已到达但正文挂起时仍然超时', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'Content-Type': 'text/xml' });
      response.write('<rss>');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('测试服务未启动');
    try {
      await expect(requestFeed(`http://127.0.0.1:${address.port}`, 100, 1)).rejects.toThrow();
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('拒绝超大响应，避免无限占用内存', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x'.repeat(2 * 1024 * 1024 + 1))));
    await expect(requestFeed('https://example.com/feed', 1000, 1)).rejects.toThrow('2 MB');
  });
});
