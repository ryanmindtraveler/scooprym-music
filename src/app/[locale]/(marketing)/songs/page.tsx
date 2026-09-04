import { getDb } from '@/db';
import { songReaction, song as songTable, story as storyTable, user } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { constructMetadata } from '@/lib/metadata';
import { isMissingPublishFlagError } from '@/lib/song-publish';
import { type SongReactionType, isSongReactionType } from '@/lib/song-reactions';
import type { Song } from '@/types/song';
import { and, count, desc, eq, inArray, ne, notInArray } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SongsClientWrapper } from './songs-client-wrapper';

interface SongsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: SongsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SongsPage' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    keywords: [
      'daily meme songs',
      'headline songs',
      'news satire songs',
      'celebrity gossip songs',
      'internet drama songs',
      'meme song',
      'viral song',
    ],
    locale,
    pathname: '/songs',
  });
}

export default async function SongsPage({ params }: SongsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SongsPage' });
  const db = await getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);

  const failedStatuses = [
    'failed_generation',
    'processing_queue_failed',
    'failed_audio_upload',
    'failed_internal_error',
    'failed_credit_deduction',
  ];
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
          ne(songTable.audioUrl, 'pending-stream'),
          ne(songTable.audioUrl, ''),
          notInArray(latestAttempt.processingStatus, failedStatuses)
        )
      )
      .orderBy(desc(songTable.createdAt))
      .limit(50);
  } catch (error) {
    if (!isMissingPublishFlagError(error)) throw error;

    console.warn('[marketing/songs] is_published column missing, fallback query enabled');
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
          ne(songTable.audioUrl, 'pending-stream'),
          ne(songTable.audioUrl, ''),
          notInArray(latestAttempt.processingStatus, failedStatuses)
        )
      )
      .orderBy(desc(songTable.createdAt))
      .limit(50);
  }

  const adminSongs = adminSongRows.map((row) => ({
    ...row.song,
    prompt: row.prompt,
    processingStatus: row.processingStatus,
    sourceUrl: row.story.sourceUrl,
    sourceText: row.story.sourceText,
    newsSummary: row.story.newsSummary,
  }));
  const reactionRows =
    adminSongs.length > 0
      ? await db
          .select({
            songId: songReaction.songId,
            reactionType: songReaction.reactionType,
            count: count(),
          })
          .from(songReaction)
          .where(
            inArray(
              songReaction.songId,
              adminSongs.map((song) => song.id)
            )
          )
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

  const serializedSongs = adminSongs.map((song) => ({
    ...song,
    createdAt: song.createdAt ? song.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: song.updatedAt ? song.updatedAt.toISOString() : new Date().toISOString(),
    topReaction: topReactionBySong.get(song.id) || null,
  })) as unknown as Song[];

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 pt-28 pb-24 text-[#17151f] md:px-6 md:pt-36 2xl:px-8">
      <div className="mx-auto w-full max-w-[1760px]">
        <header className="mb-10 max-w-3xl border-b border-[#17151f]/15 pb-8">
          <h1 className="text-4xl font-bold leading-[0.98] tracking-[-0.055em] md:text-6xl">
            {t('heroTitleLeading')} <span className="text-[#b90851]">{t('heroTitleHighlight')}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-slate-600 md:text-lg">
            {t('heroDescription')}
          </p>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-[#b90851]">
            {serializedSongs.length} reported stories, newest first
          </p>
        </header>

        <SongsClientWrapper songs={serializedSongs} />
      </div>
    </main>
  );
}
