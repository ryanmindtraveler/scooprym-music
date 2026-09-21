import { BreadcrumbJsonLd, JsonLd } from '@/components/seo/json-ld';
import type { SongCommentItem } from '@/components/songs/song-comments';
import { getDb } from '@/db';
import { songComment, songFavorite, song as songTable, story as storyTable, user } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { routing } from '@/i18n/routing';
import { getSession } from '@/lib/auth/server';
import { constructMetadata } from '@/lib/seo/metadata';
import { selectRelatedSongs } from '@/lib/songs/related-songs';
import {
  decodeSongSlug,
  getSongCanonicalSlug,
  getSongPublicDate,
  getSongSearchHeadline,
  getSongSeoDescription,
  getSongSeoTitle,
  getSongStoryContext,
} from '@/lib/songs/song-seo';
import { getSourceUrl } from '@/lib/urls/source-url';
import { getCanonicalBaseUrl, getUrlWithLocale } from '@/lib/urls/urls';
import { getIdFromSlug } from '@/lib/utils';
import type { Song } from '@/types/song';
import { and, count, desc, eq, inArray, ne, notInArray } from 'drizzle-orm';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import Link from 'next/link';
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
  const slug = decodeSongSlug(resolvedParams.slug);
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

  // 在响应头发送前处理旧 slug，保证搜索引擎收到真实的永久跳转。
  if (slug !== canonicalSlug) {
    permanentRedirect(new URL(getUrlWithLocale(`/songs/${canonicalSlug}`, routing.defaultLocale)).href);
  }

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
  const slug = decodeSongSlug(resolvedParams.slug);
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
  const canonicalUrl = new URL(getUrlWithLocale(`/songs/${canonicalSlug}`, routing.defaultLocale)).href;
  if (slug !== canonicalSlug) {
    permanentRedirect(canonicalUrl);
  }

  const session = await getSession();
  const userId = session?.user?.id;

  const isAdmin = session?.user?.role === 'admin';
  const [favoriteRows, commentCountRows, commentRows, relatedRows] = await Promise.all([
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
    // 仅同一新闻下已公开、已完成且有音频的作品；每次请求读取发布状态。
    db
      .select({ id: songTable.id, title: songTable.title })
      .from(songTable)
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(
          eq(songTable.storyId, song.storyId),
          ne(songTable.id, id),
          eq(songTable.isPublished, true),
          inArray(latestAttempt.processingStatus, ['completed', 'completed_without_cover']),
          ne(songTable.audioUrl, ''),
          ne(songTable.audioUrl, 'pending-stream')
        )
      )
      .orderBy(desc(songTable.publishedAt), desc(songTable.createdAt), desc(songTable.id)),
  ]);
  const relatedSongs = selectRelatedSongs(song, relatedRows);
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
  const publicDate = getSongPublicDate(serializableSong).toISOString();

  const musicRecordingSchema: WithContext<MusicRecording> = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: serializableSong.title,
    headline: searchHeadline,
    description: seoDescription,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    datePublished: publicDate,
    dateModified: publicDate,
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
    isBasedOn: getSourceUrl(song.sourceUrl),
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
    { name: 'Gallery', item: getUrlWithLocale('/songs', routing.defaultLocale) },
    { name: searchHeadline, item: canonicalUrl },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-black">
      <JsonLd data={musicRecordingSchema} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <nav aria-label="Song archive" className="px-6 pt-24 text-center">
        <Link href="/songs" className="font-semibold underline underline-offset-4">
          Browse all published songs
        </Link>
      </nav>
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
      {relatedSongs.length > 0 && (
        <section aria-labelledby="related-songs-heading" className="mx-auto max-w-5xl px-6 py-12">
          <h2 id="related-songs-heading" className="text-2xl font-bold">
            More songs from this story
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {relatedSongs.map((related) => (
              <li key={related.id}>
                <Link
                  href={`/songs/${getSongCanonicalSlug({ ...related, newsSummary: song.newsSummary, sourceText: null })}`}
                  prefetch={false}
                  className="block rounded-xl border border-slate-200 p-5 font-semibold underline underline-offset-4 hover:border-pink-500 dark:border-zinc-700"
                >
                  {related.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
