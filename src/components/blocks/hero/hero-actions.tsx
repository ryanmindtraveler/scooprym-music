'use client';

import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { Grid2X2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

interface HeroActionsProps {
  featuredSong?: Song;
  songs: Song[];
  playLabel: string;
  pauseLabel: string;
  galleryLabel: string;
}

function scrollToSection(id: 'today' | 'gallery') {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toPlayerSong(song: Song) {
  return {
    id: song.id,
    seoSlug: song.seoSlug,
    title: song.title,
    audioUrl: song.audioUrl || '',
    coverImageUrl: song.coverImageUrl,
    artist: 'ScoopRYM',
    newsSummary: song.newsSummary || undefined,
    newsContent: song.sourceText || undefined,
    newsLink: song.sourceUrl || undefined,
  };
}

export function HeroActions({ featuredSong, songs, playLabel, pauseLabel, galleryLabel }: HeroActionsProps) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const isFeaturedPlaying = Boolean(featuredSong && currentSong?.id === featuredSong.id && isPlaying);

  const handlePlay = () => {
    scrollToSection('today');

    if (!featuredSong?.audioUrl || featuredSong.audioUrl === 'processing') {
      toast.error('Today’s first Drop is not ready to play yet.');
      return;
    }

    if (isFeaturedPlaying) {
      pause();
      return;
    }

    play(toPlayerSong(featuredSong), songs.map(toPlayerSong));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
      <button
        type="button"
        onClick={handlePlay}
        aria-pressed={isFeaturedPlaying}
        className="group inline-flex h-14 items-center justify-center rounded-full bg-[#201a29] py-2 pr-7 pl-2 text-[0.95rem] font-black tracking-[-0.01em] text-[#fffdf8] shadow-[0_14px_32px_rgba(32,26,41,0.24)] ring-1 ring-[#201a29]/20 transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#2b2335] hover:shadow-[0_18px_38px_rgba(32,26,41,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d80d63]/25 active:translate-y-0"
      >
        <span className="mr-3 flex size-10 items-center justify-center rounded-full bg-[#fff258] text-[#201a29] shadow-[inset_0_0_0_1px_rgba(32,26,41,0.12)] transition-transform duration-200 ease-out group-hover:scale-105">
          {isFeaturedPlaying ? (
            <Pause className="size-[1.05rem] fill-current" aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 size-[1.05rem] fill-current" aria-hidden="true" />
          )}
        </span>
        {isFeaturedPlaying ? pauseLabel : playLabel}
      </button>

      <a
        href="#gallery"
        onClick={(event) => {
          event.preventDefault();
          scrollToSection('gallery');
        }}
        className="group inline-flex h-14 items-center justify-center rounded-full border border-[#201a29]/22 bg-[#fffdf8]/55 py-2 pr-7 pl-2 text-[0.95rem] font-black tracking-[-0.01em] text-[#201a29] shadow-[0_10px_24px_rgba(32,26,41,0.1)] backdrop-blur-md transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#201a29]/32 hover:bg-[#fffdf8]/82 hover:shadow-[0_14px_28px_rgba(32,26,41,0.14)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d80d63]/20 active:translate-y-0"
      >
        <span className="mr-3 flex size-10 items-center justify-center rounded-full border border-[#201a29]/14 bg-[#fffdf8]/80 text-[#201a29] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] transition-[transform,background-color] duration-200 ease-out group-hover:scale-105 group-hover:bg-[#fffdf8]">
          <Grid2X2 className="size-[1.05rem] stroke-[2.25]" aria-hidden="true" />
        </span>
        {galleryLabel}
      </a>
    </div>
  );
}
