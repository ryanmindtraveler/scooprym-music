/**
 * 全站只支持英文。旧的 /en 与 /zh 前缀只用于归并历史 URL，
 * 不代表系统仍支持这些语言路由。
 */
export function getPublicEnglishPath(pathname: string): string | null {
  const path = pathname.replace(/^\/(?:en|zh)(?=\/|$)/, '') || '/';
  return /^\/(?:api|_next|_vercel)(?:\/|$)/.test(path) ? null : path;
}
