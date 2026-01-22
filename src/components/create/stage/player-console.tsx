'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Loader2, Pause, Play, Repeat, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PlayerConsoleProps {
  className?: string;
}

export function PlayerConsole({ className }: PlayerConsoleProps) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setVolume = usePlayerStore((state) => state.setVolume);

  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isDownloading, setIsDownloading] = useState(false);

  // Format time (e.g., 1:23)
  const formatTime = (time: number) => {
    if (Number.isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume || 0.5);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleDownload = async () => {
    if (!currentSong?.audioUrl || isDownloading) return;
    try {
      setIsDownloading(true);
      const response = await fetch(currentSong.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSong.title}.mp3`;
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

  // Only show if we have a song (even if processing, we might want to show loading state,
  // but for the console, it implies playable media. Let's show if audioUrl exists)
  if (!currentSong?.audioUrl) return null;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={cn('absolute bottom-6 left-1/2 -translate-x-1/2 z-40', 'flex items-center justify-center', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/*
        GLASS CAPSULE CONTAINER
        - Ultra-premium backdrop blur
        - Subtle border gradient
        - Dynamic shadow
      */}
      <div
        className={cn(
          'relative flex items-center gap-4 px-6 py-3 rounded-full',
          'bg-white/70 dark:bg-black/60 backdrop-blur-2xl',
          'border border-white/20 dark:border-white/10',
          'shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
          'transition-all duration-500',
          isHovered ? 'scale-100 shadow-xl' : 'scale-[0.98] shadow-lg opacity-90'
        )}
      >
        {/* === LEFT: Time & Volume === */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 w-[32px] text-right">
            {formatTime(currentTime)}
          </span>

          {/* Loop/Shuffle could go here, replacing with Volume for now for utility */}
          <div className="group/vol relative flex items-center">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400"
            >
              {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
            </button>
            {/* Volume Slider Pop-out (concept: shows on hover) */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-8 h-24 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-full border border-white/10 shadow-xl flex flex-col items-center justify-end pb-3 pt-3 opacity-0 invisible group-hover/vol:opacity-100 group-hover/vol:visible transition-all duration-300">
              <Slider
                orientation="vertical"
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(val) => {
                  setVolume(val[0]);
                  if (val[0] > 0) setIsMuted(false);
                }}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* === CENTER: Playback Controls === */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all"
          >
            <SkipBack className="size-4 fill-current" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlay}
            className={cn(
              'size-12 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95',
              isPlaying
                ? 'bg-indigo-500 text-white shadow-indigo-500/30'
                : 'bg-slate-900 dark:bg-white text-white dark:text-black'
            )}
          >
            {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all"
          >
            <SkipForward className="size-4 fill-current" />
          </Button>
        </div>

        {/* === RIGHT: Duration & Actions === */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={isDownloading}
            className="size-7 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all"
          >
            {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          </Button>

          <span className="text-[10px] font-mono font-bold text-slate-400/70 w-[32px]">{formatTime(duration)}</span>
        </div>

        {/* === PROGRESS BAR (Top Edge) === */}
        <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full overflow-hidden">
          {/* Track */}
          <div className="absolute inset-0 bg-slate-200/30 dark:bg-white/10" />
          {/* Fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            style={{
              width: `${(currentTime / (duration || 1)) * 100}%`,
            }}
            layoutId="progress-fill"
          />
        </div>

        {/* Interactive Slider Overlay (Invisible but clickable) */}
        <div className="absolute -top-3 left-4 right-4 h-4 group/seek cursor-pointer">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={(val) => setCurrentTime(val[0])}
            className="opacity-0 group-hover/seek:opacity-100 transition-opacity h-full [&>span]:h-full [&>span]:bg-transparent [&_span]:bg-transparent"
          />
        </div>
      </div>
    </motion.div>
  );
}
