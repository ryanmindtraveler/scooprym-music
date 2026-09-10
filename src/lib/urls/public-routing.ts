/** 仅 admin 管理后台允许中文；账户、认证及所有其他页面统一英文。 */
export function getPublicEnglishPath(pathname: string): string | null {
  const path = pathname.replace(/^\/(?:en|zh)(?=\/|$)/, '') || '/';
  return /^\/(?:admin|api|_next|_vercel)(?:\/|$)/.test(path) ? null : path;
}
