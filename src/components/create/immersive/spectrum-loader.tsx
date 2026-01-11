'use client';

import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { useEffect, useRef, useState } from 'react';

export function SpectrumLoader({ className }: { className?: string }) {
  // We'll create a dynamic, randomized spectrum effect
  const [bars, setBars] = useState<number[]>(new Array(20).fill(10));
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  useEffect(() => {
    // ONLY animate during generation (when isPlaying is false but it's mounted in the loading overlay)
    // Actually, following the 'No animation during playback' rule strictly:
    if (isPlaying) {
      setBars(new Array(20).fill(10));
      return;
    }

    // Simulate generation activity
    const interval = setInterval(() => {
      setBars((prev) => prev.map(() => Math.random() * 80 + 20));
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={cn('relative flex items-center gap-1 h-12', className)}>
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1 bg-indigo-500/40 rounded-full transition-all duration-150"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
