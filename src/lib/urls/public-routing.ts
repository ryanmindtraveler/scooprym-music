const INTERNAL_PATH = /^\/(?:api|_next|_vercel)(?:\/|$)/;
const BACKEND_PATH = /^\/(?:admin|dashboard)(?:\/|$)/;

/** 只有 admin 与 dashboard 后台允许中文 URL。 */
export function isLocalizedBackendPath(pathname: string): boolean {
  const path = pathname.replace(/^\/(?:en|zh)(?=\/|$)/, '') || '/';
  return BACKEND_PATH.test(path);
}

/** 认证判断始终使用去掉语言前缀后的业务路径。 */
export function getPathnameWithoutLocale(pathname: string): string {
  return pathname.replace(/^\/(?:en|zh)(?=\/|$)/, '') || '/';
}

/**
 * 公开页面只允许英文无前缀 URL。历史 /zh 与 /en 公开地址永久归并；
 * /zh/admin 与 /zh/dashboard 是唯一保留的中文路由。
 */
export function getPublicEnglishPath(pathname: string): string | null {
  const localeMatch = pathname.match(/^\/(en|zh)(?=\/|$)/);
  const locale = localeMatch?.[1];
  let path = getPathnameWithoutLocale(pathname);

  if (INTERNAL_PATH.test(path)) return null;
  if (isLocalizedBackendPath(path) && locale !== 'en') return null;

  const songMatch = path.match(
    /^\/songs\/(?:.*-)?([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i
  );
  if (songMatch) path = `/songs/${songMatch[1]}`;
  return path;
}
