import { SongDetailDialog } from '@/components/songs/song-detail-dialog';
import { getDb } from '@/db/index';
import { songFavorite, song as songTable } from '@/db/schema';
import { routing } from '@/i18n/routing';
import { getSession } from '@/lib/auth/server';
import { getLegacySongSlugRedirect } from '@/lib/songs/song-seo';
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
  const { slug } = resolvedParams;
  const legacyTarget = getLegacySongSlugRedirect(slug);
  if (legacyTarget) {
    permanentRedirect(new URL(getUrlWithLocale(`/songs/${legacyTarget}`, routing.defaultLocale)).href);
  }
  const id = getIdFromSlug(slug);

  const db = await getDb();
  const session = await getSession();
  const userId = session?.user?.id;

  const [song] = await db
    .select()
    .from(songTable)
    .where(and(or(eq(songTable.id, id), eq(songTable.seoSlug, slug)), eq(songTable.isPublished, true)));

  if (!song) {
    notFound();
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
