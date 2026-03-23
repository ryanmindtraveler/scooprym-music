import type { MetadataRoute } from 'next';
import { getCanonicalBaseUrl } from '../lib/urls/urls';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/*', '/settings/*', '/dashboard/*', '/magicui', '/blocks/*', '/preview/*', '/docs', '/docs/*'],
    },
    sitemap: `${getCanonicalBaseUrl()}/sitemap.xml`,
  };
}
