'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

export function SpectrumLoader({ className }: { className?: string }) {
  // We'll create a dynamic, randomized spectrum effect
  const [bars, setBars] = useState<number[]>(new Array(20).fill(10));

  useEffect(() => {
    // Animate bars randomly to simulate audio analysis
    const interval = setInterval(() => {
      setBars((prev) => prev.map(() => Math.random() * 80 + 20));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('relative flex items-center justify-center p-8', className)}>
      {/* 1. The Core (Pulsing Brain) - REMOVED per user request to reduce obstruction */}
      {/* <div className="absolute z-20 flex flex-col items-center justify-center"> ... </div> */}

      {/* 2. Holographic Spectrum - REMOVED per user request */}
      {/* <div className="relative size-64 flex items-center justify-center"> ... </div> */}

      <style jsx>{`
        @keyframes ping-slow {
            75%, 100% {
                transform: scale(1.5);
                opacity: 0;
            }
        }
        .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-pulse-slow {
             animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slower {
            animation: spin 8s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
