import { RecentListeningPagination } from '@/components/dashboard/recent-listening-pagination';
import { getDb } from '@/db';
import { song, storyCandidate, storyCandidateVote } from '@/db/schema';
import { LocaleLink } from '@/i18n/navigation';
import { getSession } from '@/lib/auth/server';
import { formatBusinessDate } from '@/lib/shared/business-time';
import { slugify } from '@/lib/utils';
import { Routes } from '@/routes';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { ArrowUpRight, CheckCircle2, ExternalLink, Radio, Vote } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

const VOTE_PAGE_LIMIT = 10;

const categoryLabels: Record<string, string> = {
  celebrity_drama: 'Celebrity drama',
  internet_chaos: 'Internet chaos',
  absurd_headlines: 'Wild headline',
};

function getOutcome(status: string, hasPublishedSong: boolean) {
  if (hasPublishedSong) return { label: 'Now a song', className: 'bg-emerald-100 text-emerald-800' };
  if (status === 'adopted') return { label: 'In production', className: 'bg-violet-100 text-violet-800' };
  if (status === 'shortlisted') return { label: 'On the shortlist', className: 'bg-amber-100 text-amber-900' };
  if (status === 'dismissed') return { label: 'Not selected', className: 'bg-slate-100 text-slate-600' };
  return { label: 'Still trending', className: 'bg-cyan-100 text-cyan-800' };
}

export default async function DashboardVotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations('Dashboard.activity');
  const session = await getSession();
  const userId = session?.user?.id;
  const rawPage = (await searchParams).page;
  const parsedPage = Number.parseInt(Array.isArray(rawPage) ? rawPage[0] || '1' : rawPage || '1', 10);
  const requestedPage = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  let voteCount = 0;
  let currentPage = requestedPage;
  let totalPages = 1;
  let votes: Array<{
    id: string;
    voteDay: string;
    createdAt: Date;
    candidateId: string;
    title: string;
    sourceUrl: string;
    sourceDomain: string;
    category: string;
    status: string;
    storyId: string | null;
    songId?: string;
    songTitle?: string;
  }> = [];

  if (userId) {
    const db = await getDb();
    const [countRow] = await db
      .select({ count: count() })
      .from(storyCandidateVote)
      .where(eq(storyCandidateVote.userId, userId));

    voteCount = Number(countRow?.count || 0);
    totalPages = Math.max(1, Math.ceil(voteCount / VOTE_PAGE_LIMIT));
    currentPage = Math.min(requestedPage, totalPages);

    const voteRows = await db
      .select({
        id: storyCandidateVote.id,
        voteDay: storyCandidateVote.voteDay,
        createdAt: storyCandidateVote.createdAt,
        candidateId: storyCandidate.id,
        title: storyCandidate.sourceTitle,
        sourceUrl: storyCandidate.sourceUrl,
        sourceDomain: storyCandidate.sourceDomain,
        category: storyCandidate.category,
        status: storyCandidate.status,
        storyId: storyCandidate.storyId,
      })
      .from(storyCandidateVote)
      .innerJoin(storyCandidate, eq(storyCandidate.id, storyCandidateVote.candidateId))
      .where(eq(storyCandidateVote.userId, userId))
      .orderBy(desc(storyCandidateVote.voteDay), desc(storyCandidateVote.createdAt))
      .limit(VOTE_PAGE_LIMIT)
      .offset((currentPage - 1) * VOTE_PAGE_LIMIT);

    const storyIds = voteRows.flatMap((row) => (row.storyId ? [row.storyId] : []));
    const publishedSongs =
      storyIds.length > 0
        ? await db
            .select({ id: song.id, storyId: song.storyId, title: song.title })
            .from(song)
            .where(and(inArray(song.storyId, storyIds), eq(song.isPublished, true)))
            .orderBy(desc(song.publishedAt), desc(song.createdAt))
        : [];
    const songByStory = new Map<string, { id: string; title: string }>();
    for (const publishedSong of publishedSongs) {
      if (!songByStory.has(publishedSong.storyId)) {
        songByStory.set(publishedSong.storyId, { id: publishedSong.id, title: publishedSong.title });
      }
    }

    votes = voteRows.map((row) => {
      const publishedSong = row.storyId ? songByStory.get(row.storyId) : undefined;
      return { ...row, songId: publishedSong?.id, songTitle: publishedSong?.title };
    });
  }

  return (
    <main className="min-h-full px-4 py-6 md:px-8 md:py-10 xl:px-12">
      <div className="mx-auto w-full max-w-[1560px]">
        <section aria-labelledby="my-votes-title">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-900/10 pb-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-violet-700">{t('yourPicks')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 id="my-votes-title" className="text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
                  {t('myVotes')}
                </h1>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1.5 text-xs font-black text-violet-900 shadow-sm">
                  <Vote className="size-3.5 text-violet-600" />
                  {voteCount} {voteCount === 1 ? t('pick') : t('picks')}
                </span>
              </div>
            </div>
            <span className="hidden text-sm font-semibold text-slate-500 sm:block">{t('newestPicks')}</span>
          </div>

          {votes.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 text-center shadow-sm backdrop-blur-lg">
              <div className="flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <Radio className="size-7" />
              </div>
              <h2 className="mt-5 text-xl font-black text-slate-900">{t('noPicks')}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{t('voteHint')}</p>
              <LocaleLink
                href="/#vote"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                {t('seeTrending')} <ArrowUpRight className="size-4" />
              </LocaleLink>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/78 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.5)] backdrop-blur-xl">
              <ol className="divide-y divide-slate-200/75">
                {votes.map((vote, index) => {
                  const outcome = getOutcome(vote.status, Boolean(vote.songId));
                  return (
                    <li
                      key={vote.id}
                      className="grid gap-4 px-5 py-5 transition-colors hover:bg-violet-50/35 md:grid-cols-[44px_minmax(0,1fr)_180px] md:items-center"
                    >
                      <span className="hidden font-mono text-xs font-black text-pink-500 md:block">
                        {String((currentPage - 1) * VOTE_PAGE_LIMIT + index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                          <span className="text-pink-700">{categoryLabels[vote.category] || 'Trending story'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">
                            Picked{' '}
                            {formatBusinessDate(vote.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h2 className="text-[15px] font-bold leading-6 text-slate-950">{vote.title}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
                          <Link
                            href={vote.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-pink-700"
                          >
                            {vote.sourceDomain} <ExternalLink className="size-3" />
                          </Link>
                          {vote.songId && vote.songTitle ? (
                            <LocaleLink
                              href={`/songs/${slugify(vote.songTitle)}-${vote.songId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
                            >
                              <CheckCircle2 className="size-3.5" /> Hear the song
                            </LocaleLink>
                          ) : null}
                        </div>
                      </div>
                      <div className="md:text-right">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${outcome.className}`}
                        >
                          {outcome.label}
                        </span>
                        <p className="mt-1.5 text-[11px] font-semibold text-slate-400">Ballot {vote.voteDay}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <RecentListeningPagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={Routes.DashboardVotes}
            ariaLabel={t('myVotes')}
          />
        </section>
      </div>
    </main>
  );
}
