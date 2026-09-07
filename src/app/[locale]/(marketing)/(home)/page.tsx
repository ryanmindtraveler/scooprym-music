import { BiggestDrops } from '@/components/blocks/daily/biggest-drops';
import { DailyFaqSection } from '@/components/blocks/daily/daily-faq';
import { DailyHome } from '@/components/blocks/daily/daily-home';
import { SectionWaveDivider } from '@/components/blocks/daily/section-wave-frame';
import { VoteSubmitSection } from '@/components/blocks/daily/vote-submit';
import GallerySection from '@/components/blocks/gallery/gallery';
import HeroSection from '@/components/blocks/hero/hero';
import { JsonLd } from '@/components/seo/json-ld';
import { getDb } from '@/db';
import { songPlay, songReaction, song as songTable, story as storyTable, user } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { routing } from '@/i18n/routing';
import { constructMetadata } from '@/lib/seo/metadata';
import { getBusinessDayStart } from '@/lib/shared/business-time';
import { isMissingPublishFlagError } from '@/lib/songs/song-publish';
import { type SongReactionType, isSongReactionType } from '@/lib/songs/song-reactions';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { getCanonicalBaseUrl, getUrlWithLocale } from '@/lib/urls/urls';
import type { Song } from '@/types/song';
import { and, count, desc, eq, gte, inArray, notInArray, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

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
  const { locale } = params;
  const tHome = await getTranslations({ locale, namespace: 'HomePage' });

  const db = await getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const failedStatuses: string[] = [
    'failed_generation',
    'processing_queue_failed',
    'failed_audio_upload',
    'failed_internal_error',
    'failed_credit_deduction',
  ];

  // Find songs where userId is in the list of admin users
  // "The gallery must show admin role user's songs automatically"
  let adminSongRows: Array<{
    song: typeof songTable.$inferSelect;
    story: typeof storyTable.$inferSelect;
    prompt: string | null;
    processingStatus: string | null;
  }> = [];
  try {
    adminSongRows = await db
      .select({
        song: songTable,
        story: storyTable,
        prompt: latestAttempt.prompt,
        processingStatus: latestAttempt.processingStatus,
      })
      .from(songTable)
      .innerJoin(user, eq(songTable.userId, user.id))
      .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(
          eq(user.role, 'admin'),
          eq(songTable.isPublished, true),
          notInArray(latestAttempt.processingStatus, failedStatuses)
        )
      )
      .orderBy(desc(sql`coalesce(${songTable.publishedAt}, ${songTable.updatedAt}, ${songTable.createdAt})`))
      .limit(100);
  } catch (error) {
    if (!isMissingPublishFlagError(error)) {
      throw error;
    }

    console.warn('[marketing/home] is_published column missing, fallback query enabled');
    adminSongRows = await db
      .select({
        song: songTable,
        story: storyTable,
        prompt: latestAttempt.prompt,
        processingStatus: latestAttempt.processingStatus,
      })
      .from(songTable)
      .innerJoin(user, eq(songTable.userId, user.id))
      .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(user.role, 'admin'), notInArray(latestAttempt.processingStatus, failedStatuses)))
      .orderBy(desc(songTable.createdAt))
      .limit(100);
  }
  const adminSongs = adminSongRows.map((row) => ({
    ...row.song,
    prompt: row.prompt,
    processingStatus: row.processingStatus,
    sourceUrl: row.story.sourceUrl,
    sourceText: row.story.sourceText,
    newsSummary: row.story.newsSummary,
  }));

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const songIds = adminSongs.map((song) => song.id);
  const [weeklyPlayRows, reactionRows] =
    adminSongs.length > 0
      ? await Promise.all([
          db
            .select({
              songId: songPlay.songId,
              count: count(),
            })
            .from(songPlay)
            .where(and(inArray(songPlay.songId, songIds), gte(songPlay.createdAt, weekStart)))
            .groupBy(songPlay.songId),
          db
            .select({
              songId: songReaction.songId,
              reactionType: songReaction.reactionType,
              count: count(),
            })
            .from(songReaction)
            .where(inArray(songReaction.songId, songIds))
            .groupBy(songReaction.songId, songReaction.reactionType),
        ])
      : [[], []];

  const weeklyPlaysBySong = new Map(weeklyPlayRows.map((row) => [row.songId, Number(row.count) || 0]));

  const topReactionBySong = new Map<string, { type: SongReactionType; count: number }>();
  for (const row of reactionRows) {
    if (!isSongReactionType(row.reactionType)) continue;
    const reactionCount = Number(row.count) || 0;
    const current = topReactionBySong.get(row.songId);
    if (!current || reactionCount > current.count) {
      topReactionBySong.set(row.songId, { type: row.reactionType, count: reactionCount });
    }
  }

  const serializedSongs = adminSongs.map((song) => ({
    ...song,
    createdAt: song.createdAt ? song.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: song.updatedAt ? song.updatedAt.toISOString() : new Date().toISOString(),
    weeklyPlays: weeklyPlaysBySong.get(song.id) || 0,
    topReaction: topReactionBySong.get(song.id) || null,
  })) as unknown as Song[];

  // Today 区按正式发布时间排序，并保证同一 Story 只出现一个歌曲版本。
  const uniqueStorySongs = serializedSongs.filter((song, index, songs) => {
    const storyKey = song.storyId || song.id;
    return songs.findIndex((candidate) => (candidate.storyId || candidate.id) === storyKey) === index;
  });
  const businessDayStart = getBusinessDayStart(now);
  const freshTodaySongs = uniqueStorySongs.filter((song) => {
    const publishedAt = song.publishedAt ? new Date(song.publishedAt) : null;
    return Boolean(publishedAt && publishedAt >= businessDayStart);
  });
  const freshSongIds = new Set(freshTodaySongs.map((song) => song.id));
  const dailySongs = [...freshTodaySongs, ...uniqueStorySongs.filter((song) => !freshSongIds.has(song.id))].slice(0, 4);
  const freshnessLabel =
    freshTodaySongs.length >= 4
      ? 'Fresh Today'
      : freshTodaySongs.length > 0
        ? `${Math.min(freshTodaySongs.length, 4)} New Today`
        : 'Latest Drops';

  // Prepare Structured Data (JSON-LD) for the Gallery
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${tHome('title')} ${tHome('gallery.title')}`,
    description: tHome('gallery.descriptionLong'),
    numberOfItems: serializedSongs.length,
    itemListElement: serializedSongs.map((song, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MusicRecording',
        name: song.title,
        image: song.coverImageUrl || undefined,
        datePublished: song.createdAt,
        url: getUrlWithLocale(`/songs/${getSongCanonicalSlug(song)}`, routing.defaultLocale),
        byArtist: {
          '@type': 'MusicGroup',
          name: 'ScoopRYM',
          url: getCanonicalBaseUrl(),
        },
      },
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="flex flex-col">
        <HeroSection featuredSong={serializedSongs[0]} songs={serializedSongs} />
        <SectionWaveDivider from="hero" to="today" />
        <DailyHome songs={dailySongs} freshnessLabel={freshnessLabel} />
        <SectionWaveDivider from="today" to="biggest" />
        <BiggestDrops songs={serializedSongs} />
        <SectionWaveDivider from="biggest" to="paper" />
        <VoteSubmitSection mode="vote" />
        <SectionWaveDivider from="paper" to="gallery" />
        <GallerySection songs={serializedSongs} />
        <SectionWaveDivider from="gallery" to="submit" />
        <VoteSubmitSection mode="submit" />
        <SectionWaveDivider from="submit" to="paper" />
        <DailyFaqSection />
      </div>
    </>
  );
}
