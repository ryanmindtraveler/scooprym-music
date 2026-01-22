'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Music2, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type ProgressPhase = 'initializing' | 'composing' | 'synthesizing' | 'finalizing' | 'completed';

interface GenerationProgressProps {
  className?: string;
}

export function GenerationProgress({ className }: GenerationProgressProps) {
  const [phase, setPhase] = useState<ProgressPhase>('initializing');
  const [percent, setPercent] = useState(0);

  // Simulated Progress Logic (tuned to average ~25-30s total)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Phase 1: Initializing (0-5%) - Fast
    if (phase === 'initializing') {
      const timer = setTimeout(() => {
        setPhase('composing');
        setPercent(5);
      }, 800);
      return () => clearTimeout(timer);
    }

    // Phase 2: Composing (5-30%) - 5 seconds
    if (phase === 'composing') {
      let p = 5;
      interval = setInterval(() => {
        p += 1; // +1% every 200ms -> 5% per sec -> 5 secs for 25%
        if (p >= 30) {
          setPhase('synthesizing');
          clearInterval(interval);
        }
        setPercent(Math.min(p, 99));
      }, 200);
    }

    // Phase 3: Synthesizing (30-85%) - 15 seconds (Bulk of time)
    if (phase === 'synthesizing') {
      let p = 30;
      interval = setInterval(() => {
        p += 0.5; // +0.5% every 136ms -> ~3.6% per sec -> 15 secs for 55%
        if (p >= 85) {
          setPhase('finalizing');
          clearInterval(interval);
        }
        setPercent(Math.min(p, 99));
      }, 136);
    }

    // Phase 4: Finalizing (85-95%) - Slow crawl until done
    if (phase === 'finalizing') {
      let p = 85;
      interval = setInterval(() => {
        p += 0.2;
        // Cap at 98% until parent says done (which unmounts this component or resets)
        if (p >= 98) {
          clearInterval(interval);
        }
        setPercent(Math.min(p, 98));
      }, 200);
    }

    return () => clearInterval(interval);
  }, [phase]);

  const steps = [
    { id: 'composing', label: 'Composing Melody', icon: Music2 },
    { id: 'synthesizing', label: 'Synthesizing Vocals', icon: Wand2 },
    { id: 'finalizing', label: 'Mastering Audio', icon: CheckCircle2 },
  ];

  return (
    <div
      className={cn(
        'w-full h-[68px] relative overflow-hidden rounded-2xl border flex items-center px-6 shadow-xl transition-all duration-300',
        // Base Look (Empty Part)
        'bg-slate-100 dark:bg-zinc-900/50 border-slate-200 dark:border-white/10',
        className
      )}
    >
      {/* Background Progress Bar (Filling with Magic) */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-violet-600 via-fuchsia-400 to-indigo-600 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(139,92,246,0.5)]"
        style={{ width: `${Math.max(percent, 5)}%` }} // Always show a little bit so it looks active
      />

      {/* Shimmer Overlay on the Filled Part */}
      <div className="absolute inset-0 w-full h-full opacity-30">
        <div className="absolute top-0 -left-full w-1/2 h-full bg-linear-to-r from-transparent via-white to-transparent animate-shimmer-fast" />
      </div>

      <div className="relative z-10 w-full flex items-center justify-between gap-4">
        {/* Status Text & Spinner */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-white blur-md rounded-full opacity-30 animate-pulse" />
            {/* White Spinner for contrast against the Gradient */}
            <Loader2 className="relative size-5 text-white animate-spin drop-shadow-md" />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-white font-black text-sm tracking-wide drop-shadow-sm flex items-center gap-2">
              {phase === 'initializing' && 'Connecting...'}
              {phase === 'composing' && 'Composing Melody...'}
              {phase === 'synthesizing' && 'Synthesizing Vocals...'}
              {phase === 'finalizing' && 'Mastering Audio...'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-[10px] font-mono font-bold">{percent.toFixed(0)}%</span>
              {/* Tiny progress line for precision */}
              <div className="w-12 h-1 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/50" style={{ width: `${percent % 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Steps Visualizer (Simplified Glassmorphism) */}
        <div className="hidden sm:flex items-center gap-1.5 p-1.5 rounded-full bg-black/10 backdrop-blur-sm border border-white/10">
          {steps.map((step, idx) => {
            const isCurrent = step.id === phase;
            const isPast = steps.findIndex((s) => s.id === phase) > idx;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center size-7 rounded-full border transition-all duration-500',
                    isPast
                      ? 'bg-white text-indigo-600 border-white shadow-sm'
                      : isCurrent
                        ? 'bg-white/90 border-white text-indigo-600 scale-110 shadow-lg'
                        : 'bg-transparent border-white/20 text-white/40' // On colored bg, needs to be white-ish
                  )}
                >
                  <step.icon className="size-3.5" />
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-2 h-0.5 mx-1 rounded-full transition-colors duration-500',
                      isPast ? 'bg-white/80' : 'bg-white/10'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Add shimmer animation to tailwind later if needed, or rely on existing globals
