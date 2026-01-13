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
        'w-full h-[68px] relative overflow-hidden rounded-2xl bg-zinc-900 border border-indigo-500/30 flex items-center px-6 shadow-xl shadow-indigo-500/20',
        className
      )}
    >
      {/* Background Progress Bar */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 transition-all duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />

      <div className="relative z-10 w-full flex items-center justify-between gap-4">
        {/* Status Text & Spinner */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-sm rounded-full opacity-50 animate-pulse" />
            <Loader2 className="relative size-5 text-indigo-300 animate-spin" />
          </div>

          <div className="flex flex-col">
            <span className="text-white font-bold text-sm tracking-wide">
              {phase === 'initializing' && 'Connecting to Studio...'}
              {phase === 'composing' && 'Composing Melody...'}
              {phase === 'synthesizing' && 'Synthesizing Vocals...'}
              {phase === 'finalizing' && 'Mastering Audio...'}
            </span>
            <span className="text-indigo-300/70 text-[10px] font-mono">{percent.toFixed(0)}% Completed</span>
          </div>
        </div>

        {/* Steps Visualizer */}
        <div className="hidden sm:flex items-center gap-1">
          {steps.map((step, idx) => {
            const isCurrent = step.id === phase;
            const isPast = steps.findIndex((s) => s.id === phase) > idx;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center size-8 rounded-full border transition-all duration-500',
                    isPast
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : isCurrent
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 scale-110 shadow-lg shadow-indigo-500/25'
                        : 'bg-white/5 border-white/10 text-white/20'
                  )}
                >
                  <step.icon className="size-3.5" />
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-3 h-0.5 mx-1 rounded-full transition-colors duration-500',
                      isPast ? 'bg-indigo-500' : 'bg-white/10'
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
