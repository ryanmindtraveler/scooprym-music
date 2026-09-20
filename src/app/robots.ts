import type { MetadataRoute } from 'next';
import { getCanonicalBaseUrl } from '../lib/urls/urls';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 允许抓取已退出页面的 410，避免 robots 阻挡搜索引擎识别退出状态。
      disallow: ['/api/*', '/settings/*', '/dashboard/*'],
    },
    sitemap: `${getCanonicalBaseUrl()}/sitemap.xml`,
  };
}
