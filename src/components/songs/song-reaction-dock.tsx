'use client';

import { SONG_REACTION_OPTIONS, type SongReactionCounts, type SongReactionType } from '@/lib/song-reactions';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface SongReactionDockProps {
  songId: string;
  initialCounts: SongReactionCounts;
  initialReaction: SongReactionType | null;
  className?: string;
}

const particleOffsets = [
  { x: -96, y: -48, rotate: -18 },
  { x: -48, y: -88, rotate: 14 },
  { x: 6, y: -96, rotate: -10 },
  { x: 58, y: -82, rotate: 16 },
  { x: 98, y: -42, rotate: -14 },
  { x: -68, y: 32, rotate: 12 },
  { x: 72, y: 30, rotate: -12 },
] as const;

const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function ReactionBurst({ type, eventId }: { type: SongReactionType; eventId: number }) {
  const option = SONG_REACTION_OPTIONS.find((item) => item.type === type)!;

  return (
    <motion.div
      key={`${type}-${eventId}`}
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      aria-hidden="true"
    >
      {particleOffsets.map((offset, index) => (
        <motion.span
          key={`${offset.x}-${offset.y}`}
          className="absolute text-2xl drop-shadow-sm"
          initial={{ opacity: 0, scale: 0.35, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.35, 1, 0.92, 0.72], ...offset }}
          transition={{ duration: 0.78, ease: [0.16, 1, 0.3, 1], delay: index * 0.018 }}
        >
          {option.emoji}
        </motion.span>
      ))}
      <motion.span
        className="relative rotate-[-3deg] rounded-md border-2 border-[#17151f] bg-[#fff258] px-4 py-2 text-center text-sm font-black tracking-[0.03em] text-[#17151f]"
        initial={{ opacity: 0, scale: 0.65, rotate: -8 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.65, 1, 1, 0.94], rotate: [-8, -3, -3, -3] }}
        transition={{ duration: 0.82, times: [0, 0.22, 0.72, 1], ease: [0.16, 1, 0.3, 1] }}
      >
        {option.effectLabel}
      </motion.span>
    </motion.div>
  );
}

export function SongReactionDock({ songId, initialCounts, initialReaction, className }: SongReactionDockProps) {
  const prefersReducedMotion = useReducedMotion();
  const [counts, setCounts] = useState(initialCounts);
  const [selectedReaction, setSelectedReaction] = useState<SongReactionType | null>(initialReaction);
  const [pending, setPending] = useState(false);
  const [effect, setEffect] = useState<{ type: SongReactionType; eventId: number } | null>(null);
  const effectTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (effectTimer.current) window.clearTimeout(effectTimer.current);
    },
    []
  );

  const total = useMemo(() => Object.values(counts).reduce((sum, count) => sum + count, 0), [counts]);

  const react = async (type: SongReactionType) => {
    if (pending) return;

    const previousReaction = selectedReaction;
    const previousCounts = counts;
    const nextReaction = previousReaction === type ? null : type;

    setSelectedReaction(nextReaction);
    setCounts((current) => {
      const next = { ...current };
      if (previousReaction) next[previousReaction] = Math.max(0, next[previousReaction] - 1);
      if (nextReaction) next[nextReaction] += 1;
      return next;
    });

    if (nextReaction && !prefersReducedMotion) {
      const eventId = Date.now();
      setEffect({ type: nextReaction, eventId });
      if (effectTimer.current) window.clearTimeout(effectTimer.current);
      effectTimer.current = window.setTimeout(() => {
        setEffect((current) => (current?.eventId === eventId ? null : current));
      }, 900);
    }

    setPending(true);
    try {
      const response = await fetch(`/api/songs/${songId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: nextReaction }),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to save reaction');
      }

      setCounts(result.data.counts);
      setSelectedReaction(result.data.selectedReaction);
    } catch (error) {
      setCounts(previousCounts);
      setSelectedReaction(previousReaction);
      toast.error(error instanceof Error ? error.message : 'Failed to save reaction');
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      className={cn(
        'relative isolate shrink-0 overflow-hidden rounded-[1.75rem] border border-[#17151f]/14 bg-[#fffdf9] dark:border-white/14 dark:bg-[#1a1821]',
        className
      )}
      aria-labelledby="internet-verdict-heading"
    >
      <div className="flex items-end justify-between gap-4 px-5 pb-4 pt-5 md:px-7 md:pt-6">
        <div className="min-w-0">
          <h2
            id="internet-verdict-heading"
            className="text-2xl font-bold tracking-[-0.04em] text-[#17151f] dark:text-[#fffdf8] md:text-3xl"
          >
            The Internet&apos;s Verdict
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Pick the reaction this story deserves.
          </p>
        </div>
        <p className="shrink-0 pb-1 text-xs font-black tabular-nums text-[#d80d63] dark:text-[#ff76ad]">
          {compactNumber.format(total)} {total === 1 ? 'verdict' : 'verdicts'}
        </p>
      </div>

      <div className="flex snap-x overflow-x-auto border-t border-[#17151f]/12 [scrollbar-width:none] dark:border-white/12 [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-5">
        {SONG_REACTION_OPTIONS.map((option) => {
          const isSelected = selectedReaction === option.type;

          return (
            <motion.button
              key={option.type}
              type="button"
              onClick={() => react(option.type)}
              disabled={pending}
              aria-pressed={isSelected}
              aria-label={`${option.label}, ${counts[option.type]} ${counts[option.type] === 1 ? 'reaction' : 'reactions'}`}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className={cn(
                'relative flex min-w-[136px] snap-start flex-col items-start border-r border-[#17151f]/12 px-4 py-4 text-left transition-[background-color,color,transform] duration-200 last:border-r-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#d80d63] disabled:cursor-wait disabled:opacity-60 dark:border-white/12 md:min-w-0 md:px-5',
                isSelected
                  ? 'bg-[#fff258] text-[#17151f]'
                  : 'bg-transparent text-slate-700 hover:bg-[#ffdce9] dark:text-slate-200 dark:hover:bg-[#30222f]'
              )}
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span className="text-2xl leading-none md:text-3xl" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="text-xs font-black tabular-nums opacity-55">
                  {compactNumber.format(counts[option.type])}
                </span>
              </span>
              <span className="mt-3 block whitespace-nowrap text-xs font-black leading-tight md:text-[13px]">
                {option.label}
              </span>
              {isSelected && <span className="mt-2 text-[10px] font-black uppercase tracking-[0.12em]">Your pick</span>}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>{effect && <ReactionBurst type={effect.type} eventId={effect.eventId} />}</AnimatePresence>
      <p className="sr-only" aria-live="polite">
        {selectedReaction
          ? `${SONG_REACTION_OPTIONS.find((option) => option.type === selectedReaction)?.label} selected.`
          : 'Reaction removed.'}
      </p>
    </section>
  );
}
