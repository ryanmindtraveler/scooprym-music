'use client';

import { submitStoryAction } from '@/actions/story-submissions/submit-story';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  Clock3,
  Crown,
  Flame,
  Link2,
  Loader2,
  MessageSquareText,
  Newspaper,
  PencilLine,
  Radio,
  Send,
  Sparkles,
  TrendingUp,
  Trophy,
  Vote,
  Zap,
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

const categoryConfigs: Record<string, { label: string; emoji: string; badgeClass: string }> = {
  celebrity_drama: {
    label: 'Celebrity Drama',
    emoji: '🍿',
    badgeClass:
      'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
  },
  internet_chaos: {
    label: 'Internet Chaos',
    emoji: '🤡',
    badgeClass:
      'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  },
  absurd_headlines: {
    label: 'WTF Headline',
    emoji: '💀',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
  },
};

function formatResetCountdown(resetsAt: string | null, now: number) {
  if (!resetsAt) return 'at midnight PT';
  const remainingSeconds = Math.max(0, Math.floor((new Date(resetsAt).getTime() - now) / 1_000));
  const hours = Math.floor(remainingSeconds / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
      toast.success('Vote locked in! Daily chart updated.');

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
        toast.info(`You have ${maxSelections} votes! Deselect one to swap.`);
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
        'relative z-20 px-4 py-20 sm:py-24 md:px-8 md:py-28 2xl:px-12',
        mode === 'vote'
          ? 'overflow-hidden bg-[#faf8f4] text-[#1a1523] dark:bg-[#0e0c15] dark:text-[#fffdf8]'
          : 'overflow-hidden bg-[linear-gradient(90deg,#ee7752,#e73c7e,#23a6d5,#23d5ab)] text-[#fffdf8]'
      )}
    >
      <div className="relative mx-auto max-w-[1760px]">
        {/* Section Header */}
        <div className="flex flex-col gap-3 pb-8 md:flex-row md:items-end md:justify-between md:pb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1523] bg-[#ffe600] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#1a1523] shadow-[3px_3px_0_#1a1523] dark:border-white/20 dark:shadow-[3px_3px_0_rgba(255,255,255,0.2)]">
              <Flame className="size-4 fill-current text-[#d80d63]" />
              Viral Drama & Gossip Ballot
            </div>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl text-[#1a1523] dark:text-white">
              {mode === 'vote' ? 'The Hot Sheet' : 'Send us the chaos.'}
            </h2>
            <p
              className={cn(
                'mt-2.5 max-w-xl text-base sm:text-lg font-medium leading-relaxed',
                mode === 'vote' ? 'text-slate-600 dark:text-slate-300' : 'text-white/95'
              )}
            >
              {mode === 'vote'
                ? 'Vote for the internet’s most unhinged headlines. The #1 top-voted story gets turned into tomorrow’s AI viral banger!'
                : 'Send a wild report or unhinged clip that the ScoopRYM desk should turn into a Drop.'}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Vote Desk Section */}
          <section
            aria-labelledby="next-drop-heading"
            className={cn(
              'relative overflow-hidden rounded-[2.5rem] border-3 border-[#1a1523] bg-white p-1 shadow-[8px_10px_0_#1a1523] dark:border-white/20 dark:bg-[#151320] dark:shadow-[8px_10px_0_rgba(255,255,255,0.12)]',
              mode !== 'vote' && 'hidden'
            )}
          >
            <AnimatePresence>
              {showStamp && (
                <motion.div
                  className="pointer-events-none absolute right-8 top-8 z-40 rotate-[-8deg] rounded-2xl border-3 border-[#17151f] bg-[#ffe600] px-6 py-2.5 text-sm font-black tracking-widest text-[#17151f] shadow-[6px_6px_0_#17151f]"
                  initial={{ opacity: 0, scale: 0.6, rotate: -18 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.05, 1, 0.92], rotate: [-18, -8, -8, -8] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.85, times: [0, 0.2, 0.75, 1], ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden="true"
                >
                  🔥 VOTES LOCKED IN!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inner Header Bar: Viral Meme Arena Style */}
            <div className="rounded-t-[2.2rem] border-b-3 border-[#1a1523] bg-linear-to-r from-[#ff007a]/15 via-[#ffe600]/20 to-[#00e5ff]/15 px-6 py-5 sm:px-8 sm:py-6 dark:border-white/15 dark:from-[#ff007a]/25 dark:via-[#ffe600]/10 dark:to-[#00e5ff]/15">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#d80d63] dark:text-pink-400">
                    <Radio className="size-4 animate-pulse text-[#d80d63]" />
                    Live Community Incubator
                  </div>
                  <h3
                    id="next-drop-heading"
                    className="mt-1 text-2xl font-black leading-tight tracking-tight sm:text-3xl text-[#1a1523] dark:text-white"
                  >
                    Which story deserves the next AI banger?
                  </h3>
                </div>

                {/* Countdown & Pick limits */}
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border-2 border-[#1a1523] bg-white px-4 py-2 text-xs font-bold text-[#1a1523] shadow-[3px_3px_0_#1a1523] backdrop-blur-md dark:border-white/20 dark:bg-zinc-900 dark:text-white dark:shadow-[3px_3px_0_rgba(255,255,255,0.15)]">
                    <p className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400">
                      Daily Limit: {maxSelections} Picks
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 font-black text-[#d80d63] dark:text-pink-400">
                      <Clock3 className="size-3.5" />
                      Ballot Resets in {formatResetCountdown(resetsAt, clock)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidates 2-Column Grid */}
            <div className="grid divide-y-2 divide-[#1a1523]/10 lg:grid-cols-2 lg:divide-y-0 lg:divide-x-2 dark:divide-white/10">
              {isLoading &&
                Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`trending-story-skeleton-${index}`}
                    className="flex min-h-[120px] animate-pulse items-center gap-4.5 border-b-2 border-[#1a1523]/10 p-5 dark:border-white/10"
                    aria-hidden="true"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    <div className="h-20 w-28 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-4 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
                      <div className="h-5 w-5/6 rounded-md bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}

              {!isLoading && candidates.length === 0 && (
                <div className="px-6 py-20 text-center lg:col-span-2">
                  <Sparkles className="mx-auto mb-3 size-10 text-[#ff007a]" />
                  <p className="text-xl font-black text-[#1a1523] dark:text-white">Fresh tea is brewing...</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Check back shortly when the next internet drama explodes.
                  </p>
                </div>
              )}

              {!isLoading &&
                rankedCandidates.map((candidate, index) => {
                  const isSavedVote = votes.includes(candidate.id);
                  const isDraftVote = draftVotes.includes(candidate.id);
                  const showResults = votes.length > 0 && !isEditingVote;
                  const categoryInfo = categoryConfigs[candidate.category] || {
                    label: 'Hot Gossip',
                    emoji: '🍉',
                    badgeClass:
                      'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/70 dark:text-pink-300 dark:border-pink-800',
                  };

                  return (
                    <article
                      key={candidate.id}
                      className={cn(
                        'group/row relative min-w-0 border-b-2 border-[#1a1523]/10 transition-all duration-200 dark:border-white/10',
                        isDraftVote &&
                          isEditingVote &&
                          'bg-linear-to-r from-pink-500/10 via-amber-500/10 to-transparent dark:from-pink-950/40 dark:via-amber-950/20',
                        isSavedVote && showResults && 'bg-amber-500/10 dark:bg-amber-950/30'
                      )}
                    >
                      {/* Results Heat Progress Bar */}
                      {showResults && (
                        <motion.div
                          className={cn(
                            'pointer-events-none absolute inset-x-0 bottom-0 h-1.5 origin-left bg-linear-to-r from-[#ffe600] via-[#ff007a] to-[#d80d63]',
                            isSavedVote && 'from-[#00e5ff] to-[#ffe600]'
                          )}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: candidate.voteShare / 100 }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: 'easeOut' }}
                          aria-hidden="true"
                        />
                      )}

                      <div className="relative flex min-h-[125px] items-stretch">
                        <button
                          type="button"
                          onClick={() => toggleDraftVote(candidate.id)}
                          disabled={!isEditingVote || savingVote}
                          aria-pressed={isDraftVote}
                          className={cn(
                            'flex min-w-0 flex-1 items-center gap-3.5 p-4 sm:gap-4.5 sm:p-5.5 text-left transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#d80d63]',
                            isEditingVote && 'cursor-pointer hover:bg-[#ffe600]/10 dark:hover:bg-white/5'
                          )}
                        >
                          {/* Rank Badge Column */}
                          <div className="flex flex-col items-center justify-center shrink-0 w-11 sm:w-12">
                            <span
                              className={cn(
                                'flex size-10 sm:size-11 items-center justify-center rounded-xl border-2 font-mono text-base sm:text-lg font-black leading-none transition-transform group-hover/row:scale-105 select-none',
                                index === 0 &&
                                  'border-[#1a1523] bg-linear-to-br from-[#ffe600] to-amber-400 text-[#1a1523] shadow-[2.5px_2.5px_0_#1a1523]',
                                index === 1 &&
                                  'border-[#1a1523] bg-linear-to-br from-[#ff007a] to-rose-500 text-white shadow-[2.5px_2.5px_0_#1a1523]',
                                index === 2 &&
                                  'border-[#1a1523] bg-linear-to-br from-[#00e5ff] to-cyan-500 text-[#1a1523] shadow-[2.5px_2.5px_0_#1a1523]',
                                index > 2 &&
                                  'border-slate-200/80 bg-slate-100/90 text-slate-500 dark:border-white/10 dark:bg-zinc-800/90 dark:text-slate-400 group-hover/row:border-[#d80d63] group-hover/row:text-[#d80d63]'
                              )}
                            >
                              {String(index + 1).padStart(2, '0')}
                            </span>

                            {/* Checkbox Icon */}
                            <span
                              className={cn(
                                'mt-2 flex size-5.5 items-center justify-center rounded-full border-2 transition-all',
                                isDraftVote
                                  ? 'border-[#1a1523] bg-[#d80d63] text-white shadow-[1.5px_1.5px_0_#1a1523] scale-110 dark:border-white'
                                  : 'border-slate-300 bg-white text-transparent dark:border-slate-700 dark:bg-zinc-800'
                              )}
                            >
                              <Check className="size-3 stroke-3" />
                            </span>
                          </div>

                          {/* Story Thumbnail */}
                          <div className="relative aspect-16/11 w-22 sm:w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-[#1a1523]/15 bg-slate-100 shadow-sm dark:border-white/15 dark:bg-zinc-800">
                            {candidate.sourceImageUrl ? (
                              <img
                                src={candidate.sourceImageUrl}
                                alt=""
                                className="size-full object-cover transition-transform duration-500 group-hover/row:scale-108 motion-reduce:transition-none"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-linear-to-br from-pink-100 via-amber-100 to-rose-200 text-[#d80d63] dark:from-pink-950/40 dark:to-rose-900/30">
                                <Newspaper className="size-7 opacity-80" />
                              </div>
                            )}
                          </div>

                          {/* News Headline & Gossip Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px]',
                                  categoryInfo.badgeClass
                                )}
                              >
                                <span>{categoryInfo.emoji}</span>
                                <span>{categoryInfo.label}</span>
                              </span>
                              {isSavedVote && showResults && (
                                <span className="rounded-md border border-[#1a1523] bg-[#ffe600] px-1.5 py-0.5 text-[10px] font-black text-[#1a1523] shadow-[1.5px_1.5px_0_#1a1523]">
                                  🔥 YOUR PICK
                                </span>
                              )}
                            </div>

                            <h4 className="mt-1.5 line-clamp-2 text-sm sm:text-base font-black leading-snug tracking-tight text-[#1a1523] transition-colors group-hover/row:text-[#d80d63] dark:text-slate-100">
                              {candidate.sourceTitle}
                            </h4>

                            {showResults && (
                              <div className="mt-2.5 flex items-center gap-3">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#d80d63]/10 px-2.5 py-0.5 text-xs font-black text-[#d80d63] dark:bg-pink-950/60 dark:text-pink-300">
                                  <Flame className="size-3 fill-current" />
                                  {candidate.voteShare}% Heat
                                </span>
                                <span className="text-xs font-extrabold text-slate-400">
                                  {candidate.voteCount} {candidate.voteCount === 1 ? 'vote' : 'votes'}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Open Source Button */}
                        {candidate.sourceUrl && (
                          <a
                            href={candidate.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Read original story on ${candidate.sourceDomain}`}
                            className="flex w-11 shrink-0 items-center justify-center border-l-2 border-[#1a1523]/10 text-slate-400 transition-colors hover:bg-[#ffe600]/20 hover:text-[#d80d63] dark:border-white/10 dark:text-slate-500 dark:hover:bg-white/5"
                          >
                            <ArrowUpRight className="size-4.5" />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
            </div>

            {/* Bottom Voting Launchpad Toolbar */}
            {!isLoading && candidates.length > 0 && (
              <div className="flex flex-col gap-4 rounded-b-[2.2rem] border-t-3 border-[#1a1523] bg-linear-to-r from-slate-50 via-pink-50/40 to-amber-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:border-white/15 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">
                <div className="flex flex-wrap items-center gap-3 text-sm font-black text-[#1a1523] dark:text-white">
                  {votes.length > 0 && !isEditingVote ? (
                    <div className="flex items-center gap-2">
                      <Trophy className="size-5 text-amber-500" />
                      <span>{totalVotes} community votes cast today. Ranked live by activity!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <div className="flex gap-1">
                        {Array.from({ length: maxSelections }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'flex size-6 items-center justify-center rounded-full border-2 text-xs transition-transform',
                              i < draftVotes.length
                                ? 'border-[#1a1523] bg-[#ffe600] scale-110 shadow-[1.5px_1.5px_0_#1a1523]'
                                : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-zinc-800 opacity-60'
                            )}
                          >
                            {i < draftVotes.length ? '🍉' : '⚪'}
                          </span>
                        ))}
                      </div>
                      <span>
                        <strong className="text-[#d80d63] dark:text-pink-400">{draftVotes.length}</strong> of{' '}
                        <strong>{maxSelections}</strong> picks selected
                      </span>
                    </div>
                  )}
                </div>

                {votes.length > 0 && !isEditingVote ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftVotes(votes);
                      setIsEditingVote(true);
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#1a1523] bg-white px-7 text-sm font-black text-[#1a1523] shadow-[3px_3px_0_#1a1523] transition-all hover:-translate-y-0.5 hover:bg-[#ffe600] active:translate-y-0 active:shadow-[1px_1px_0_#1a1523] dark:border-white dark:bg-zinc-800 dark:text-white"
                  >
                    <PencilLine className="size-4 text-[#d80d63]" /> Change Picks
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void submitVote()}
                    disabled={draftVotes.length === 0 || savingVote}
                    className="inline-flex h-12 min-w-48 items-center justify-center gap-2 rounded-full border-2 border-[#1a1523] bg-linear-to-r from-[#ffe600] via-[#ff007a] to-[#d80d63] px-8 text-sm font-black text-white shadow-[4px_4px_0_#1a1523] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#1a1523] active:translate-y-0 active:shadow-[2px_2px_0_#1a1523] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none"
                  >
                    {savingVote ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Zap className="size-5 fill-current text-[#ffe600]" />
                    )}
                    {votes.length > 0 ? 'Update' : 'Drop Beats on These'} ({draftVotes.length})
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Submit Story Desk Section */}
          <section
            aria-labelledby="send-story-heading"
            className={cn(
              'relative overflow-hidden rounded-[2.5rem] border-3 border-[#1a1523] bg-white p-7 text-[#1a1523] shadow-[8px_10px_0_#1a1523] md:p-10 dark:border-white/20 dark:bg-[#151320] dark:text-white',
              mode !== 'submit' && 'hidden'
            )}
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(520px,1.22fr)] lg:items-center lg:gap-12">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl border-2 border-[#1a1523] bg-[#ffe600] text-[#1a1523] shadow-[3px_3px_0_#1a1523]">
                    <Send className="size-6" />
                  </span>
                  <span className="rounded-full border border-[#1a1523] bg-[#1a1523] px-3.5 py-1 text-xs font-black uppercase tracking-widest text-[#ffe600]">
                    Public Tip Line
                  </span>
                </div>

                <h3
                  id="send-story-heading"
                  className="mt-5 text-3xl font-black leading-tight tracking-tight md:text-[2.35rem]"
                >
                  Caught something unhinged on the timeline?
                </h3>
                <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  Drop a link or tell us the quick, messy version. Our AI music producers will turn the juiciest gossip
                  into a full viral song!
                </p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-black uppercase tracking-[0.13em] text-[#d80d63]">
                  <span>🍉 Link or Description</span>
                  <span>⚡ 280 Characters</span>
                  <span>🔥 5 Tips a Day</span>
                </div>
              </div>

              <form
                onSubmit={submitStory}
                className="rounded-2xl border-2 border-[#1a1523] bg-[#faf8f4] p-5 shadow-[5px_5px_0_#1a1523] sm:p-6 dark:border-white/20 dark:bg-zinc-900"
              >
                <div className="grid gap-4.5">
                  <label className="grid gap-2 text-sm font-black" htmlFor="story-tip-url">
                    <span>
                      Original Story Link <span className="font-semibold text-slate-400">(optional)</span>
                    </span>
                    <span className="relative block">
                      <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#d80d63]" />
                      <input
                        id="story-tip-url"
                        type="url"
                        maxLength={2048}
                        value={storyUrl}
                        onChange={(event) => setStoryUrl(event.target.value)}
                        placeholder="https://tiktok.com/@... or news link"
                        className="h-12 w-full rounded-xl border-2 border-[#1a1523]/20 bg-white pl-11 pr-4 text-sm font-bold outline-none transition focus:border-[#d80d63] focus:ring-3 focus:ring-[#d80d63]/12 dark:bg-zinc-800 dark:border-white/20"
                      />
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm font-black" htmlFor="story-tip-note">
                    <span>
                      What happened & why should it be a song?{' '}
                      <span className="font-semibold text-slate-400">(optional)</span>
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
                        placeholder="Give the studio the messy details..."
                        className="min-h-24 w-full resize-none rounded-xl border-2 border-[#1a1523]/20 bg-white py-3.5 pl-11 pr-4 text-sm font-bold leading-6 outline-none transition focus:border-[#d80d63] focus:ring-3 focus:ring-[#d80d63]/12 dark:bg-zinc-800 dark:border-white/20"
                      />
                    </span>
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-bold tabular-nums text-slate-400">
                      {storyNote.length}/280 characters
                    </span>
                    <button
                      type="submit"
                      disabled={submittingStory || (storyUrl.trim().length === 0 && storyNote.trim().length < 10)}
                      className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-full border-2 border-[#1a1523] bg-[#ffe600] px-6 text-sm font-black text-[#1a1523] shadow-[3px_3px_0_#1a1523] transition-all hover:-translate-y-0.5 hover:bg-[#ff007a] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {submittingStory ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      {submittingStory ? 'Sending tip' : 'Send to Producers'}
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
