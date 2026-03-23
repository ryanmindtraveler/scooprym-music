import { BreadcrumbJsonLd, JsonLd } from '@/components/seo/json-ld';
import { getDb } from '@/db';
import { songFavorite, song as songTable } from '@/db/schema';
import { constructMetadata } from '@/lib/metadata';
import { getCanonicalBaseUrl, getUrlWithLocale } from '@/lib/urls/urls';
import { getSession } from '@/lib/server';
import { getIdFromSlug, slugify } from '@/lib/utils';
import type { Song } from '@/types/song';
import { and, eq, isNull, notInArray, or } from 'drizzle-orm';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import type { MusicRecording, WithContext } from 'schema-dts';
import { SongDetailClient } from './song-detail-client';

interface SongDetailPageProps {
  params: Promise<{
    slug: string;
    locale: Locale;
  }>;
}

export async function generateMetadata({ params }: SongDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug, locale } = resolvedParams;
  const id = getIdFromSlug(slug);
  const t = await getTranslations({ locale, namespace: 'NotFoundPage' });

  const db = await getDb();

  const [song] = await db
    .select()
    .from(songTable)
    .where(
      and(
        eq(songTable.id, id),
        or(
          isNull(songTable.processingStatus),
          notInArray(songTable.processingStatus, [
            'failed_generation',
            'processing_queue_failed',
            'failed_audio_upload',
            'failed_credit_deduction',
          ])
        )
      )
    )
    .limit(1);

  if (!song) {
    return constructMetadata({
      title: t('title'),
      description: t('message'),
      locale,
    });
  }

  const titleSlug = slugify(song.title || 'song');
  const canonicalSlug = `${titleSlug}-${song.id}`;

  const backgroundContent = song.newsSummary || song.sourceText || song.lyrics || '';
  const cleanContent = backgroundContent
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const rawDescription = cleanContent
    ? `Listen to "${song.title}": ${cleanContent}`.slice(0, 160)
    : `Listen to ${song.title}, an AI-generated track by ScoopRYM.`;

  const description = rawDescription.length > 160 ? `${rawDescription.slice(0, 157)}...` : rawDescription;

  return constructMetadata({
    title: `${song.title} | ScoopRYM AI Meme Song`,
    description,
    image: song.coverImageUrl || undefined,
    locale,
    pathname: `/songs/${canonicalSlug}`,
    keywords: [song.title, 'AI Song', 'Meme Song', 'Funny Song', 'Viral Song', 'Diss Track', 'Battle Song', 'Rap Battle'],
  });
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const resolvedParams = await params;
  const { slug, locale } = resolvedParams;
  const id = getIdFromSlug(slug);

  const db = await getDb();
  const session = await getSession();
  const userId = session?.user?.id;

  const [song] = await db
    .select()
    .from(songTable)
    .where(
      and(
        eq(songTable.id, id),
        or(
          isNull(songTable.processingStatus),
          notInArray(songTable.processingStatus, [
            'failed_generation',
            'processing_queue_failed',
            'failed_audio_upload',
            'failed_credit_deduction',
          ])
        )
      )
    )
    .limit(1);

  if (!song) {
    notFound();
  }

  let isFavorite = false;
  if (userId) {
    const [fav] = await db
      .select()
      .from(songFavorite)
      .where(and(eq(songFavorite.songId, id), eq(songFavorite.userId, userId)));
    isFavorite = !!fav;
  }

  const serializableSong: Song = {
    ...song,
    createdAt: song.createdAt ? new Date(song.createdAt) : new Date(),
    updatedAt: song.updatedAt ? new Date(song.updatedAt) : new Date(),
    durationSec: song.durationSec || 0,
    plays: song.plays || 0,
  };

  const titleSlug = slugify(song.title || 'song');
  const canonicalSlug = `${titleSlug}-${song.id}`;

  if (slug !== canonicalSlug) {
    permanentRedirect(getUrlWithLocale(`/songs/${canonicalSlug}`, locale));
  }

  const musicRecordingSchema: WithContext<MusicRecording> = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: serializableSong.title,
    url: getUrlWithLocale(`/songs/${canonicalSlug}`, resolvedParams.locale),
    datePublished: serializableSong.createdAt ? new Date(serializableSong.createdAt).toISOString() : undefined,
    duration: song.durationSec ? `PT${song.durationSec}S` : undefined,
    image: song.coverImageUrl || undefined,
    byArtist: {
      '@type': 'MusicGroup',
      name: 'ScoopRYM',
      url: getCanonicalBaseUrl(),
    },
    inAlbum: {
      '@type': 'MusicAlbum',
      name: 'ScoopRYM Viral Hits',
    },
  };

  const breadcrumbs = [
    { name: locale === 'zh' ? '首页' : 'Home', item: getUrlWithLocale('/', resolvedParams.locale) },
    { name: locale === 'zh' ? '画廊' : 'Gallery', item: `${getUrlWithLocale('/', resolvedParams.locale)}#gallery` },
    { name: serializableSong.title, item: getUrlWithLocale(`/songs/${canonicalSlug}`, resolvedParams.locale) },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-black">
      <JsonLd data={musicRecordingSchema} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SongDetailClient song={serializableSong} initialIsFavorite={isFavorite} autoPlay={true} />
    </div>
  );
}
