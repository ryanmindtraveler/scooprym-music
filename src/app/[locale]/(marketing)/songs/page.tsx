import { getDb } from '@/db';
import { songReaction, song as songTable, story as storyTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { constructMetadata } from '@/lib/seo/metadata';
import { SONG_ARCHIVE_PAGE_SIZE, getArchivePagePath, parseArchivePage } from '@/lib/songs/archive-pagination';
import { type SongReactionType, isSongReactionType } from '@/lib/songs/song-reactions';
import type { Song } from '@/types/song';
import { and, count, desc, eq, inArray, ne, notInArray, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { SongsClientWrapper } from './songs-client-wrapper';

interface SongsPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: SongsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SongsPage' });

  const page = parseArchivePage((await searchParams).page);
  if (page === null) notFound();
  return constructMetadata({
    title: page === 1 ? 'Funny Songs Archive' : `Funny Songs Archive — Page ${page}`,
    description: t('description'),
    keywords: [
      'funny songs archive',
      'daily funny songs',
      'comedy rap songs',
      'headline songs',
      'news satire songs',
      'celebrity gossip songs',
      'internet drama songs',
      'viral song',
    ],
    includeDefaultKeywords: false,
    locale,
    pathname: getArchivePagePath(page),
  });
}

export default async function SongsPage({ params, searchParams }: SongsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SongsPage' });
  const rawPage = (await searchParams).page;
  const page = parseArchivePage(rawPage);
  if (page === null) notFound();
  if (rawPage === '1') permanentRedirect('/songs');
  const db = await getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);

  const failedStatuses = [
    'failed_generation',
    'processing_queue_failed',
    'failed_audio_upload',
    'failed_internal_error',
    'failed_credit_deduction',
  ];
  let publishedSongRows: Array<{
    song: typeof songTable.$inferSelect;
    story: typeof storyTable.$inferSelect;
    prompt: string | null;
    processingStatus: string | null;
  }> = [];

  // 计数与分页读取使用完全相同的公开条件，绝不纳入未发布歌曲。
  const [{ total }] = await db
    .select({ total: count() })
    .from(songTable)
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        eq(songTable.isPublished, true),
        ne(songTable.audioUrl, 'pending-stream'),
        ne(songTable.audioUrl, ''),
        notInArray(latestAttempt.processingStatus, failedStatuses)
      )
    );
  const totalPages = Math.max(1, Math.ceil(total / SONG_ARCHIVE_PAGE_SIZE));
  if (page > totalPages) notFound();

  publishedSongRows = await db
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
        eq(songTable.isPublished, true),
        ne(songTable.audioUrl, 'pending-stream'),
        ne(songTable.audioUrl, ''),
        notInArray(latestAttempt.processingStatus, failedStatuses)
      )
    )
    // 与首页 Gallery 一致：按发布/创建时间排序，维护旧数据不影响新旧顺序。
    .orderBy(desc(sql`coalesce(${songTable.publishedAt}, ${songTable.createdAt})`), desc(songTable.id))
    .limit(SONG_ARCHIVE_PAGE_SIZE)
    .offset((page - 1) * SONG_ARCHIVE_PAGE_SIZE);

  const publishedSongs = publishedSongRows.map((row) => ({
    ...row.song,
    prompt: row.prompt,
    processingStatus: row.processingStatus,
    sourceUrl: row.story.sourceUrl,
    sourceText: row.story.sourceText,
    newsSummary: row.story.newsSummary,
  }));
  const reactionRows =
    publishedSongs.length > 0
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
              publishedSongs.map((song) => song.id)
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

  const serializedSongs = publishedSongs.map((song) => ({
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
            {total} published songs, newest first · Page {page} of {totalPages}
          </p>
        </header>

        <SongsClientWrapper songs={serializedSongs} />
        {totalPages > 1 && (
          <nav aria-label="Song archive pages" className="mt-12 flex flex-wrap justify-center gap-3">
            {page > 1 && (
              <Link prefetch={false} href={getArchivePagePath(page - 1)} className="rounded-lg border px-4 py-3">
                Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 2)
              .map((number) => (
                <Link
                  key={number}
                  prefetch={false}
                  href={getArchivePagePath(number)}
                  aria-current={number === page ? 'page' : undefined}
                  className={`rounded-lg border px-4 py-3 ${number === page ? 'bg-[#17151f] text-white' : ''}`}
                >
                  {number}
                </Link>
              ))}
            {page < totalPages && (
              <Link prefetch={false} href={getArchivePagePath(page + 1)} className="rounded-lg border px-4 py-3">
                Next
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
