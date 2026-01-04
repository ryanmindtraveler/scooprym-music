import HomePage from '@/app/[locale]/(marketing)/(home)/page';

import { SongDetailModal } from '@/components/songs/song-detail-modal';
import { getDb } from '@/db/index';
import { songFavorite, song as songTable } from '@/db/schema';
import { getSession } from '@/lib/server';
import { and, eq } from 'drizzle-orm';
import type { Locale } from 'next-intl';
import { notFound } from 'next/navigation';

interface SongDetailPageProps {
  params: Promise<{
    id: string;
    locale: Locale;
  }>;
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const db = await getDb();
  const session = await getSession();
  const userId = session?.user?.id;

  const [song] = await db.select().from(songTable).where(eq(songTable.id, id));

  if (!song) {
    notFound();
  }

  // Check if favorite
  let isFavorite = false;
  if (userId) {
    const [fav] = await db
      .select()
      .from(songFavorite)
      .where(and(eq(songFavorite.songId, id), eq(songFavorite.userId, userId)));
    isFavorite = !!fav;
  }

  // Wrap HomePage in MarketingLayout to ensure Navbar/Footer are present
  // Note: MarketingLayout expects children.

  return (
    <div className="relative">
      {/* Render Home Page as Background */}
      <HomePage params={Promise.resolve({ locale: resolvedParams.locale })} />

      {/* Render Modal Overlay */}
      <SongDetailModal
        song={{
          ...song,
          createdAt: new Date(song.createdAt).toISOString(),
        }}
        initialIsFavorite={isFavorite}
        defaultOpen={true}
        navigationMode="hard"
        autoPlay={true}
      />
    </div>
  );
}
