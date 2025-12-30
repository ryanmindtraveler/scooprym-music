'use client';

import { cn } from '@/lib/utils';

export function VinylLoader({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Vinyl Record */}
      <div className="relative size-48 rounded-full shadow-2xl animate-spin-slow">
        {/* Outer Rim (Black Vinyl) */}
        <div
          className="absolute inset-0 rounded-full bg-zinc-900"
          style={{
            background: 'conic-gradient(from 0deg, #18181b 0%, #27272a 50%, #18181b 100%)',
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.1), 0 10px 40px -10px rgba(0,0,0,0.5)',
          }}
        />

        {/* Grooves (Visual Texture) */}
        <div
          className="absolute inset-2 rounded-full border-2 border-zinc-800/50 opacity-50"
          style={{
            backgroundImage: 'repeating-radial-gradient(#27272a 0, #27272a 1px, transparent 2px, transparent 4px)',
          }}
        />

        {/* Center Label (Branding) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-16 rounded-full bg-indigo-500 flex items-center justify-center border-4 border-zinc-950 shadow-inner">
          <div className="size-2 bg-black rounded-full" />
          <div className="absolute inset-0 rounded-full opacity-30 bg-linear-to-tr from-transparent to-white/40" />
        </div>

        {/* Shine Reflection (Static) */}
        <div className="absolute inset-0 rounded-full bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
