import { SongDetailDialog } from '@/components/songs/song-detail-dialog';
import { getDb } from '@/db/index';
import { songFavorite, song as songTable } from '@/db/schema';
import { getSession } from '@/lib/server';
import { getIdFromSlug } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';
import type { Locale } from 'next-intl';
import { notFound } from 'next/navigation';

interface SongDetailPageProps {
  params: Promise<{
    slug: string;
    locale: Locale;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function SongDetailInterceptPage({ params }: SongDetailPageProps) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const id = getIdFromSlug(slug);

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
  } catch (error) {
    console.error('Error fetching song details:', error);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white p-10">
        <div className="bg-red-900/50 p-6 rounded-xl border border-red-500">
          <h2 className="text-xl font-bold mb-2">DB/Fetch Error</h2>
          <pre className="text-sm overflow-auto max-h-[200px]">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}
