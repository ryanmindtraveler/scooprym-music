import { SongDetailDialog } from '@/components/songs/song-detail-dialog';
import { getDb } from '@/db/index';
import { songFavorite, song as songTable, story as storyTable } from '@/db/schema';
import { routing } from '@/i18n/routing';
import { getSession } from '@/lib/auth/server';
import {
  decodeSongSlug,
  getLegacySongSlugId,
  getShortenedSongSlugId,
  getSongCanonicalSlug,
  getSongStoredSlug,
} from '@/lib/songs/song-seo';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { getIdFromSlug } from '@/lib/utils';
import { and, eq, or } from 'drizzle-orm';
import type { Locale } from 'next-intl';
import { notFound, permanentRedirect } from 'next/navigation';

interface SongDetailPageProps {
  params: Promise<{
    slug: string;
    locale: Locale;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function SongDetailInterceptPage({ params }: SongDetailPageProps) {
  const resolvedParams = await params;
  const slug = decodeSongSlug(resolvedParams.slug);
  const id = getLegacySongSlugId(slug) || getShortenedSongSlugId(slug) || getIdFromSlug(slug);

  const db = await getDb();
  const session = await getSession();
  const userId = session?.user?.id;

  const [row] = await db
    .select({ song: songTable, newsSummary: storyTable.newsSummary, sourceUrl: storyTable.sourceUrl })
    .from(songTable)
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .where(
      and(
        or(eq(songTable.id, id), eq(songTable.seoSlug, slug), eq(songTable.seoSlug, getSongStoredSlug(slug))),
        eq(songTable.isPublished, true)
      )
    );

  if (!row) {
    notFound();
  }

  // 弹窗与独立详情页读取相同新闻字段，不向公开页面传输原始抓取正文。
  const song = { ...row.song, newsSummary: row.newsSummary, sourceUrl: row.sourceUrl };

  const canonicalSlug = getSongCanonicalSlug(song);
  if (slug !== canonicalSlug) {
    permanentRedirect(new URL(getUrlWithLocale(`/songs/${canonicalSlug}`, routing.defaultLocale)).href);
  }

  // Check if favorite
  let isFavorite = false;
  if (userId) {
    const [fav] = await db
      .select()
      .from(songFavorite)
      .where(and(eq(songFavorite.songId, song.id), eq(songFavorite.userId, userId)));
    isFavorite = !!fav;
  }

  // Explicitly serializable object to avoid "Server Functions cannot return complicated objects" errors
  const serializableSong = {
    ...song,
    createdAt: song.createdAt ? new Date(song.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: song.updatedAt ? new Date(song.updatedAt).toISOString() : new Date().toISOString(),
    // Ensure other potential nulls are handled if the component expects non-null
    durationSec: song.durationSec || 0,
    plays: song.plays || 0,
  };

  return <SongDetailDialog song={serializableSong} initialIsFavorite={isFavorite} navigationMode="intercept" />;
}
