'use client';

import { getActiveLyricIndex, parseLrc } from '@/ai/text/utils/lyrics-parser';
import { DownloadButton } from '@/components/songs/actions/download-button';
import { LikeButton } from '@/components/songs/actions/like-button';
import { ShareButton } from '@/components/songs/actions/share-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useImageColors } from '@/hooks/ui/use-image-colors';
import { useActionPermission } from '@/hooks/auth/use-permission';
import { useSongLike } from '@/hooks/songs/use-song-like';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store/player-store';
import { format } from 'date-fns';
import {
  ChevronDown,
  Disc3, // Vinyl icon alternative
  Download,
  Heart,
  Music2,
  Newspaper,
  Pause,
  Play,
  Share2,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { Song } from '@/types/song';

interface SongDetailClientProps {
  song: Song;
  initialIsFavorite: boolean;
  onClose?: () => void;
  autoPlay?: boolean;
  hideActions?: boolean;
}

export function SongDetailClient({
  song,
  initialIsFavorite,
  onClose,
  autoPlay = false,
  hideActions = false,
}: SongDetailClientProps) {
  // Global Player Store
  const { currentSong, isPlaying: globalIsPlaying, togglePlay, play, duration } = usePlayerStore();
  const currentTime = usePlayerStore((state) => state.currentTime);

  const isThisSongPlaying = globalIsPlaying && currentSong?.id === song.id;

  // Dynamic color extraction from album art
  const { primary, secondary, muted, darkMuted, isLoading: colorsLoading } = useImageColors(song.coverImageUrl);

  // Auto-play logic
  useEffect(() => {
    if (autoPlay && song.audioUrl && currentSong?.id !== song.id) {
      play({
        id: song.id,
        title: song.title,
        audioUrl: song.audioUrl,
        coverImageUrl: song.coverImageUrl,
        artist: 'AI Generated',
      });
      fetch(`/api/songs/${song.id}/play`, { method: 'POST' }).catch(() => {});
    }
  }, [song.id, autoPlay, song.audioUrl, song.title, song.coverImageUrl, play, currentSong?.id]);

  // Auth/Permissions
  const { checkLike, checkDownload } = useActionPermission();
  const {
    isLiked,
    toggleLike,
    isLoading: isLikeLoading,
  } = useSongLike({
    songId: song.id,
    initialIsLiked: initialIsFavorite,
  });

  // Handlers
  const handlePlay = () => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      if (!song.audioUrl) return;
      play({
        id: song.id,
        title: song.title,
        audioUrl: song.audioUrl,
        coverImageUrl: song.coverImageUrl,
        artist: 'AI Generated',
      });
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/songs/${song.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const formattedDate = useMemo(() => {
    try {
      return format(new Date(song.createdAt), 'MMM d, yyyy');
    } catch {
      return '';
    }
  }, [song.createdAt]);

  const tags =
    song.prompt
      ?.split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => t.length <= 20) || [];

  return (
    <div className="relative flex size-full flex-col overflow-hidden text-white selection:bg-pink-500/30">
      <style>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          10% { transform: rotate(-15deg); }
          20% { transform: rotate(15deg); }
          30% { transform: rotate(-15deg); }
          40% { transform: rotate(15deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
      `}</style>
      {/* --- Dynamic Gradient Background --- */}
      <div
        className="absolute inset-0 z-0 transition-all duration-1000 ease-out"
        style={{
          background: colorsLoading
            ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)' // Neutral Midnight: Slate-900 -> Indigo-950 -> Black
            : `
              radial-gradient(ellipse at 20% 20%, ${primary}40 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, ${secondary}30 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, ${muted}20 0%, transparent 70%),
              linear-gradient(180deg, ${darkMuted || '#0a0a0f'} 0%, #0a0a0f 100%)
            `,
        }}
      />

      {/* Animated Glow Layer (when playing) */}
      {isThisSongPlaying && (
        <div
          className="absolute inset-0 z-0 animate-pulse"
          style={{
            background: `radial-gradient(ellipse at center, ${primary}15 0%, transparent 60%)`,
            animationDuration: '3s',
          }}
        />
      )}

      {/* Subtle Album Art Blur Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={song.coverImageUrl || '/images/funny-censored-fallback.png'}
          alt="bg"
          fill
          className="object-cover opacity-10 blur-[120px] scale-125 saturate-150"
        />
      </div>

      {/* Noise Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

      {/* --- Close Button --- */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/70 hover:text-white transition-all border border-white/5"
        >
          <ChevronDown className="size-5" />
        </Button>
      )}

      {/* --- Main Content Layout --- */}
      <div className="relative z-10 flex flex-col md:flex-row h-full w-full overflow-hidden p-4 md:p-6 gap-6">
        {/* Left: Vinyl Player */}
        <div className="relative flex-none w-full md:w-[420px] h-full overflow-hidden">
             {/* Share Button - Abstracted to Top Right */}
             <div className="absolute top-0 right-0 z-20 flex items-center gap-2">
                  <LikeButton
                    songId={song.id}
                    initialIsLiked={isLiked}
                    className="rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-red-500 hover:scale-110 transition-all h-10 w-10 border-none"
                  />
                {song.audioUrl && (
                  <DownloadButton
                    audioUrl={song.audioUrl}
                    title={song.title}
                    className="rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white hover:scale-110 transition-all h-10 w-10 border-none"
                  />
                )}
              <ShareButton
                songId={song.id}
                className="rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white hover:scale-110 transition-all h-10 w-10 border-none"
              />
             </div>
        <div className="w-full h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="min-h-full flex flex-col items-center justify-center gap-6 py-6 pl-4 pr-4">
          {/* Vinyl Record */}
          <div className="relative group cursor-pointer" onClick={handlePlay}>
            {/* The Disc */}
            <div
              className={cn(
                'relative size-[220px] rounded-full shadow-2xl border-4 border-neutral-900 bg-neutral-950 overflow-hidden',
                'before:absolute before:inset-0 before:rounded-full before:border before:border-white/5 before:z-20',
                'after:absolute after:inset-[10px] after:rounded-full after:border-40 after:border-neutral-900/50 after:z-10'
              )}
              style={{
                animation: isThisSongPlaying ? 'spin 6s linear infinite' : 'none',
                boxShadow: isThisSongPlaying
                  ? '0 0 60px rgba(255, 255, 255, 0.15), 0 0 100px rgba(255, 255, 255, 0.05)'
                  : '0 20px 40px rgba(0,0,0,0.6)',
              }}
            >
              <div className="absolute inset-[50px] rounded-full overflow-hidden z-0 bg-neutral-800">
                <Image
                  src={song.coverImageUrl || '/images/funny-censored-fallback.png'}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
                {!song.coverImageUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                    <span className="text-[10px] font-black text-center text-white uppercase tracking-wider leading-relaxed">
                      Content flagged:<br/>Too hot for AI art
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Center Hole */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 rounded-full bg-black border border-white/10 z-30" />

            {/* Play Overlay - Always visible */}
            <div className="absolute inset-0 flex items-center justify-center z-40 opacity-70 group-hover:opacity-100 transition-opacity bg-black/20 group-hover:bg-black/40 rounded-full backdrop-blur-[1px] group-hover:backdrop-blur-[2px]">
              {isThisSongPlaying ? (
                <Pause className="size-14 fill-white text-white drop-shadow-lg" />
              ) : (
                <Play className="size-16 fill-white text-white drop-shadow-lg pl-1" />
              )}
            </div>
          </div>

          {/* Song Meta */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white line-clamp-2 md:line-clamp-none">
              {song.title}
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-white/50">
              <Badge
                variant="secondary"
                className="bg-white/10 text-white/70 hover:bg-white/20 border-0 h-5 px-2 text-[10px]"
              >
                AI
              </Badge>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>



          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 px-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-white/5 text-white/60 hover:bg-white/10 border-0 h-5 px-2 text-[10px] whitespace-nowrap"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Scrubber */}
          <div className="w-full max-w-[280px] space-y-3">
            <div className="relative group">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={(val) => usePlayerStore.getState().setCurrentTime(val[0])}
                className="cursor-pointer relative z-10"
              />
              <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 rounded-full -translate-y-1/2 z-0 blur-sm group-hover:bg-white/10 transition-colors" />
            </div>
            <div className="flex justify-between text-[11px] text-white/50 font-medium font-mono tracking-wider">
              <span>
                {(() => {
                  if (!currentTime || Number.isNaN(currentTime)) return '0:00';
                  const mins = Math.floor(currentTime / 60);
                  const secs = Math.floor(currentTime % 60);
                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                })()}
              </span>
              <span>
                {(() => {
                  if (!duration || Number.isNaN(duration)) return '0:00';
                  const mins = Math.floor(duration / 60);
                  const secs = Math.floor(duration % 60);
                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                })()}
              </span>
            </div>
          </div>

          {/* Actions - Removed from here (Moved to Top Right) */}

          {/* News Summary */}
          {(song.newsSummary || song.sourceText) && (
            <div className="group/news relative w-full overflow-hidden rounded-2xl bg-white/3 hover:bg-white/6 border border-white/10 p-5 backdrop-blur-md transition-colors duration-500">
              {/* Subtle Gradient Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] pointer-events-none group-hover/news:bg-indigo-400/30 transition-colors duration-500" />

              <div className="relative z-10 flex items-center justify-between gap-2 mb-4 w-full">
                <div className="flex items-center gap-2.5 text-white/40 group-hover/news:text-white/60 transition-colors">
                  <div className="p-1.5 rounded-md bg-white/5">
                    <Newspaper className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Background</span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white hover:scale-105 transition-all border border-white/5 shadow-sm"
                      onClick={() => {
                        const searchQuery = (song.newsSummary || song.sourceText || song.title || '').slice(0, 100);
                        window.open(
                          song.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
                          '_blank'
                        );
                      }}
                    >
                      <span
                        className="text-lg leading-none mb-0.5 inline-block origin-bottom"
                        style={{ animation: 'ring 1.5s ease-in-out infinite' }}
                      >
                        🍿
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs bg-black/80 border-white/10 backdrop-blur-xl text-white">
                    <p>{song.sourceUrl ? 'Read Source' : 'Search Topic'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="relative z-10">
                <p className="text-sm text-white/80 leading-relaxed font-light text-left tracking-wide opacity-90">
                  {song.newsSummary || song.sourceText}
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
       </div>

        {/* Right: Lyrics With Card Style */}
        <div className="flex-1 flex flex-col min-h-0 bg-white/3 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
          {/* Header - Fixed at top */}
          <div className="flex-none px-6 py-4 flex items-center justify-between z-10 border-b border-white/5">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Disc3 className="size-4" /> Lyrics
            </span>
            {song.category && (
              <span className="text-[10px] text-white/30 uppercase border border-white/10 px-2 py-0.5 rounded-full">
                {song.category}
              </span>
            )}
          </div>

          {/* Lyrics Scroll Area - Only this scrolls */}
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              <FormattedLyricsView lyrics={song.lyrics} duration={duration} songId={song.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Sub-component: FormattedLyricsView ===
// Displays synchronized lyrics with auto-scroll that doesn't affect parent containers

function FormattedLyricsView({
  lyrics,
  duration,
  songId,
}: { lyrics: string | null | undefined; duration?: number | null; songId: string }) {
  const { currentTime, isPlaying, currentSong } = usePlayerStore();

  // Refs for scroll control
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Empty State ---
  if (!lyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30 italic">
        <span>No lyrics available for this track.</span>
      </div>
    );
  }

  // --- 1. Parse lyrics into display lines ---
  const displayLines = useMemo(() => {
    return lyrics.split('\n').filter((line) => line.trim() !== '');
  }, [lyrics]);

  // --- 2. Calculate active line index ---
  // Uses heuristic timing: assumes 10% intro and 10% outro padding
  const activeIndex = useMemo(() => {
    const isPlayingThisSong = isPlaying && currentSong?.id === songId;
    if (!duration || duration <= 0 || !isPlayingThisSong) return -1;

    const INTRO_RATIO = 0.1; // 10% intro
    const OUTRO_RATIO = 0.1; // 10% outro

    const introPadding = duration * INTRO_RATIO;
    const sungDuration = duration * (1 - INTRO_RATIO - OUTRO_RATIO);

    // Calculate progress within the "sung" portion
    let progress = (currentTime - introPadding) / sungDuration;
    progress = Math.max(0, Math.min(1, progress)); // Clamp to [0, 1]

    const index = Math.floor(progress * displayLines.length);
    return Math.min(index, displayLines.length - 1);
  }, [currentTime, duration, isPlaying, displayLines.length, currentSong?.id, songId]);

  // --- 3. Auto-scroll to active line ---
  // IMPORTANT: Uses container.scrollTo() instead of scrollIntoView()
  // to prevent parent containers from scrolling
  useEffect(() => {
    const container = containerRef.current;
    const activeElement = lineRefs.current[activeIndex];

    if (activeIndex < 0 || !container || !activeElement) return;

    // Calculate scroll position to center the active line
    const containerHeight = container.clientHeight;
    const elementTop = activeElement.offsetTop;
    const elementHeight = activeElement.offsetHeight;

    const targetScroll = elementTop - containerHeight / 2 + elementHeight / 2;

    // Clamp to valid scroll range
    const maxScroll = container.scrollHeight - containerHeight;
    const safeScroll = Math.max(0, Math.min(targetScroll, maxScroll));

    container.scrollTo({
      top: safeScroll,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  // --- 4. Handle click-to-seek ---
  const handleLineClick = (lineIndex: number) => {
    if (!duration) return;

    const INTRO_RATIO = 0.1;
    const OUTRO_RATIO = 0.1;
    const introPadding = duration * INTRO_RATIO;
    const sungDuration = duration * (1 - INTRO_RATIO - OUTRO_RATIO);

    const seekTime = introPadding + (lineIndex / displayLines.length) * sungDuration;
    usePlayerStore.getState().setCurrentTime(seekTime);
  };

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto custom-scrollbar px-4 py-6 flex flex-col items-center text-center gap-2"
    >
      {/* Top spacer for centering first line */}
      <div className="h-[40%] shrink-0" aria-hidden="true" />

      {displayLines.map((line, index) => {
        const isSection = line.startsWith('[') && line.endsWith(']');

        return (
          <div
            key={index}
            ref={(el) => {
              lineRefs.current[index] = el;
            }}
            onClick={() => handleLineClick(index)}
            className={cn(
              'w-full max-w-2xl flex flex-col items-center cursor-pointer',
              'transition-all duration-300 ease-out',
              'opacity-60 hover:opacity-100',
              'py-1'
            )}
          >
            {isSection ? (
              // Section marker (e.g., [VERSE], [CHORUS])
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md my-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 select-none">
                  {line.slice(1, -1)}
                </span>
              </div>
            ) : (
              // Regular lyric line
              <p className="text-base md:text-lg font-medium leading-relaxed text-white/90">{line}</p>
            )}
          </div>
        );
      })}

      {/* Bottom spacer for centering last line */}
      <div className="h-[40%] shrink-0" aria-hidden="true" />
    </div>
  );
}

