import { getDb } from '@/db';
import { song as songTable, story as storyTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery, publicSongIndexCondition } from '@/db/song-query';
import { getLocalePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { internetLoreTopics } from '@/lib/internet-lore/topics';
import { getSongCanonicalSlug, getSongPublicDate } from '@/lib/songs/song-seo';
import { and, desc, eq } from 'drizzle-orm';

import type { MetadataRoute } from 'next';
import type { Locale } from 'next-intl';
import { getCanonicalBaseUrl } from '../lib/urls/urls';

type Href = Parameters<typeof getLocalePathname>[0]['href'];

// 发布状态可能通过迁移修复，站点地图不能永久停留在上次构建的快照。
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/**
 * static routes for sitemap, you may change the routes for your own
 */
const staticRoutes = [
  '/',
  '/songs',
  '/internet-lore',
  ...internetLoreTopics.map((topic) => `/internet-lore/${topic.slug}`),
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookie',
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

  // 1. Add static routes with hreflang
  sitemapList.push(
    ...staticRoutes.flatMap((route) => {
      // 内容页高于介绍和政策页；Google 会忽略该字段，但其他消费方仍可读取。
      const priority =
        route === '/' ? 1.0 : route === '/songs' ? 0.8 : route === '/about' || route === '/contact' ? 0.4 : 0.3;
      const changeFrequency = (route === '/' ? 'daily' : 'weekly') as 'daily' | 'weekly';

      return [routing.defaultLocale].map((locale) => ({
        url: getUrl(route, locale),
        changeFrequency,
        priority,
      }));
    })
  );

  // 2. Add dynamic song routes
  try {
    const db = getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const songs = await db
      .select({
        id: songTable.id,
        seoSlug: songTable.seoSlug,
        title: songTable.title,
        newsSummary: storyTable.newsSummary,
        sourceText: storyTable.sourceText,
        createdAt: songTable.createdAt,
        publishedAt: songTable.publishedAt,
      })
      .from(songTable)
      .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(publicSongIndexCondition(latestAttempt.processingStatus))
      .orderBy(desc(songTable.createdAt))
      .limit(5000); // Increased limit to 5000

    sitemapList.push(
      ...songs.map((songItem) => {
        const slug = getSongCanonicalSlug({
          ...songItem,
          title: songItem.title || 'Story song',
        });
        const route = `/songs/${slug}`;
        const lastModified = getSongPublicDate(songItem);

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
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('supabase')) {
      return sitemapList;
    }
    // 数据库异常不能伪装成成功的空歌曲地图，避免搜索引擎误认为内容已移除。
    throw error;
  }

  return sitemapList;
}

function getUrl(href: Href, locale: Locale) {
  const pathname = getLocalePathname({ locale, href });
  return new URL(pathname, getCanonicalBaseUrl()).href;
}
