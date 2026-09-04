'use client';

import { submitStoryAction } from '@/actions/story-submissions/submit-story';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  Clock3,
  Flame,
  Link2,
  Loader2,
  MessageSquareText,
  Newspaper,
  PencilLine,
  Send,
  Vote,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface TrendingCandidate {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  sourceImageUrl: string | null;
  category: string;
  relevanceScore: number;
  publishedAt: string | null;
  voteCount: number;
  todayVoteCount: number;
  weightedScore: number;
  voteShare: number;
}

const categoryLabels: Record<string, string> = {
  celebrity_drama: 'Celebrity drama',
  internet_chaos: 'Internet chaos',
  absurd_headlines: 'Wild headline',
};

function formatStoryAge(publishedAt: string | null) {
  if (!publishedAt) return 'Fresh now';
  const elapsedHours = Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 3_600_000));
  if (elapsedHours < 1) return 'Just in';
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
}

function formatResetCountdown(resetsAt: string | null, now: number) {
  if (!resetsAt) return 'at midnight PT';
  const remainingSeconds = Math.max(0, Math.floor((new Date(resetsAt).getTime() - now) / 1_000));
  const hours = Math.floor(remainingSeconds / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;
  return `in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface VoteSubmitSectionProps {
  mode: 'vote' | 'submit';
}

export function VoteSubmitSection({ mode }: VoteSubmitSectionProps) {
  const [votes, setVotes] = useState<string[]>([]);
  const [draftVotes, setDraftVotes] = useState<string[]>([]);
  const [maxSelections, setMaxSelections] = useState(3);
  const [isEditingVote, setIsEditingVote] = useState(true);
  const [candidates, setCandidates] = useState<TrendingCandidate[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [resetsAt, setResetsAt] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(mode === 'vote');
  const [savingVote, setSavingVote] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [storyUrl, setStoryUrl] = useState('');
  const [storyNote, setStoryNote] = useState('');
  const [submittingStory, setSubmittingStory] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const stampTimer = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (mode === 'vote') {
      void fetch('/api/story-votes', { cache: 'no-store' })
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load stories');
          setCandidates(payload.data.candidates);
          const selectedCandidateIds = payload.data.selectedCandidateIds || [];
          setVotes(selectedCandidateIds);
          setDraftVotes(selectedCandidateIds);
          setMaxSelections(payload.data.maxSelections || 3);
          setIsEditingVote(selectedCandidateIds.length === 0);
          setIsAuthenticated(payload.data.authenticated);
          setResetsAt(payload.data.resetsAt);
        })
        .catch(() => toast.error('Trending stories could not be loaded.'))
        .finally(() => setIsLoading(false));
    }

    return () => {
      if (stampTimer.current) window.clearTimeout(stampTimer.current);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'vote') return;
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [mode]);

  const submitVote = async () => {
    if (draftVotes.length === 0) return;
    if (!isAuthenticated) {
      toast.info('Sign in to vote on trending stories.');
      const callbackUrl = `${window.location.pathname}${window.location.search}#vote`;
      window.location.assign(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setSavingVote(true);
    try {
      const response = await fetch('/api/story-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: draftVotes }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to save vote');

      setVotes(payload.data.selectedCandidateIds);
      setDraftVotes(payload.data.selectedCandidateIds);
      setMaxSelections(payload.data.maxSelections || 3);
      setIsEditingVote(false);
      setCandidates(payload.data.candidates);
      setResetsAt(payload.data.resetsAt);
      toast.success('Vote saved. You can change it anytime today.');

      if (!prefersReducedMotion) {
        setShowStamp(true);
        if (stampTimer.current) window.clearTimeout(stampTimer.current);
        stampTimer.current = window.setTimeout(() => setShowStamp(false), 850);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save your vote.');
    } finally {
      setSavingVote(false);
    }
  };

  const toggleDraftVote = (candidateId: string) => {
    if (!isEditingVote || savingVote) return;
    setDraftVotes((currentVotes) => {
      if (currentVotes.includes(candidateId)) {
        return currentVotes.filter((currentVote) => currentVote !== candidateId);
      }
      if (currentVotes.length >= maxSelections) {
        toast.info(`Choose up to ${maxSelections} stories.`);
        return currentVotes;
      }
      return [...currentVotes, candidateId];
    });
  };

  const rankedCandidates =
    votes.length > 0 && !isEditingVote
      ? [...candidates].sort(
          (left, right) =>
            right.weightedScore - left.weightedScore ||
            right.voteCount - left.voteCount ||
            right.relevanceScore - left.relevanceScore
        )
      : candidates;

  const totalVotes = candidates.reduce((total, candidate) => total + candidate.voteCount, 0);

  const submitStory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingStory) return;

    setSubmittingStory(true);
    setSubmissionMessage(null);
    try {
      const result = await submitStoryAction({ sourceUrl: storyUrl, note: storyNote });
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'The tip could not be sent.');
      }

      setSubmissionMessage(result.data.message || 'Tip received.');
      setStoryUrl('');
      setStoryNote('');
      toast.success(result.data.message || 'Tip received.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The tip could not be sent.');
    } finally {
      setSubmittingStory(false);
    }
  };

  return (
    <section
      id={mode === 'vote' ? 'vote' : 'desk'}
      className={cn(
        'relative z-20 px-4 py-20 md:px-6 md:py-24 2xl:px-8',
        mode === 'vote'
          ? 'overflow-hidden bg-[#fffdf8] text-[#201a29]'
          : 'overflow-hidden bg-[#ee7752] bg-[linear-gradient(90deg,#ee7752,#e73c7e,#23a6d5,#23d5ab)] text-[#fffdf8]'
      )}
    >
      <div className="relative mx-auto max-w-[1760px]">
        {/* Header */}
        <div className="max-w-2xl pb-8 md:pb-9">
          <h2 className="text-4xl font-black leading-none tracking-tight md:text-5xl">
            {mode === 'vote' ? 'The Hot Sheet' : 'Send us the chaos.'}
          </h2>
          <p
            className={cn(
              'mt-3.5 max-w-xl text-base font-medium leading-relaxed',
              mode === 'vote' ? 'text-slate-600' : 'text-white/95'
            )}
          >
            {mode === 'vote'
              ? 'Vote for the headlines, drama, and internet chaos everyone is talking about.'
              : 'Send a public report the ScoopRYM desk should turn into a Drop.'}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Vote Desk Section */}
          <section
            aria-labelledby="next-drop-heading"
            className={cn(
              'relative overflow-hidden rounded-2xl border border-[#201a29]/15 bg-[#fffdf8] shadow-[0_18px_48px_rgba(32,26,41,0.08)]',
              mode !== 'vote' && 'hidden'
            )}
          >
            <AnimatePresence>
              {showStamp && (
                <motion.div
                  className="pointer-events-none absolute right-7 top-6 z-10 rotate-[-5deg] border-2 border-[#17151f] bg-[#fff258] px-4 py-1.5 text-xs font-black tracking-widest text-[#17151f] shadow-[4px_4px_0_#17151f]"
                  initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 0.94], rotate: [-12, -5, -5, -5] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, times: [0, 0.22, 0.75, 1], ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden="true"
                >
                  LOCKED IN
                </motion.div>
              )}
            </AnimatePresence>
            <div className="border-t-[6px] border-[#201a29] px-5 pb-5 pt-4 md:px-8 md:pb-6 md:pt-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#d80d63]">
                    <Flame className="size-4 fill-[#d80d63]" />
                    ScoopRYM trending desk
                  </div>
                  <h3
                    id="next-drop-heading"
                    className="mt-2 text-3xl font-black leading-[0.98] tracking-[-0.035em] md:text-[2.5rem]"
                  >
                    What deserves the next meme song?
                  </h3>
                </div>

                <div className="shrink-0 border-l-4 border-[#fff258] pl-3 text-xs font-bold leading-relaxed text-slate-600 md:text-right">
                  <p>Choose up to {maxSelections} stories today</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 font-black text-[#201a29]">
                    <Clock3 className="size-3.5 text-[#d80d63]" />
                    New ballot {formatResetCountdown(resetsAt, clock)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid border-t border-[#201a29]/15 lg:grid-cols-2">
              {isLoading &&
                Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`trending-story-skeleton-${index}`}
                    className="flex min-h-32 animate-pulse items-center gap-4 border-b border-[#201a29]/10 p-4 lg:odd:border-r"
                    aria-hidden="true"
                  >
                    <div className="h-20 w-24 rounded-lg bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-3 w-36 rounded bg-slate-200" />
                      <div className="mt-2 h-4 w-4/5 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}

              {!isLoading && candidates.length === 0 && (
                <div className="px-6 py-12 text-center lg:col-span-2">
                  <p className="text-lg font-black text-[#201a29]">Fresh picks are landing soon.</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Check back when the next story starts making noise.
                  </p>
                </div>
              )}

              {!isLoading &&
                rankedCandidates.map((candidate, index) => {
                  const isSavedVote = votes.includes(candidate.id);
                  const isDraftVote = draftVotes.includes(candidate.id);
                  const showResults = votes.length > 0 && !isEditingVote;
                  return (
                    <article
                      key={candidate.id}
                      className={cn(
                        'group relative min-w-0 overflow-hidden border-b border-[#201a29]/10 bg-[#fffdf8] lg:odd:border-r',
                        isSavedVote && showResults && 'bg-[#fffceb]'
                      )}
                    >
                      {showResults && (
                        <motion.div
                          className={cn(
                            'pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left bg-[#d80d63]',
                            isSavedVote && 'bg-[#f2cc00]'
                          )}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: candidate.voteShare / 100 }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
                          aria-hidden="true"
                        />
                      )}

                      <div className="relative flex min-h-32 items-stretch">
                        <button
                          type="button"
                          onClick={() => toggleDraftVote(candidate.id)}
                          disabled={!isEditingVote || savingVote}
                          aria-pressed={isDraftVote}
                          className={cn(
                            'grid min-w-0 flex-1 grid-cols-[4rem_5.5rem_minmax(0,1fr)] items-center gap-3 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b90851] sm:grid-cols-[4.5rem_6.5rem_minmax(0,1fr)] sm:px-4',
                            isEditingVote && 'hover:bg-[#fff258]/18',
                            isDraftVote && isEditingVote && 'bg-[#fff258]/30'
                          )}
                        >
                          <span className="relative flex h-full min-h-20 items-center justify-center border-r border-[#201a29]/12 pr-3">
                            <span
                              className={cn(
                                'font-serif text-[2rem] font-black leading-none tracking-[-0.08em] text-[#201a29]/35 transition-colors sm:text-[2.35rem]',
                                index < 3 && 'text-[#d80d63]',
                                isDraftVote && 'text-[#201a29]'
                              )}
                            >
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span
                              className={cn(
                                'absolute bottom-1 right-2 flex size-5 items-center justify-center rounded-full border-2 border-[#201a29]/25 bg-[#fffdf8] text-transparent transition-all',
                                isDraftVote && 'border-[#201a29] bg-[#201a29] text-white'
                              )}
                            >
                              <Check className="size-3" />
                            </span>
                          </span>

                          <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-[#eaf4f4] shadow-[0_4px_12px_rgba(32,26,41,0.12)]">
                            {candidate.sourceImageUrl ? (
                              <img
                                src={candidate.sourceImageUrl}
                                alt=""
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
                                loading="lazy"
                              />
                            ) : (
                              <span className="flex size-full items-center justify-center text-[#b90851]">
                                <Newspaper className="size-7" />
                              </span>
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.62rem] font-black uppercase tracking-[0.11em] text-slate-500">
                              <span className="text-[#b90851]">
                                {categoryLabels[candidate.category] || 'Trending now'}
                              </span>
                              <span aria-hidden="true">/</span>
                              <span>{formatStoryAge(candidate.publishedAt)}</span>
                              {isSavedVote && showResults && (
                                <span className="bg-[#201a29] px-1.5 py-0.5 text-[0.56rem] text-white">Your pick</span>
                              )}
                            </span>
                            <span className="mt-1.5 line-clamp-2 block text-sm font-black leading-[1.18] text-[#201a29] sm:text-[0.95rem]">
                              {candidate.sourceTitle}
                            </span>
                            {showResults && (
                              <span className="mt-2 flex items-baseline gap-1.5 text-[#201a29]">
                                <span className="text-base font-black tabular-nums">{candidate.voteShare}%</span>
                                <span className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                                  {candidate.voteCount} {candidate.voteCount === 1 ? 'vote' : 'votes'}
                                </span>
                              </span>
                            )}
                          </span>
                        </button>

                        <a
                          href={candidate.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Read original story on ${candidate.sourceDomain}`}
                          className="relative flex w-10 shrink-0 items-center justify-center border-l border-[#201a29]/8 text-slate-400 transition-colors hover:bg-white/70 hover:text-[#b90851]"
                        >
                          <ArrowUpRight className="size-4" />
                        </a>
                      </div>
                    </article>
                  );
                })}
            </div>

            {!isLoading && candidates.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-[#201a29]/15 bg-[#f7f1ea] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
                <p className="text-xs font-bold text-slate-500">
                  {votes.length > 0 && !isEditingVote
                    ? `${totalVotes} votes · Ranked with the last 3 days of activity.`
                    : `${draftVotes.length}/${maxSelections} selected · Choose up to ${maxSelections} stories.`}
                </p>

                {votes.length > 0 && !isEditingVote ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftVotes(votes);
                      setIsEditingVote(true);
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#201a29]/18 bg-white px-5 text-sm font-black text-[#201a29] transition-transform hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <PencilLine className="size-4" /> Change picks
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void submitVote()}
                    disabled={draftVotes.length === 0 || savingVote}
                    className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-full bg-[#201a29] px-6 text-sm font-black text-white shadow-[0_8px_20px_rgba(32,26,41,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#b90851] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    {savingVote ? <Loader2 className="size-4 animate-spin" /> : <Vote className="size-4" />}
                    {votes.length > 0 ? 'Update' : 'Cast'} {draftVotes.length}{' '}
                    {draftVotes.length === 1 ? 'vote' : 'votes'}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Submit Story Desk Section */}
          <section
            aria-labelledby="send-story-heading"
            className={cn(
              'relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 text-[#201a29] shadow-[0_20px_50px_rgba(32,26,41,0.12)] backdrop-blur-2xl md:p-9',
              mode !== 'submit' && 'hidden'
            )}
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(520px,1.22fr)] lg:items-center lg:gap-12">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-full bg-[#fff258] text-[#201a29] shadow-md">
                    <Send className="size-6" />
                  </span>
                  <span className="rounded-full bg-slate-900/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#201a29]">
                    Public Submissions
                  </span>
                </div>

                <h3
                  id="send-story-heading"
                  className="mt-5 text-3xl font-black leading-tight tracking-tight md:text-[2.2rem]"
                >
                  Caught something unhinged?
                </h3>
                <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-slate-700">
                  Share the original link or give us the quick, messy version. One is enough for the editorial desk to
                  start reviewing your tip.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-[0.13em] text-slate-600">
                  <span>Link or description</span>
                  <span>280 characters</span>
                  <span>5 tips a day</span>
                </div>
              </div>

              <form
                onSubmit={submitStory}
                className="rounded-2xl border border-[#201a29]/12 bg-[#fffdf8] p-4 shadow-[6px_7px_0_rgba(32,26,41,0.12)] sm:p-5"
              >
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm font-black" htmlFor="story-tip-url">
                    <span>
                      Original story link <span className="font-semibold text-slate-500">(optional)</span>
                    </span>
                    <span className="relative block">
                      <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#d80d63]" />
                      <input
                        id="story-tip-url"
                        type="url"
                        maxLength={2048}
                        value={storyUrl}
                        onChange={(event) => setStoryUrl(event.target.value)}
                        placeholder="https://news-site.com/the-story"
                        className="h-12 w-full rounded-xl border border-[#201a29]/15 bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#d80d63] focus:ring-3 focus:ring-[#d80d63]/12"
                      />
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm font-black" htmlFor="story-tip-note">
                    <span>
                      What happened — and why does it deserve a song?{' '}
                      <span className="font-semibold text-slate-500">(optional)</span>
                    </span>
                    <span className="relative block">
                      <MessageSquareText className="pointer-events-none absolute left-4 top-4 size-4 text-[#d80d63]" />
                      <textarea
                        id="story-tip-note"
                        minLength={10}
                        maxLength={280}
                        rows={3}
                        value={storyNote}
                        onChange={(event) => setStoryNote(event.target.value)}
                        placeholder="Give the desk the quick, messy version..."
                        className="min-h-24 w-full resize-none rounded-xl border border-[#201a29]/15 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold leading-6 outline-none transition focus:border-[#d80d63] focus:ring-3 focus:ring-[#d80d63]/12"
                      />
                    </span>
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-bold tabular-nums text-slate-500">
                      Add at least one · {storyNote.length}/280
                    </span>
                    <button
                      type="submit"
                      disabled={submittingStory || (storyUrl.trim().length === 0 && storyNote.trim().length < 10)}
                      className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-full bg-[#201a29] px-6 text-sm font-black text-white shadow-[0_8px_20px_rgba(32,26,41,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#d80d63] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {submittingStory ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      {submittingStory ? 'Sending tip' : 'Send to the desk'}
                    </button>
                  </div>

                  {submissionMessage && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#dff8ed] px-4 py-3 text-sm font-bold text-[#176345]">
                      <Check className="size-4 shrink-0" />
                      {submissionMessage}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
