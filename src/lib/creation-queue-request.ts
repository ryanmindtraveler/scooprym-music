type QueueResponse<T> =
  | { ok: true; payload: T }
  | { ok: false; reason: 'network' | 'timeout' | 'cancelled' | 'http' | 'invalid-response'; status?: number };

/** 队列同步是只读后台请求，断连不应变成歌曲失败或未处理的页面异常。 */
export async function fetchCreationQueue<T>(
  signal: AbortSignal,
  request: typeof fetch = fetch,
  timeoutMs = 45_000
): Promise<QueueResponse<T>> {
  if (signal.aborted) return { ok: false, reason: 'cancelled' };
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await request('/api/songs?limit=50&includeProcessing=true', {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, reason: 'http', status: response.status };
    const payload = await response.json();
    if (signal.aborted) return { ok: false, reason: 'cancelled' };
    if (!payload || payload.success !== true) return { ok: false, reason: 'invalid-response' };
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: signal.aborted ? 'cancelled' : timedOut ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
