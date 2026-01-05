'use client';

import { Button } from '@/components/ui/button';
import { LoadingTicker } from '@/components/ui/loading-ticker';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import {
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Play,
  Share2,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

/**
 * MusicPlayerProps
 */
export interface MusicPlayerProps {
  className?: string;
  shareUrl?: string; // Optional override for specific share link
}

const FUNNY_LOADING_MESSAGES = [
  'Cooking up a storm...',
  'Stealing flows from the web...',
  'Finding rhymes for "Crypto"...',
  'Adding extra 808 bass...',
  'Waking up the mumble rapper...',
  'Auto-tuning the bad news...',
  'Paying clearance fees... jk...',
  'Teaching AI to spit bars...',
  'Searching for the perfect beat...',
  'Dropping the mic (virtually)...',
];

/**
 * Refined Music Player UI Component
 *
 * Perfected matte aesthetic based on user feedback.
 */
export function MusicPlayer({ className, shareUrl: propShareUrl }: MusicPlayerProps) {
  // Using specific selectors to prevent unnecessary re-renders
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isGenerating = usePlayerStore((state) => state.isGenerating);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const isExpanded = usePlayerStore((state) => state.isExpanded);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleExpanded = usePlayerStore((state) => state.toggleExpanded);
  const stopPlayback = usePlayerStore((state) => state.stop);

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isDownloading, setIsDownloading] = useState(false);

  // Memoize slider value array. Using a larger precision (0.1) to avoid constant snapping loops.
  const sliderValue = useMemo(() => [currentTime], [currentTime]);

  // Sync mute state locally for UI
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

  const formatTime = (time: number) => {
    if (Number.isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeShareUrl = propShareUrl || (currentSong ? `${window.location.origin}/songs/${currentSong.id}` : '');

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

  // Visibility logic: Visible if we have a song OR we are generating (initial state)
  const isVisible = !!currentSong || isGenerating;
  if (!isVisible) return null;

  // State Logic Detail:
  // - Show pure "Generating" UI ONLY if we have no song yet.
  // - If we have a song (audioUrl), show controls immediately, even if isGenerating is still true (cover/metadata still polling).
  const isMusicReady = !!currentSong?.audioUrl;
  const showGeneratingUI = isGenerating && !isMusicReady;
  const isCoverStillLoading = isGenerating && isMusicReady;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          'fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-4 pointer-events-none',
          className
        )}
      >
        <motion.div
          layout
          className={cn(
            'mx-auto pointer-events-auto relative overflow-hidden transition-all duration-500 rounded-[32px] border border-white/5 bg-[#4A4A4A] shadow-2xl',
            isExpanded ? 'w-full py-4 px-6 md:px-8' : 'w-[220px] h-14 px-3 flex items-center justify-center'
          )}
        >
          {isExpanded ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {/* Left Side: Song Info */}
                <div className={cn(
                  "flex items-center gap-4 min-w-0 transition-all duration-300",
                  showGeneratingUI ? "max-w-[50%]" : "max-w-[35%]"
                )}>
                  <div
                    className={cn(
                      'size-14 rounded-xl overflow-hidden bg-zinc-800 border border-white/5 shadow-lg flex items-center justify-center shrink-0',
                      (showGeneratingUI || isCoverStillLoading) && 'animate-pulse'
                    )}
                  >
                    {currentSong?.coverImageUrl ? (
                      <img src={currentSong.coverImageUrl} alt={currentSong.title} className="size-full object-cover" />
                    ) : showGeneratingUI || isCoverStillLoading ? (
                      <div className="size-full bg-linear-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white/40">
                        <Loader2 className="size-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="relative size-full group font-bold">
                        <img src="/images/funny-censored-fallback.png" alt="Censored" className="size-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <span className="text-[6px] text-white text-center leading-tight uppercase">Too Spicy for AI</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className={cn(
                      "text-white font-bold text-base leading-normal pb-1",
                      !showGeneratingUI && "truncate"
                    )}>
                      {showGeneratingUI ? (
                        <div className="flex items-center gap-2">
                          <LoadingTicker
                            messages={FUNNY_LOADING_MESSAGES}
                            className="font-bold font-mono tracking-wider animate-pulse text-indigo-300 whitespace-nowrap"
                          />
                        </div>
                      ) : (
                        currentSong?.title
                      )}
                    </h4>
                    <p className="text-white/50 text-xs truncate mt-0.5">
                      {showGeneratingUI ? 'Generating music & lyrics' : currentSong?.artist || 'AI Generated'}
                    </p>
                  </div>
                </div>

                {/* Center: Playback Controls */}
                <div className="flex-1 flex items-center justify-center gap-3">
                  {!showGeneratingUI && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:flex size-9 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <SkipBack className="size-5 fill-current" />
                      </Button>

                      <Button
                        size="icon"
                        onClick={togglePlay}
                        className="size-11 rounded-full bg-white text-zinc-800 hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all shadow-lg"
                      >
                        {isPlaying ? (
                          <Pause className="size-6 fill-current" />
                        ) : (
                          <Play className="size-6 fill-current ml-0.5" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:flex size-9 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <SkipForward className="size-5 fill-current" />
                      </Button>
                    </>
                  )}
                  {showGeneratingUI && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                      <Sparkles className="size-4 text-white/60 animate-pulse" />
                      <span className="text-xs font-bold text-white/60 tracking-wider">Cooking... (~1 min)</span>
                    </div>
                  )}
                  {isCoverStillLoading && !showGeneratingUI && (
                    <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                      <Loader2 className="size-3 text-white/40 animate-spin" />
                      <span className="text-[10px] font-bold text-white/40 tracking-wider">Cooking Cover...</span>
                    </div>
                  )}
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-1.5 min-w-0 justify-end">
                  <div className="hidden md:flex items-center gap-1 pr-3 mr-3 border-r border-white/5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      disabled={!currentSong?.audioUrl || isDownloading}
                      className="size-9 rounded-full text-white/40 hover:text-white hover:bg-white/5"
                    >
                      {isDownloading ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="size-9 rounded-full text-white/40 hover:text-white hover:bg-white/5"
                    >
                      {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (!activeShareUrl) {
                          toast.error('No share link available');
                          return;
                        }
                        try {
                          await navigator.clipboard.writeText(activeShareUrl);
                          toast.success('Link copied to clipboard!');
                        } catch (err) {
                          console.error('Failed to copy:', err);
                          toast.error('Failed to copy link');
                        }
                      }}
                      className="size-9 rounded-full text-white/40 hover:text-white hover:bg-white/5"
                    >
                      <Share2 className="size-5" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleExpanded}
                    className="size-9 rounded-full text-white/40 hover:text-white hover:bg-white/5"
                  >
                    <Minimize2 className="size-5" />
                  </Button>
                </div>
              </div>

              {/* Bottom: Progress Bar / Generation Status */}
              <div className="flex flex-col gap-2 mt-1">
                {showGeneratingUI ? (
                  <div className="flex items-center gap-4 px-1">
                    <span className="text-[11px] font-mono text-white/10 tabular-nums min-w-[35px] text-right">
                      0:00
                    </span>
                    <div className="flex-1 relative h-6 flex items-center">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "95%" }}
                          transition={{ duration: 45, ease: "linear" }}
                          className="absolute inset-y-0 left-0 bg-linear-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 rounded-full"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-white/10 tabular-nums min-w-[35px]">
                      1:00
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 group px-1">
                    <span className="text-[11px] font-mono text-white/30 tabular-nums min-w-[35px] text-right">
                      {formatTime(currentTime)}
                    </span>
                    <div className="flex-1 relative h-6 flex items-center">
                      <Slider
                        value={sliderValue}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={(val) => setCurrentTime(val[0])}
                        className="z-10 cursor-pointer"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-white/30 tabular-nums min-w-[35px]">
                      {formatTime(duration)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // MINIMIZED MODE: Compact floating pill
            <div className="flex items-center justify-between w-full h-full cursor-pointer" onClick={toggleExpanded}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'size-8 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5',
                    isGenerating && 'animate-pulse'
                  )}
                >
                  {isGenerating ? (
                    <Loader2 className="size-4 animate-spin text-white/40" />
                  ) : currentSong?.coverImageUrl ? (
                    <img src={currentSong.coverImageUrl} alt={currentSong.title} className="size-full object-cover" />
                  ) : (
                    <img src="/images/funny-censored-fallback.png" alt="Censored" className="size-full object-cover" />
                  )}
                </div>
                <span className="text-xs font-bold text-white/80 tracking-tight truncate max-w-[80px]">
                  {isGenerating ? 'Cooking...' : currentSong?.title || 'Player'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {!isGenerating && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full text-white/40 hover:text-white hover:bg-white/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="size-4 fill-current" />
                    ) : (
                      <Play className="size-4 fill-current ml-0.5" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded();
                  }}
                  className="size-8 rounded-full text-white/40 hover:text-white hover:bg-white/5"
                >
                  <Maximize2 className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
