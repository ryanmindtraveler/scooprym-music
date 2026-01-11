import { websiteConfig } from '@/config/website';
import { getDb } from '@/db';
import { song as songTable } from '@/db/schema';
import { getLocalePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { generateHreflangUrls } from '@/lib/hreflang';
import { and, desc, isNotNull, ne } from 'drizzle-orm';
// import { blogSource, categorySource, source } from '@/lib/source'; // Disabled to fix build crash
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
  '/auth/login',
  '/auth/register',
  ...(websiteConfig.blog.enable ? ['/blog'] : []),
  ...(websiteConfig.docs.enable ? ['/docs'] : []),
];

/**
 * Generate a sitemap for the website with hreflang support
 *
 * https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
 * https://github.com/javayhu/cnblocks/blob/main/app/sitemap.ts
 * https://ahrefs.com/blog/hreflang-tags/
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapList: MetadataRoute.Sitemap = []; // final result

  // add static routes
  sitemapList.push(
    ...staticRoutes.flatMap((route) => {
      return routing.locales.map((locale) => ({
        url: getUrl(route, locale),
        alternates: {
          languages: generateHreflangUrls(route),
        },
      }));
    })
  );

  // Add dynamic song routes
  try {
    const db = getDb();
    const songs = await db
      .select({
        id: songTable.id,
        updatedAt: songTable.updatedAt,
        createdAt: songTable.createdAt,
      })
      .from(songTable)
      .where(and(isNotNull(songTable.audioUrl), ne(songTable.audioUrl, 'pending-stream'), ne(songTable.audioUrl, ''))) // Only public/completed songs
      .orderBy(desc(songTable.createdAt))
      .limit(1000); // Limit to 1000 for performance

    sitemapList.push(
      ...songs.flatMap((songItem: { id: string; updatedAt: Date; createdAt: Date }) => {
        const route = `/songs/${songItem.id}`;
        const lastModified = songItem.updatedAt ? new Date(songItem.updatedAt) : new Date(songItem.createdAt);

        return routing.locales.map((locale) => ({
          url: getUrl(route, locale),
          lastModified,
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
