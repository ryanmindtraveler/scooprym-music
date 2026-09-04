'use client';

import { getNewsTitle, getWeeklyBiggestDrops } from '@/lib/song-editorial';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { Flame, Pause, Play, Sparkles, Trophy } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface BiggestDropsProps {
  songs: Song[];
}

function toPlayerSong(song: Song) {
  return {
    id: song.id,
    title: song.title,
    audioUrl: song.audioUrl || '',
    coverImageUrl: song.coverImageUrl,
    artist: 'ScoopRYM',
    newsSummary: song.newsSummary || undefined,
    newsContent: song.sourceText || undefined,
    newsLink: song.sourceUrl || undefined,
  };
}

function Cover({ song }: { song: Song }) {
  return (
    <div className="relative aspect-[16/11] w-full overflow-hidden rounded-xl bg-[#201a29] shadow-xs">
      {song.coverImageUrl ? (
        <Image
          src={song.coverImageUrl}
          alt={getNewsTitle(song)}
          fill
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 34vw, 92vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-xs font-black uppercase tracking-[0.14em] text-[#fffdf8]/70">
          ScoopRYM
        </span>
      )}
    </div>
  );
}

export function BiggestDrops({ songs }: BiggestDropsProps) {
  const { currentSong, isPlaying, play, pause } = usePlayerStore();
  const biggestSongs = getWeeklyBiggestDrops(songs.slice(4));

  const isActive = (song: Song) => currentSong?.id === song.id && isPlaying;

  const toggleSong = (song: Song) => {
    if (!song.audioUrl) {
      toast.error('This Drop is not ready to play yet.');
      return;
    }

    if (isActive(song)) {
      pause();
      return;
    }

    play(toPlayerSong(song), biggestSongs.map(toPlayerSong));
  };

  return (
    <section
      id="biggest"
      className="relative z-20 overflow-hidden bg-indigo-900 bg-[linear-gradient(90deg,#6366f1_0%,#ec4899_50%,#22d3ee_100%)] px-4 py-24 text-[#fffdf8] md:px-6 md:py-28 2xl:px-8"
    >
      <div className="relative z-10 mx-auto max-w-[1760px]">
        {/* Header */}
        <div className="flex flex-col gap-4 pb-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-white shadow-xs backdrop-blur-md">
                <Trophy className="size-3.5 text-amber-300" />
                Weekly Chart
              </span>
            </div>
            <h2 className="mt-3.5 text-4xl font-black tracking-tight drop-shadow-xs md:text-5xl">The Week on Repeat</h2>
            <p className="mt-3 max-w-lg text-base font-medium leading-relaxed text-white/90">
              The meme songs listeners couldn’t stop replaying this week.
            </p>
          </div>
          <p className="max-w-lg text-sm font-bold uppercase tracking-wider text-white/80 md:text-right">
            Ranked by listener plays this week
          </p>
        </div>

        {/* Grid List */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-5">
          {biggestSongs.map((song, index) => (
            <button
              key={song.id}
              type="button"
              onClick={() => toggleSong(song)}
              className={cn(
                'group grid min-w-0 grid-cols-[auto_7.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-white/80 p-3.5 text-left backdrop-blur-md shadow-[0_12px_32px_rgba(32,26,41,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d80d63]/50 hover:bg-white/95 hover:shadow-[0_18px_40px_rgba(216,13,99,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d80d63] sm:grid-cols-[auto_9.5rem_minmax(0,1fr)_auto] sm:p-4.5 dark:bg-slate-900/80',
                index === 0 && 'border-amber-400/60 bg-white/90 shadow-[0_16px_40px_rgba(245,158,11,0.2)]',
                isActive(song) && 'border-[#d80d63] ring-2 ring-[#d80d63]/40'
              )}
            >
              <div className="flex w-8 flex-col items-center justify-center sm:w-10">
                <span className="text-xl font-black tracking-tight text-[#d80d63] sm:text-2xl">0{index + 1}</span>
              </div>

              <Cover song={song} />

              <div className="min-w-0">
                <span className="line-clamp-2 block text-base font-black leading-snug tracking-tight text-[#201a29] transition-colors group-hover:text-[#b90851] sm:text-lg dark:text-[#fffdf8]">
                  {getNewsTitle(song)}
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-extrabold text-[#d80d63] dark:bg-pink-950/60 dark:text-pink-300">
                    <Flame className="size-3 fill-current" />
                    {(song.weeklyPlays ?? 0).toLocaleString()} {(song.weeklyPlays ?? 0) === 1 ? 'play' : 'plays'}
                  </span>
                  {isActive(song) && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#d80d63]">
                      <span className="inline-flex items-end gap-[2px] h-3">
                        <span className="w-[2px] h-full bg-[#d80d63] rounded-full animate-pulse" />
                        <span
                          className="w-[2px] h-2/3 bg-[#d80d63] rounded-full animate-pulse"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-[2px] h-4/5 bg-[#d80d63] rounded-full animate-pulse"
                          style={{ animationDelay: '300ms' }}
                        />
                      </span>
                      Playing
                    </span>
                  )}
                </div>
              </div>

              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 shadow-md group-hover:scale-105',
                  isActive(song)
                    ? 'bg-[#d80d63] text-white shadow-[#d80d63]/40'
                    : 'bg-[#fff258] text-[#201a29] group-hover:bg-[#d80d63] group-hover:text-white'
                )}
              >
                {isActive(song) ? (
                  <Pause className="size-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 size-5 fill-current" />
                )}
              </span>
            </button>
          ))}
          {biggestSongs.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/40 p-10 text-center text-sm font-semibold text-white/90">
              <Sparkles className="mb-2 size-8 text-amber-300" />
              This week’s chart is waiting for its first plays.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
