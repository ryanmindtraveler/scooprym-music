import retiredSongSlugs from './retired-song-slugs.json';

const retiredSongs = new Set<string>(retiredSongSlugs);

// 已弃用的产品路由统一退出，避免仅隐藏导航后仍被访问或抓取。
export const RETIRED_PAGE_PREFIXES = [
  '/features',
  '/blog',
  '/changelog',
  '/docs',
  '/waitlist',
  '/roadmap',
  '/ai',
  '/magicui',
  '/blocks',
  '/preview',
] as const;

export const RETIRED_API_PATHS = ['/api/chat', '/api/analyze-content', '/api/search', '/api/generate/image'] as const;

export function isRetiredRoute(pathname: string): boolean {
  const path = pathname.replace(/^\/(?:en|zh)(?=\/|$)/, '').replace(/\/$/, '') || '/';
  // 仅退役已确认无公开替代页的历史别名；歌曲当前地址仍由发布状态决定。
  const songSlug = path.match(/^\/songs\/([^/]+)$/)?.[1];
  if (songSlug && retiredSongs.has(songSlug.replace(/-scooprym(?=-\d+$|$)/, '-funny-song'))) return true;
  return [...RETIRED_PAGE_PREFIXES, ...RETIRED_API_PATHS].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function retiredRouteResponse(isApi = false): Response {
  return new Response(
    isApi
      ? JSON.stringify({ error: 'This endpoint has been retired.' })
      : '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page retired | ScoopRYM</title></head><body><main><h1>This page is no longer available.</h1><p><a href="/songs">Browse published songs</a></p></main></body></html>',
    {
      status: 410,
      headers: {
        'Content-Type': isApi ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'no-store',
      },
    }
  );
}
