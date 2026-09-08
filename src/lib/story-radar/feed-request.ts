/** 上游超时覆盖响应体读取；限制体积，避免异常源拖垮整个扫描。 */
export async function requestFeed(url: string, timeoutMs = 12_000, attempts = 2, retryDelayMs = 1000) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ScoopRYM-Story-Radar/1.0',
          Accept: 'application/rss+xml, application/atom+xml, application/json, text/xml',
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      });
      if (!response.ok) {
        await response.body?.cancel();
        const error = new FeedRequestError(`HTTP ${response.status}`, response.status);
        if (response.status !== 429 && response.status < 500) throw error;
        if (attempt === attempts - 1) throw error;
      } else {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Empty response body');
        let bytes = 0;
        const decoder = new TextDecoder();
        let text = '';
        try {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > 2 * 1024 * 1024) {
              await reader.cancel();
              throw new Error('Feed exceeds the 2 MB size limit');
            }
            text += decoder.decode(chunk.value, { stream: true });
          }
          return { text: text + decoder.decode(), status: response.status };
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      if (error instanceof FeedRequestError && error.status !== 429 && error.status < 500) throw error;
      if (attempt === attempts - 1) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
  }
  throw new Error('Feed request failed');
}

export class FeedRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export function describeFeedError(error: unknown) {
  if (error instanceof FeedRequestError) return { error: error.message, httpStatus: error.status };
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name))
    return { error: 'Request timed out' };
  // 不把上游响应、连接字符串或堆栈暴露给页面。
  return { error: 'Could not read a valid feed. Check server logs.' };
}
