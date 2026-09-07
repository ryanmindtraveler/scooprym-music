import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCreationQueue } from './creation-queue-request';

describe('创作队列的后台同步', () => {
  afterEach(() => vi.useRealTimers());
  it('断连返回可恢复状态，不抛出页面异常', async () => {
    const request = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchCreationQueue(new AbortController().signal, request)).resolves.toEqual({
      ok: false,
      reason: 'network',
    });
  });
  it('正确读取服务端队列', async () => {
    const payload = { success: true, data: [{ id: 'saved-song' }] };
    await expect(
      fetchCreationQueue(new AbortController().signal, vi.fn().mockResolvedValue(Response.json(payload)))
    ).resolves.toEqual({ ok: true, payload });
  });
  it('服务异常不能被当成空队列覆盖本地数据', async () => {
    await expect(
      fetchCreationQueue(new AbortController().signal, vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    ).resolves.toEqual({ ok: false, reason: 'http', status: 503 });
  });
  it('取消后不再发请求', async () => {
    const controller = new AbortController();
    controller.abort();
    const request = vi.fn();
    expect(await fetchCreationQueue(controller.signal, request)).toEqual({ ok: false, reason: 'cancelled' });
    expect(request).not.toHaveBeenCalled();
  });
  it('超时取消请求并释放计时器', async () => {
    vi.useFakeTimers();
    const request = vi.fn(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        })
    );
    const pending = fetchCreationQueue(new AbortController().signal, request, 100);
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toEqual({ ok: false, reason: 'timeout' });
    expect(vi.getTimerCount()).toBe(0);
  });
  it('读取响应期间卸载页面，不应用迟到结果', async () => {
    const controller = new AbortController();
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        controller.abort();
        return { success: true };
      },
    });
    expect(await fetchCreationQueue(controller.signal, request)).toEqual({ ok: false, reason: 'cancelled' });
  });
});
