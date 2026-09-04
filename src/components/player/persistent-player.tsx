'use client';

import { ShareButton } from '@/components/songs/actions/share-button';
import { Slider } from '@/components/ui/slider';
import { usePlayerStore } from '@/store';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import Image from 'next/image';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export function PersistentPlayer() {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const queueLength = usePlayerStore((state) => state.queue.length);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const stop = usePlayerStore((state) => state.stop);

  if (!currentSong) return null;

  return (
    <aside
      aria-label="Now playing"
      className="fixed inset-x-3 bottom-4 z-[70] mx-auto max-w-3xl rounded-[1.4rem] border border-white/60 bg-slate-950/92 p-2.5 text-white shadow-[0_22px_70px_-24px_rgba(15,23,42,0.7)] backdrop-blur-2xl sm:bottom-5 sm:p-3"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-white/10 sm:size-12">
          <Image
            src={currentSong.coverImageUrl || '/images/funny-censored-fallback.png'}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 sm:max-w-48">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-pink-300">Now playing</p>
          <p className="truncate text-sm font-bold">{currentSong.title}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={playPrevious}
            disabled={queueLength <= 1}
            className="hidden size-8 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25 sm:flex"
            aria-label="Previous song"
          >
            <SkipBack className="size-4 fill-current" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="flex size-10 items-center justify-center rounded-full bg-yellow-300 text-slate-950 shadow-lg transition hover:scale-105 hover:bg-yellow-200"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
          </button>
          <button
            type="button"
            onClick={playNext}
            disabled={queueLength <= 1}
            className="hidden size-8 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25 sm:flex"
            aria-label="Next song"
          >
            <SkipForward className="size-4 fill-current" />
          </button>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
          <span className="w-9 text-right text-[10px] font-semibold tabular-nums text-white/45">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            onValueChange={(value) => setCurrentTime(value[0])}
            aria-label="Playback position"
            className="min-w-20 flex-1"
          />
          <span className="w-9 text-[10px] font-semibold tabular-nums text-white/45">{formatTime(duration)}</span>
        </div>

        <ShareButton
          songId={currentSong.id}
          songTitle={currentSong.title}
          className="hidden size-8 border-0 text-white/65 hover:bg-white/10 hover:text-white sm:inline-flex"
        />
        <button
          type="button"
          onClick={stop}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
          aria-label="Close player"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
