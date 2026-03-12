import { websiteConfig } from '@/config/website';
import { featuresContent } from '@/config/features';
import { getDb } from '@/db';
import { song as songTable } from '@/db/schema';
import { getLocalePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { generateHreflangUrls } from '@/lib/hreflang';
import { slugify } from '@/lib/utils';
import { and, desc, isNotNull, ne } from 'drizzle-orm';

import type { MetadataRoute } from 'next';
import type { Locale } from 'next-intl';
import { getBaseUrl } from '../lib/urls/urls';

type Href = Parameters<typeof getLocalePathname>[0]['href'];

/**
 * static routes for sitemap, you may change the routes for your own
 */
const staticRoutes = [
  '/',
  '/pricing',
  '/about',
  '/contact',
  '/waitlist',
  '/changelog',
  '/privacy',
  '/terms',
  '/cookie',
  ...(websiteConfig.blog.enable ? ['/blog'] : []),
  ...(websiteConfig.docs.enable ? ['/docs'] : []),
];

const featureRoutes = Object.keys(featuresContent).map((slug) => `/features/${slug}` as const);

/**
 * Generate a sitemap for the website with hreflang support
 *
 * https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
 * https://github.com/javayhu/cnblocks/blob/main/app/sitemap.ts
 * https://ahrefs.com/blog/hreflang-tags/
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapList: MetadataRoute.Sitemap = []; // final result

  // 1. Add static routes with hreflang
  sitemapList.push(
    ...staticRoutes.flatMap((route) => {
      // Prioritize Home and Pricing
      const priority = route === '/' ? 1.0 : route === '/pricing' ? 0.9 : 0.8;
      const changeFrequency = (route === '/' ? 'daily' : 'weekly') as 'daily' | 'weekly';

      return routing.locales.map((locale) => ({
        url: getUrl(route, locale),
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: generateHreflangUrls(route),
        },
      }));
    })
  );

  sitemapList.push(
    ...featureRoutes.flatMap((route) =>
      routing.locales.map((locale) => ({
        url: getUrl(route, locale),
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
        alternates: {
          languages: generateHreflangUrls(route),
        },
      }))
    )
  );

  // 2. Add dynamic song routes
  try {
    const db = getDb();
    const songs = await db
      .select({
        id: songTable.id,
        title: songTable.title,
        updatedAt: songTable.updatedAt,
        createdAt: songTable.createdAt,
      })
      .from(songTable)
      .where(and(isNotNull(songTable.audioUrl), ne(songTable.audioUrl, 'pending-stream'), ne(songTable.audioUrl, '')))
      .orderBy(desc(songTable.createdAt))
      .limit(5000); // Increased limit to 5000

    sitemapList.push(
      ...songs.flatMap((songItem: { id: string; title: string | null; updatedAt: Date; createdAt: Date }) => {
        const slug = `${slugify(songItem.title || 'song')}-${songItem.id}`;
        const route = `/songs/${slug}`;
        const lastModified = songItem.updatedAt ? new Date(songItem.updatedAt) : new Date(songItem.createdAt);

        return routing.locales.map((locale) => ({
          url: getUrl(route, locale),
          lastModified,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          alternates: {
            languages: generateHreflangUrls(route),
          },
        }));
      })
    );
  } catch (error) {
    console.error('Failed to generate songs sitemap:', error);
  }

  return sitemapList;
}

function getUrl(href: Href, locale: Locale) {
  const pathname = getLocalePathname({ locale, href });
  return getBaseUrl() + pathname;
}
