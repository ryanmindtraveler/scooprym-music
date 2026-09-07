import { featuresContent } from '@/config/features';
import { websiteConfig } from '@/config/website';
import { getDb } from '@/db';
import { song as songTable, story as storyTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getLocalePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { and, desc, eq, isNotNull, ne, notInArray } from 'drizzle-orm';

import type { MetadataRoute } from 'next';
import type { Locale } from 'next-intl';
import { getCanonicalBaseUrl } from '../lib/urls/urls';

type Href = Parameters<typeof getLocalePathname>[0]['href'];

/**
 * static routes for sitemap, you may change the routes for your own
 */
const staticRoutes = [
  '/',
  '/songs',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookie',
  ...(websiteConfig.blog.enable ? ['/blog'] : []),
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

      return [routing.defaultLocale].map((locale) => ({
        url: getUrl(route, locale),
        changeFrequency,
        priority,
      }));
    })
  );

  sitemapList.push(
    ...featureRoutes.flatMap((route) =>
      [routing.defaultLocale].map((locale) => ({
        url: getUrl(route, locale),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }))
    )
  );

  // 2. Add dynamic song routes
  try {
    const db = getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const songs = await db
      .select({
        id: songTable.id,
        title: songTable.title,
        newsSummary: storyTable.newsSummary,
        sourceText: storyTable.sourceText,
        updatedAt: songTable.updatedAt,
        createdAt: songTable.createdAt,
      })
      .from(songTable)
      .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(
          eq(songTable.isPublished, true),
          notInArray(latestAttempt.processingStatus, [
            'failed_generation',
            'processing_queue_failed',
            'failed_audio_upload',
            'failed_credit_deduction',
          ]),
          isNotNull(songTable.audioUrl),
          ne(songTable.audioUrl, 'pending-stream'),
          ne(songTable.audioUrl, '')
        )
      )
      .orderBy(desc(songTable.createdAt))
      .limit(5000); // Increased limit to 5000

    sitemapList.push(
      ...songs.map((songItem) => {
        const slug = getSongCanonicalSlug({
          ...songItem,
          title: songItem.title || 'Story song',
        });
        const route = `/songs/${slug}`;
        const lastModified = songItem.updatedAt ? new Date(songItem.updatedAt) : new Date(songItem.createdAt);

        return {
          url: getUrl(route as Href, routing.defaultLocale),
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      })
    );
  } catch (error) {
    console.error('Failed to generate songs sitemap:', error);
    // 数据库异常不能伪装成成功的空歌曲地图，避免搜索引擎误认为内容已移除。
    throw error;
  }

  return sitemapList;
}

function getUrl(href: Href, locale: Locale) {
  const pathname = getLocalePathname({ locale, href });
  return getCanonicalBaseUrl() + pathname;
}
