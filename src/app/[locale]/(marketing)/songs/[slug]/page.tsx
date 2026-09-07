import { BreadcrumbJsonLd, JsonLd } from '@/components/seo/json-ld';
import type { SongCommentItem } from '@/components/songs/song-comments';
import { getDb } from '@/db';
import { songComment, songFavorite, song as songTable, story as storyTable, user } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { routing } from '@/i18n/routing';
import { getSession } from '@/lib/auth/server';
import { constructMetadata } from '@/lib/seo/metadata';
import {
  getSongCanonicalSlug,
  getSongSearchHeadline,
  getSongSeoDescription,
  getSongSeoTitle,
  getSongStoryContext,
} from '@/lib/songs/song-seo';
import { getCanonicalBaseUrl, getUrlWithLocale } from '@/lib/urls/urls';
import { getIdFromSlug } from '@/lib/utils';
import type { Song } from '@/types/song';
import { and, count, desc, eq, notInArray } from 'drizzle-orm';
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
  const latestAttempt = createLatestGenerationAttemptQuery(db);

  const [row] = await db
    .select({
      song: songTable,
      story: storyTable,
      prompt: latestAttempt.prompt,
      processingStatus: latestAttempt.processingStatus,
    })
    .from(songTable)
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        eq(songTable.id, id),
        eq(songTable.isPublished, true),
        notInArray(latestAttempt.processingStatus, [
          'failed_generation',
          'processing_queue_failed',
          'failed_audio_upload',
          'failed_credit_deduction',
        ])
      )
    )
    .limit(1);

  if (!row) {
    return constructMetadata({
      title: t('title'),
      description: t('message'),
      locale,
    });
  }
  const song = {
    ...row.song,
    sourceUrl: row.story.sourceUrl,
    sourceText: row.story.sourceText,
    newsSummary: row.story.newsSummary,
    prompt: row.prompt,
    processingStatus: row.processingStatus,
  };

  const canonicalSlug = getSongCanonicalSlug(song);

  return constructMetadata({
    title: getSongSeoTitle(song),
    description: getSongSeoDescription(song),
    image: song.coverImageUrl || undefined,
    locale: routing.defaultLocale,
    pathname: `/songs/${canonicalSlug}`,
    includeDefaultKeywords: false,
    includeLanguageAlternates: false,
  });
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const id = getIdFromSlug(slug);

  const db = await getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);

  const [row] = await db
    .select({
      song: songTable,
      story: storyTable,
      prompt: latestAttempt.prompt,
      processingStatus: latestAttempt.processingStatus,
    })
    .from(songTable)
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        eq(songTable.id, id),
        eq(songTable.isPublished, true),
        notInArray(latestAttempt.processingStatus, [
          'failed_generation',
          'processing_queue_failed',
          'failed_audio_upload',
          'failed_credit_deduction',
        ])
      )
    )
    .limit(1);

  if (!row) {
    notFound();
  }
  const song = {
    ...row.song,
    sourceUrl: row.story.sourceUrl,
    sourceText: row.story.sourceText,
    newsSummary: row.story.newsSummary,
    prompt: row.prompt,
    processingStatus: row.processingStatus,
  };

  const canonicalSlug = getSongCanonicalSlug(song);
  const canonicalUrl = getUrlWithLocale(`/songs/${canonicalSlug}`, routing.defaultLocale);
  if (slug !== canonicalSlug) {
    permanentRedirect(canonicalUrl);
  }

  const session = await getSession();
  const userId = session?.user?.id;

  const isAdmin = session?.user?.role === 'admin';
  const [favoriteRows, commentCountRows, commentRows] = await Promise.all([
    userId
      ? db
          .select({ id: songFavorite.id })
          .from(songFavorite)
          .where(and(eq(songFavorite.songId, id), eq(songFavorite.userId, userId)))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ total: count() })
      .from(songComment)
      .where(and(eq(songComment.songId, id), eq(songComment.status, 'visible'))),
    db
      .select({
        id: songComment.id,
        content: songComment.content,
        createdAt: songComment.createdAt,
        authorId: user.id,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(songComment)
      .innerJoin(user, eq(user.id, songComment.userId))
      .where(and(eq(songComment.songId, id), eq(songComment.status, 'visible')))
      .orderBy(desc(songComment.createdAt))
      .limit(12),
  ]);
  const isFavorite = favoriteRows.length > 0;
  const commentTotal = Number(commentCountRows[0]?.total ?? 0);
  const initialComments: SongCommentItem[] = commentRows.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.authorId,
      name: comment.authorName,
      image: comment.authorImage,
    },
    canDelete: isAdmin || comment.authorId === userId,
  }));

  const serializableSong: Song = {
    ...song,
    createdAt: song.createdAt ? new Date(song.createdAt) : new Date(),
    updatedAt: song.updatedAt ? new Date(song.updatedAt) : new Date(),
    durationSec: song.durationSec || 0,
    plays: song.plays || 0,
  };

  const searchHeadline = getSongSearchHeadline(serializableSong);
  const seoDescription = getSongSeoDescription(serializableSong);

  const musicRecordingSchema: WithContext<MusicRecording> = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: serializableSong.title,
    headline: searchHeadline,
    description: seoDescription,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    datePublished: new Date(serializableSong.publishedAt || serializableSong.createdAt).toISOString(),
    dateModified: new Date(serializableSong.updatedAt || serializableSong.createdAt).toISOString(),
    duration: song.durationSec ? `PT${song.durationSec}S` : undefined,
    image: song.coverImageUrl || undefined,
    audio: song.audioUrl
      ? {
          '@type': 'AudioObject',
          contentUrl: song.audioUrl,
          duration: song.durationSec ? `PT${song.durationSec}S` : undefined,
          encodingFormat: 'audio/mpeg',
        }
      : undefined,
    isBasedOn: song.sourceUrl || undefined,
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
    { name: 'Home', item: getUrlWithLocale('/', routing.defaultLocale) },
    { name: 'Gallery', item: `${getUrlWithLocale('/', routing.defaultLocale)}#gallery` },
    { name: searchHeadline, item: canonicalUrl },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-black">
      <JsonLd data={musicRecordingSchema} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SongDetailClient
        song={serializableSong}
        initialIsFavorite={isFavorite}
        searchHeadline={searchHeadline}
        storyContext={getSongStoryContext(serializableSong)}
        initialComments={{
          comments: initialComments,
          total: commentTotal,
          totalPages: Math.max(1, Math.ceil(commentTotal / 12)),
        }}
        autoPlay={true}
        viewer={
          session?.user
            ? {
                id: session.user.id,
                name: session.user.name || 'ScoopRYM listener',
                image: session.user.image || null,
              }
            : null
        }
      />
    </div>
  );
}
