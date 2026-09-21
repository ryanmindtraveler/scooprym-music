/**
 * 全站只支持英文。旧的 /en 与 /zh 前缀只用于归并历史 URL，
 * 不代表系统仍支持这些语言路由。
 */
export function getPublicEnglishPath(pathname: string): string | null {
  let path = pathname.replace(/^\/(?:en|zh)(?=\/|$)/, '') || '/';
  const songMatch = path.match(
    /^\/songs\/(?:.*-)?([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i
  );
  if (songMatch) path = `/songs/${songMatch[1]}`;
  return /^\/(?:api|_next|_vercel)(?:\/|$)/.test(path) ? null : path;
}
