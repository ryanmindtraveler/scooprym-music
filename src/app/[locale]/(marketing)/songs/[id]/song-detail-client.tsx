'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { format } from 'date-fns';
import { Calendar, Clock, Heart, Newspaper, Pause, Play, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface SongDetailClientProps {
  song: {
    id: string;
    title: string;
    coverImageUrl?: string | null;
    audioUrl: string;
    prompt?: string | null;
    createdAt: Date;
    durationSec?: number | null;
    lyrics?: string | null;
    newsSummary?: string | null;
    sourceText?: string | null;
    sourceUrl?: string | null;
  };
  initialIsFavorite: boolean;
}

export function SongDetailClient({ song, initialIsFavorite }: SongDetailClientProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const { currentSong, isPlaying: isGlobalPlaying, play: playGlobal, togglePlay: toggleGlobalPlay } = usePlayerStore();
  const isPlaying = isGlobalPlaying && currentSong?.id === song.id;

  const tags = song.prompt
    ? song.prompt
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const handlePlay = () => {
    if (isPlaying) {
      toggleGlobalPlay();
    } else {
      playGlobal({
        ...song,
        artist: 'AI Generated',
        createdAt: song.createdAt.toString(),
      } as any);
    }
  };

  const handleFavorite = async () => {
    if (isFavoriteLoading) return;
    setIsFavoriteLoading(true);
    const newStatus = !isFavorite;
    setIsFavorite(newStatus); // Optimistic update

    try {
      const res = await fetch(`/api/songs/${song.id}/favorite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setIsFavorite(!newStatus); // Revert on error
      } else if (typeof data.data?.isFavorite === 'boolean') {
        setIsFavorite(data.data.isFavorite);
      }
    } catch {
      setIsFavorite(!newStatus); // Revert on error
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/songs/${song.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <>
      <div className="flex flex-1 flex-col bg-transparent min-h-screen pb-32">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="max-w-[1200px] mx-auto w-full p-4 md:p-8 flex flex-col gap-8">
            {/* Top Section: Visuals & Info (Unified Glass Card) */}
            <div className="flex flex-col md:flex-row gap-8 p-6 md:p-8 rounded-[32px] bg-linear-to-br from-white/95 to-purple-50/90 dark:from-zinc-900/80 dark:to-zinc-900/60 border border-white/50 dark:border-white/5 shadow-xl backdrop-blur-2xl">
              {/* Cover Image */}
              <div className="shrink-0 w-full md:w-[320px] aspect-square overflow-hidden rounded-2xl border border-white/20 shadow-lg bg-black/5 dark:bg-white/5">
                {song.coverImageUrl ? (
                  <Image
                    src={song.coverImageUrl}
                    alt={song.title}
                    width={600}
                    height={600}
                    className="size-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-4 bg-linear-to-br from-indigo-500/10 to-purple-500/10 text-indigo-950/20 dark:text-white/20">
                    <div className="text-4xl font-black tracking-tighter">AI MUSIC</div>
                  </div>
                )}
              </div>

              {/* Info & Actions */}
              <div className="flex flex-col gap-6 flex-1 min-w-0 py-2">
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-indigo-950 dark:text-white leading-tight wrap-break-word">
                    {song.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/20 border border-purple-100/50 dark:border-white/5">
                      <Calendar className="size-4" />
                      {format(new Date(song.createdAt), 'MMM d, yyyy')}
                    </div>
                    {song.durationSec && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/20 border border-purple-100/50 dark:border-white/5">
                        <Clock className="size-4" />
                        {Math.floor(song.durationSec / 60)}:
                        {Math.floor(song.durationSec % 60)
                          .toString()
                          .padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="px-3 py-1.5 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border-purple-100/50 dark:border-white/5 hover:bg-white hover:shadow-sm transition-all"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1" /> {/* Spacer */}
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                  <Button
                    onClick={handlePlay}
                    className={cn(
                      'flex-1 md:flex-none md:w-56 h-14 text-lg font-bold tracking-wide rounded-2xl shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all',
                      isPlaying
                        ? 'bg-white text-indigo-600 border border-indigo-100 hover:bg-slate-50'
                        : 'bg-linear-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white'
                    )}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2.5 size-6 fill-current" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2.5 size-6 fill-current" /> Play Track
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="h-14 w-14 rounded-2xl border-purple-200 dark:border-white/10 bg-white/50 hover:bg-white hover:text-indigo-600 transition-colors"
                  >
                    <Share2 className="size-7" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleFavorite}
                    disabled={isFavoriteLoading}
                    className="h-14 w-14 rounded-2xl border-purple-200 dark:border-white/10 bg-white/50 hover:bg-white hover:text-red-500 transition-colors"
                  >
                    <Heart
                      className={cn(
                        'size-7 transition-colors',
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'
                      )}
                    />
                  </Button>
                </div>
              </div>
            </div>

            {/* News Background Section */}
            {(song.newsSummary || song.sourceText) && (
              <div className="p-6 md:p-8 rounded-[32px] bg-white/80 dark:bg-zinc-900/40 border border-white/50 dark:border-white/5 shadow-lg backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2 mb-4 opacity-70">
                  <div className="flex items-center gap-2">
                    <Newspaper className="size-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-bold tracking-tight text-indigo-950 dark:text-indigo-50">
                      News Background | 新闻背景
                    </span>
                  </div>
                  {/* Source Link / Search */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const searchQuery = (song.newsSummary || song.sourceText || song.title || '').slice(0, 100);
                      window.open(
                        song.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
                        '_blank'
                      );
                    }}
                    className="h-8 gap-2 rounded-full bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 px-3"
                  >
                    <span className="text-xs font-semibold">{song.sourceUrl ? 'View Source' : 'Search news'}</span>
                    <span>🍿</span>
                  </Button>
                </div>
                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {song.newsSummary || song.sourceText}
                </p>
              </div>
            )}

            {/* Bottom Section: Lyrics (Ported from LyricsDisplay) */}
            <div className="relative flex flex-col min-h-[500px] rounded-[32px] bg-linear-to-br from-white/95 to-purple-50/50 dark:from-zinc-900/95 dark:to-zinc-900/80 border border-white/60 dark:border-white/5 backdrop-blur-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-6 pb-4 border-b border-purple-100/50 dark:border-white/5 z-20 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                  <div className="i-lucide-mic-2 size-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-indigo-950 dark:text-indigo-50">Lyrics</h3>
              </div>

              {/* Lyrics Scroll Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <FormattedLyricsView lyrics={song.lyrics} duration={song.durationSec} songId={song.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// === Sub-component: FormattedLyricsView (Ported from lyrics-display.tsx) ===

function FormattedLyricsView({
  lyrics,
  duration,
  songId,
}: { lyrics: string | null | undefined; duration?: number | null; songId: string }) {
  const { currentTime, isPlaying, currentSong } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | HTMLParagraphElement | null)[]>([]);

  // Safety: If no lyrics
  if (!lyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 italic">
        <span>No lyrics available for this track.</span>
      </div>
    );
  }

  // 1. Process Lines
  const displayLines = useMemo(() => {
    return lyrics.split('\n').filter((line) => line.trim() !== '');
  }, [lyrics]);

  // 2. Calculate Active Index (Heuristic: 10% intro, 10% outro)
  const activeIndex = useMemo(() => {
    // Only animate if playing THIS specific song
    const isPlayingThisSong = isPlaying && currentSong?.id === songId;

    if (!duration || duration <= 0 || !isPlayingThisSong) return -1;

    // Improved Heuristic from Create Page
    // Only apply if we are actually playing THIS song, otherwise -1
    // (Note: SongDetail passes static props, so we check standard equality)

    const introPadding = duration * 0.1;
    const outroPadding = duration * 0.1;
    const sungDuration = duration - introPadding - outroPadding;
    let progress = (currentTime - introPadding) / sungDuration;
    progress = Math.max(0, Math.min(1, progress));

    const index = Math.floor(progress * displayLines.length);
    return Math.min(index, displayLines.length - 1);
  }, [currentTime, duration, isPlaying, displayLines.length, currentSong?.id, songId]);

  // 3. Auto Scroll
  useEffect(() => {
    if (activeIndex >= 0 && lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="py-12 px-6 md:px-12 flex flex-col items-center text-center gap-6">
      {displayLines.map((line, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;

        return (
          <div
            key={index}
            ref={(el) => {
              lineRefs.current[index] = el;
            }}
            className={cn(
              'transition-all duration-500 ease-out max-w-2xl w-full',
              isActive
                ? 'scale-105 opacity-100 py-4'
                : 'scale-95 opacity-80 blur-[0.5px] hover:blur-0 cursor-default py-1' // slightly softer than create page for reading mode
            )}
          >
            {/* Section Headers (e.g. [Chorus]) */}
            {line.startsWith('[') && line.endsWith(']') ? (
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-50/50 dark:bg-white/5 border border-indigo-100/50 dark:border-white/10 backdrop-blur-md mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 select-none">
                  {line.slice(1, -1)}
                </span>
              </div>
            ) : (
              <p
                className={cn(
                  'text-lg md:text-2xl font-bold leading-relaxed transition-colors duration-300',
                  isActive ? 'text-indigo-600 dark:text-white drop-shadow-sm' : 'text-slate-400/80 dark:text-slate-500'
                )}
              >
                {line}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
