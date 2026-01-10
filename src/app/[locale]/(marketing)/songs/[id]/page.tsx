import { getDb } from '@/db';
import { song as songTable, songFavorite } from '@/db/schema';
import { constructMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/server';
import { and, eq, isNull, notInArray, or } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { Song } from '@/types/song';
import type { Locale } from 'next-intl';

interface SongDetailPageProps {
  params: Promise<{
    id: string;
    locale: Locale;
  }>;
}

export async function generateMetadata({ params }: SongDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { id, locale } = resolvedParams;
  const db = await getDb();

  const [song] = await db
    .select()
    .from(songTable)
    .where(
      and(
        eq(songTable.id, id),
        or(
          isNull(songTable.processingStatus),
          notInArray(songTable.processingStatus, ['failed_generation', 'processing_queue_failed', 'failed_audio_upload', 'failed_credit_deduction'])
        )
      )
    )
    .limit(1);

  if (!song) {
    return constructMetadata({
      title: 'Song Not Found',
      locale,
    });
  }

  return constructMetadata({
    title: `${song.title} | ScoopRYM Music`,
    description: song.newsSummary || song.sourceText || `Listen to ${song.title} by ScoopRYM AI.`,
    image: song.coverImageUrl || undefined,
    locale,
    pathname: `/songs/${id}`,
  });
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const resolvedParams = await params;
  const { id, locale } = resolvedParams;

  // Permanent redirect to the homepage with the song ID query parameter
  // This preserves the "modal over homepage" experience for shared links
  redirect(`/${locale}?s=${id}`);
}
