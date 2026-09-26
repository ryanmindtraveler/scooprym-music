import { BiggestDrops } from '@/components/blocks/daily/biggest-drops';
import { DailyFaqSection } from '@/components/blocks/daily/daily-faq';
import { DailyHome } from '@/components/blocks/daily/daily-home';
import { SectionWaveDivider } from '@/components/blocks/daily/section-wave-frame';
import { VoteSubmitSection } from '@/components/blocks/daily/vote-submit';
import GallerySection from '@/components/blocks/gallery/gallery';
import HeroSection from '@/components/blocks/hero/hero';
import { getDb } from '@/db';
import { songReaction } from '@/db/schema';
import { constructMetadata } from '@/lib/seo/metadata';
import { getBusinessDayStart } from '@/lib/shared/business-time';
import { getAllTimeChartCandidates, getHomeChartCandidates, getHomeGalleryPage } from '@/lib/songs/home-gallery';
import { type SongReactionType, isSongReactionType } from '@/lib/songs/song-reactions';
import type { Song } from '@/types/song';
import { count, inArray } from 'drizzle-orm';
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
    keywords: [
      'daily funny songs',
      'funny songs from viral moments',
      'comedy rap songs',
      'headline songs',
      'celebrity gossip songs',
      'musical satire',
    ],
    includeDefaultKeywords: false,
    locale,
    pathname: '',
  });
}

export default async function HomePage() {
  const db = await getDb();
  // 首页只传 Gallery 第一页的 20 首卡片数据；累计播放榜与播放队列使用精简字段。
  const [galleryPage, chartCandidates, allTimeChartSongs] = await Promise.all([
    getHomeGalleryPage(1),
    getHomeChartCandidates(),
    getAllTimeChartCandidates(),
  ]);

  const now = new Date();
  const songIds = chartCandidates.map((song) => song.id);
  const reactionRows =
    chartCandidates.length > 0
      ? await db
          .select({
            songId: songReaction.songId,
            reactionType: songReaction.reactionType,
            count: count(),
          })
          .from(songReaction)
          .where(inArray(songReaction.songId, songIds))
          .groupBy(songReaction.songId, songReaction.reactionType)
      : [];

  const topReactionBySong = new Map<string, { type: SongReactionType; count: number }>();
  for (const row of reactionRows) {
    if (!isSongReactionType(row.reactionType)) continue;
    const reactionCount = Number(row.count) || 0;
    const current = topReactionBySong.get(row.songId);
    if (!current || reactionCount > current.count) {
      topReactionBySong.set(row.songId, { type: row.reactionType, count: reactionCount });
    }
  }

  const serializedSongs = chartCandidates.map((song) => ({
    ...song,
    topReaction: topReactionBySong.get(song.id) || null,
  })) as Song[];

  // Today 区按正式发布时间排序，并保证同一 Story 只出现一个歌曲版本。
  const uniqueStorySongs = serializedSongs.filter((song, index, songs) => {
    const storyKey = song.storyId || song.id;
    return songs.findIndex((candidate) => (candidate.storyId || candidate.id) === storyKey) === index;
  });
  const businessDayStart = getBusinessDayStart(now);
  const freshTodaySongs = uniqueStorySongs.filter((song) => {
    const publishedAt = song.publishedAt ? new Date(song.publishedAt) : null;
    return Boolean(publishedAt && publishedAt >= businessDayStart && publishedAt <= now);
  });
  const freshSongIds = new Set(freshTodaySongs.map((song) => song.id));
  const detailedSongsById = new Map(galleryPage.songs.map((song) => [song.id, song]));
  const dailySongs = [...freshTodaySongs, ...uniqueStorySongs.filter((song) => !freshSongIds.has(song.id))]
    .slice(0, 4)
    .map((song) => ({ ...song, ...detailedSongsById.get(song.id) }));
  const freshnessLabel =
    freshTodaySongs.length >= 4
      ? 'Fresh Today'
      : freshTodaySongs.length > 0
        ? `${Math.min(freshTodaySongs.length, 4)} New Today`
        : 'Latest Drops';

  return (
    <>
      <div className="flex flex-col">
        <HeroSection featuredSong={galleryPage.songs[0]} songs={serializedSongs} />
        <SectionWaveDivider from="hero" to="today" />
        <DailyHome songs={dailySongs} freshnessLabel={freshnessLabel} hasNewToday={freshTodaySongs.length > 0} />
        <SectionWaveDivider from="today" to="biggest" />
        <BiggestDrops songs={allTimeChartSongs} />
        <SectionWaveDivider from="biggest" to="paper" />
        <VoteSubmitSection mode="vote" />
        <SectionWaveDivider from="paper" to="gallery" />
        <GallerySection songs={galleryPage.songs} total={galleryPage.total} />
        <SectionWaveDivider from="gallery" to="submit" />
        <VoteSubmitSection mode="submit" />
        <SectionWaveDivider from="submit" to="paper" />
        <DailyFaqSection />
      </div>
    </>
  );
}
