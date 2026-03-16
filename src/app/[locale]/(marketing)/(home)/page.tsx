import HeroSection from '@/components/blocks/hero/hero';
import { JsonLd } from '@/components/seo/json-ld';
import { getDb } from '@/db';
import { song as songTable, user } from '@/db/schema';
import { songFavorite } from '@/db/schema';
import { constructMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/server';
import { slugify } from '@/lib/utils'; // Re-importing utils
import type { Song } from '@/types/song';
import { and, desc, eq, isNull, notInArray, or } from 'drizzle-orm';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';

const MusicGeneratorSection = dynamic(
  () => import('@/components/blocks/generator/music-generator').then((mod) => mod.MusicGeneratorBlock),
  {
    loading: () => <div className="min-h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-3xl m-4" />,
  }
);

const GallerySection = dynamic(() => import('@/components/blocks/gallery/gallery'), {
  loading: () => <div className="min-h-[600px] animate-pulse bg-zinc-50 dark:bg-zinc-900" />,
});

const Features3Section = dynamic(() => import('@/components/blocks/features/features3'));
const PricingSection = dynamic(() => import('@/components/blocks/pricing/pricing'));
const FaqSection = dynamic(() => import('@/components/blocks/faqs/no-ssr-faqs'));

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '',
  });
}

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage(props: HomePageProps) {
  const params = await props.params;
  await params;

  const db = await getDb();

  // Find songs where userId is in the list of admin users
  // "The gallery must show admin role user's songs automatically"
  const adminSongs = await db
    .select()
    .from(songTable)
    .innerJoin(user, eq(songTable.userId, user.id))
    .where(
      and(
        eq(user.role, 'admin'),
        eq(songTable.isPublished, true),
        or(
          isNull(songTable.processingStatus),
          notInArray(songTable.processingStatus, [
            'failed_generation',
            'processing_queue_failed',
            'failed_audio_upload',
            'failed_internal_error',
            'failed_credit_deduction',
          ])
        )
      )
    )
    .orderBy(desc(songTable.createdAt))
    .limit(15)
    .then((res) => res.map((row) => row.song)); // Extract song part from join result

  // Fetch current user session to check for likes
  const session = await getSession();
  const userId = session?.user?.id;
  let likedSongIds = new Set<string>();

  if (userId) {
    const favorites = await db
      .select({ songId: songFavorite.songId })
      .from(songFavorite)
      .where(eq(songFavorite.userId, userId));
    likedSongIds = new Set(favorites.map((f) => f.songId));
  }

  const serializedSongs = adminSongs.map((song) => ({
    ...song,
    isLiked: likedSongIds.has(song.id),
    createdAt: song.createdAt ? song.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: song.updatedAt ? song.updatedAt.toISOString() : new Date().toISOString(),
  })) as unknown as Song[];

  // Handle shared song via query param ?s=xxxx
  const searchParams = await props.searchParams;
  const sharedSongId = searchParams.s as string | undefined;
  let sharedSong: Song | null = null;

  if (sharedSongId) {
    const [foundSong] = await db
      .select()
      .from(songTable)
      .where(
        and(
          eq(songTable.id, sharedSongId),
          or(
            isNull(songTable.processingStatus),
            notInArray(songTable.processingStatus, [
              'failed_generation',
              'processing_queue_failed',
              'failed_audio_upload',
              'failed_internal_error',
              'failed_credit_deduction',
            ])
          )
        )
      )
      .limit(1);

    if (foundSong) {
      // Check if logged in user liked this shared song
      let isSharedSongLiked = false;
      if (userId) {
        // We already have likedSongIds set, utilize it
        isSharedSongLiked = likedSongIds.has(foundSong.id);
      }

      sharedSong = {
        ...foundSong,
        isLiked: isSharedSongLiked,
        createdAt: foundSong.createdAt ? foundSong.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: foundSong.updatedAt ? foundSong.updatedAt.toISOString() : new Date().toISOString(),
      } as unknown as Song;
    }
  }

  // Prepare Structured Data (JSON-LD) for the Gallery
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ScoopRYM Song Spotlight',
    description: 'The latest AI parody songs, funny songs, and viral tracks created from headlines, drama, and gossip.',
    numberOfItems: serializedSongs.length,
    itemListElement: serializedSongs.map((song, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MusicRecording',
        name: song.title,
        image: song.coverImageUrl || undefined,
        datePublished: song.createdAt,
        url: `https://www.scooprym.app/songs/${slugify(song.title || 'song')}-${song.id}`,
        byArtist: {
          '@type': 'MusicGroup',
          name: 'ScoopRYM',
          url: 'https://www.scooprym.app',
        },
      },
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="flex flex-col">
        <HeroSection />

        {/* Music Generator Section */}
        <MusicGeneratorSection />

        {/* Gallery Section with potential initial modal */}
        <GallerySection songs={serializedSongs} initialSelectedSong={sharedSong} />

        <Features3Section />

        <PricingSection />

        <FaqSection />
      </div>
    </>
  );
}
