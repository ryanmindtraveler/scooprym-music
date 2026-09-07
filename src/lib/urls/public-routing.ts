/** 公开内容统一英文，后台、账户与认证流程继续保留各自的语言。 */
export function getPublicEnglishPath(pathname: string): string | null {
  const path = pathname.replace(/^\/(?:en|zh)(?=\/|$)/, '') || '/';
  const roots = [
    'songs',
    'features',
    'about',
    'contact',
    'privacy',
    'terms',
    'cookie',
    'pricing',
    'waitlist',
    'changelog',
    'blog',
    'docs',
  ];
  return path === '/' || roots.some((root) => path === `/${root}` || path.startsWith(`/${root}/`)) ? path : null;
}
