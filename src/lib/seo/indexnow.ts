import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { getCanonicalBaseUrl } from '@/lib/urls/urls';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_PATH = '/indexnow-key.txt';
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

/** 验证文件与通知使用同一把密钥；密钥只配置在服务端环境变量中。 */
export function getIndexNowKey() {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && KEY_PATTERN.test(key) ? key : null;
}

/** 仅接受本站的规范路径，避免把后台地址或其他域名误发给搜索引擎。 */
export function getIndexNowPayload(paths: string[]) {
  const key = getIndexNowKey();
  if (!key || process.env.NODE_ENV !== 'production') return null;

  const origin = new URL(getCanonicalBaseUrl());
  const urlList = [...new Set(paths)]
    .filter((path) => path.startsWith('/') && !path.startsWith('//') && !path.includes('?') && !path.includes('#'))
    .map((path) => new URL(path, origin).href);
  if (urlList.length === 0) return null;

  return {
    host: origin.host,
    key,
    keyLocation: new URL(KEY_PATH, origin).href,
    urlList,
  };
}

/** 通知失败只记录日志，不能回滚已经完成的发布或下架。 */
export async function notifyIndexNow(paths: string[]) {
  const payload = getIndexNowPayload(paths);
  if (!payload) return;

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200 && response.status !== 202) {
      console.error('IndexNow notification rejected:', response.status);
    }
  } catch (error) {
    console.error('IndexNow notification failed:', error);
  }
}

/** 歌曲的公开状态变化也会改变首页和歌曲列表。 */
export function getSongIndexNowPaths(songIds: string[], seoSlugs: Record<string, string | null | undefined> = {}) {
  return songIds.length > 0
    ? ['/', '/songs', ...songIds.map((id) => `/songs/${getSongCanonicalSlug({ id, seoSlug: seoSlugs[id] })}`)]
    : [];
}
