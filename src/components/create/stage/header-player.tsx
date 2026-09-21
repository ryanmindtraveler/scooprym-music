'use client';

import { Slider } from '@/components/ui/slider';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { getCanonicalBaseUrl } from '@/lib/urls/urls';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { motion } from 'framer-motion';
import { Download, Heart, Loader2, Pause, Play, Share2, SkipBack, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function HeaderPlayer({
  className,
  variant = 'floating',
  contextSong,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  className?: string;
  variant?: 'floating' | 'footer';
  contextSong?: {
    id: string;
    audioUrl: string;
    title: string;
    coverImageUrl?: string;
  };
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playSong = usePlayerStore((state) => state.play);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const isLoading = usePlayerStore((state) => state.isLoading);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Computed Active Song (Prioritize Context if interaction logic requires it, but display mostly follows Global)
  // For Display: If Context is provided, we essentially allow "Remote Control" of that song.
  // But strictly, this player component reflects the GLOBAL player state.
  // Exception: The "Play" button here is an entry point to PLAY the context song.
  const isContextActive = contextSong && currentSong?.id === contextSong.id;

  const handlePlayClick = () => {
    if (contextSong) {
      if (isContextActive) {
        togglePlay();
      } else {
        // Load and Play
        playSong({
          id: contextSong.id,
          title: contextSong.title,
          audioUrl: contextSong.audioUrl,
          coverImageUrl: contextSong.coverImageUrl,
          artist: 'AI Generation',
        });
      }
    } else {
      // Fallback: Standard Toggle (Global)
      togglePlay();
    }
  };

  const handleDownload = async () => {
    const targetSong = contextSong || currentSong;
    if (!targetSong?.audioUrl || isDownloading) return;
    try {
      setIsDownloading(true);
      const response = await fetch(targetSong.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${targetSong.title || 'track'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download audio');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const targetSong = contextSong || currentSong;
    if (!targetSong) return;
    const shareUrl = `${getCanonicalBaseUrl()}/songs/${getSongCanonicalSlug(targetSong)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const formatTime = (time: number) => {
    if (Number.isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Has Song: Global OR Context
  const hasContent = !!currentSong?.audioUrl || !!contextSong?.audioUrl;
  // Controls Enabled: If Context is provided, buttons are enabled (to trigger load).
  // If no Context, buttons enabled only if Global has song.
  const canInteract = !!contextSong || !!currentSong;

  // Display State:
  // If isContextActive: valid time.
  // If NOT Active (but context exists): 0:00
  // If No Context: Global Time.
  const displayCurrentTime = isContextActive || (!contextSong && currentSong) ? currentTime : 0;
  const displayDuration = isContextActive || (!contextSong && currentSong) ? duration : 0;
  const displayIsPlaying = isContextActive ? isPlaying : false; // Only show pause if THIS song is playing

  const containerStyles = {
    floating:
      'bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm hover:bg-white/50 dark:hover:bg-zinc-900/50 p-1.5 pr-4 rounded-2xl',
    footer: 'w-full bg-transparent border-none shadow-none py-4 px-6',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-1 transition-colors duration-300', containerStyles[variant], className)}
    >
      {/* Playback Controls (Grouped left) */}
      <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 rounded-xl p-1">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canInteract || !hasPrevious}
          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipBack className="size-4 fill-current" />
        </button>

        <button
          type="button"
          onClick={handlePlayClick}
          disabled={!canInteract}
          className="size-9 flex items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:shadow-none"
        >
          {isLoading && (isContextActive || (!contextSong && displayIsPlaying)) ? (
            <Loader2 className="size-4 animate-spin text-white/90" />
          ) : displayIsPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canInteract || !hasNext}
          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="size-4 fill-current" />
        </button>
      </div>

      {/* Progress & Time */}
      <div className="flex items-center gap-3 px-3 flex-1 min-w-[240px] group/scrubber">
        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums min-w-[32px] text-right">
          {formatTime(displayCurrentTime)}
        </span>

        <div className="flex-1 relative h-8 flex items-center cursor-pointer">
          {/* Custom styled slider for "Max Pro" look */}
          <Slider
            disabled={!canInteract || (contextSong && !isContextActive)}
            value={[displayCurrentTime]}
            max={displayDuration || 100}
            step={0.1}
            onValueChange={(val) => {
              if (isContextActive || (!contextSong && currentSong)) {
                setCurrentTime(val[0]);
              }
            }}
            className="z-10 cursor-grab active:cursor-grabbing disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 tabular-nums min-w-[32px]">
          {formatTime(displayDuration)}
        </span>
      </div>

      {/* Vertical Divider */}
      <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

      {/* Actions Group (Right) */}
      <div className="flex items-center gap-1 pl-1">
        <button
          type="button"
          onClick={() => {
            setIsLiked(!isLiked);
            toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
          }}
          disabled={!canInteract}
          className={cn(
            'p-2 rounded-full transition-all hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
            isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'
          )}
        >
          <Heart className={cn('size-4', isLiked && 'fill-current')} />
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={!canInteract}
          className="p-2 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 className="size-4" />
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!canInteract || isDownloading}
          className="p-2 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        </button>
      </div>
    </motion.div>
  );
}
