import { QuickGenerateForm } from '@/components/home/quick-generate-form';
import { TrendingGalleryClient } from '@/components/home/trending-gallery-client';
import { Skeleton } from '@/components/ui/skeleton';
import { getDb } from '@/db';
import { songFavorite, song as songTable, user } from '@/db/schema';
import { getSession } from '@/lib/server';
import { isMissingPublishFlagError } from '@/lib/song-publish';
import { and, count, desc, eq, isNull, notInArray, or } from 'drizzle-orm';
import { Flame } from 'lucide-react';
import { Suspense } from 'react';

interface SongItem {
  id: string;
  title: string;
  createdAt: Date;
  durationSec: number | null;
  plays: number;
  audioUrl?: string | null;
  category?: string;
  coverImageUrl?: string | null;
  prompt?: string | null;
  lyrics?: string | null;
  sourceText?: string | null;
  newsSummary?: string | null;
  isLiked: boolean;
}

async function TrendingGallery({ currentPage, sharedSong }: { currentPage: number; sharedSong?: SongItem | null }) {
  const pageSize = 18;
  const offset = (currentPage - 1) * pageSize;
  const failedStatuses: string[] = [
    'failed_generation',
    'processing_queue_failed',
    'failed_audio_upload',
    'failed_credit_deduction',
  ];

  const db = await getDb();
  const session = await getSession();
  const userId = session?.user?.id;

  const publishedWhereConditions = and(
    eq(user.role, 'admin'),
    eq(songTable.isPublished, true),
    or(isNull(songTable.processingStatus), notInArray(songTable.processingStatus, failedStatuses))
  );
  const fallbackWhereConditions = and(
    eq(user.role, 'admin'),
    or(isNull(songTable.processingStatus), notInArray(songTable.processingStatus, failedStatuses))
  );

  let totalCount = 0;
  let rows: Array<typeof songTable.$inferSelect> = [];

  const loadRows = async (whereConditions: ReturnType<typeof and>) => {
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(songTable)
      .innerJoin(user, eq(songTable.userId, user.id))
      .where(whereConditions);

    totalCount = totalCountResult?.count ?? 0;
    rows = await db
      .select()
      .from(songTable)
      .innerJoin(user, eq(songTable.userId, user.id))
      .where(whereConditions)
      .orderBy(desc(songTable.createdAt))
      .limit(pageSize)
      .offset(offset)
      .then((res) => res.map((row) => row.song));
  };

  try {
    await loadRows(publishedWhereConditions);
  } catch (error) {
    if (!isMissingPublishFlagError(error)) {
      throw error;
    }

    console.warn('[protected/home] is_published column missing, fallback query enabled');
    await loadRows(fallbackWhereConditions);
  }

  const likedSongIds = new Set<string>();
  if (userId) {
    const favorites = await db
      .select({ songId: songFavorite.songId })
      .from(songFavorite)
      .where(eq(songFavorite.userId, userId));
    favorites.forEach((f) => likedSongIds.add(f.songId));
  }

  const songs: SongItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt!,
    durationSec: r.durationSec ?? null,
    plays: r.plays ?? 0,
    audioUrl: r.audioUrl,
    category: 'News',
    coverImageUrl: r.coverImageUrl ?? null,
    prompt: r.prompt ?? null,
    lyrics: r.lyrics ?? null,
    sourceText: r.sourceText ?? null,
    newsSummary: r.newsSummary ?? null,
    isLiked: likedSongIds.has(r.id),
  }));

  return (
    <TrendingGalleryClient
      songs={songs}
      currentPage={currentPage}
      totalPages={Math.ceil(totalCount / pageSize)}
      initialSelectedSong={sharedSong}
    />
  );
}

function TrendingGallerySkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 mb-8">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[160px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; s?: string }>;
}) {
  const { page, s: sharedSongId } = await searchParams;
  const currentPage = Number(page) || 1;
  let sharedSong: SongItem | null = null;
  const failedStatuses: string[] = [
    'failed_generation',
    'processing_queue_failed',
    'failed_audio_upload',
    'failed_credit_deduction',
  ];

  if (sharedSongId && typeof sharedSongId === 'string') {
    const db = await getDb();
    const session = await getSession();
    const userId = session?.user?.id;

    const [foundSong] = await db
      .select()
      .from(songTable)
      .where(
        and(
          eq(songTable.id, sharedSongId),
          or(isNull(songTable.processingStatus), notInArray(songTable.processingStatus, failedStatuses))
        )
      )
      .limit(1);

    if (foundSong) {
      let isSharedSongLiked = false;
      if (userId) {
        const [fav] = await db
          .select()
          .from(songFavorite)
          .where(and(eq(songFavorite.userId, userId), eq(songFavorite.songId, foundSong.id)));
        isSharedSongLiked = !!fav;
      }

      sharedSong = {
        ...foundSong,
        isLiked: isSharedSongLiked,
        createdAt: foundSong.createdAt!,
        durationSec: foundSong.durationSec ?? null,
      };
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-full pb-24">
      <section className="w-full py-8 px-4 md:px-8">
        <div className="w-full max-w-[1800px] mx-auto">
          <QuickGenerateForm />
        </div>
      </section>

      <section className="flex-1 p-4 md:p-8">
        <div className="max-w-[1800px] mx-auto w-full space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-full bg-orange-500/10 text-orange-600 shadow-sm ring-1 ring-orange-500/20">
              <Flame className="size-6 fill-orange-500/20" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-slate-100">
                Trending{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">now</span>
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Discover the hottest AI-generated beats from the community
              </p>
            </div>
          </div>

          <Suspense fallback={<TrendingGallerySkeleton />}>
            <TrendingGallery currentPage={currentPage} sharedSong={sharedSong} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
