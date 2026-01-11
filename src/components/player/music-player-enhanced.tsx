'use client';

import { usePlayerStore } from '@/store';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Share2,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export function MusicPlayerEnhanced() {
  const { isPlaying, currentSong, togglePlay, setDuration, setCurrentTime: setStoreTime } = usePlayerStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setLocalDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Visualizer State
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(20).fill(4));

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  // Handle song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentSong?.audioUrl) {
      if (audio.src !== currentSong.audioUrl) {
        audio.src = currentSong.audioUrl;
        audio.load();
        if (isPlaying) {
          audio.play().catch(() => togglePlay());
        }
      }
    }
  }, [currentSong, isPlaying, togglePlay]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch(() => {
          // Handle autoplay restrictions
          togglePlay();
        });
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, togglePlay]);

  // Handle visualizer animation
  useEffect(() => {
    if (!isPlaying) {
      setVisualizerBars(Array(20).fill(4));
      return;
    }

    const interval = setInterval(() => {
      setVisualizerBars(
        Array(20)
          .fill(0)
          .map(() => Math.random() * 20 + 4)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!Number.isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
        setStoreTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (!Number.isNaN(audio.duration)) {
        setLocalDuration(audio.duration);
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      // Playlist logic not implemented in store yet
      // playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setDuration, setStoreTime]);

  // Handle volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const toggleMute = () => setIsMuted(!isMuted);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const handleDownload = async () => {
    if (!currentSong?.audioUrl) return;

    try {
      setIsDownloading(true);
      const response = await fetch(currentSong.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSong.title || 'song'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started!');
    } catch (error) {
      toast.error('Failed to download song');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!currentSong) return null;

  const isGenerating = !currentSong.audioUrl;
  const showGeneratingUI = isGenerating;
  const isCoverStillLoading = !currentSong.coverImageUrl && currentSong.audioUrl;

  const activeShareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/${currentSong.id}` : '';

  // Used for slider value to avoid jumping
  const sliderValue = [currentTime];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none"
      >
        <motion.div
          layout
          className={cn(
            'mx-auto pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50',
            isExpanded
              ? 'w-[95%] max-w-4xl rounded-[2rem] p-4 sm:p-5'
              : 'w-auto max-w-[90%] rounded-full p-2 pr-4 h-[64px]'
          )}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {isExpanded ? (
            <div className="flex flex-col gap-4">
              {/* Top Row: Track Info & Controls */}
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Left: Cover & Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1 sm:flex-none sm:w-[30%]">
                  <div className="relative shrink-0 group">
                    <div
                      className={cn(
                        'size-14 sm:size-16 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden shadow-lg border border-white/5 relative',
                        (isPlaying || isGenerating) && 'animate-pulse-slow' // Custom pulse definition or just assume pulse
                      )}
                    >
                      {currentSong.coverImageUrl ? (
                        <img
                          src={currentSong.coverImageUrl}
                          alt={currentSong.title}
                          className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-zinc-900">
                          {isGenerating ? (
                            <Loader2 className="size-6 text-purple-500 animate-spin" />
                          ) : (
                            <Sparkles className="size-6 text-zinc-700" />
                          )}
                        </div>
                      )}

                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        {isGenerating ? null : (
                          <div className="text-[10px] text-white font-bold tracking-wider uppercase">View</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white truncate text-sm sm:text-base leading-tight">
                      {currentSong.title || (isGenerating ? 'Creating masterpiece...' : 'Untitled Track')}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50 truncate font-medium">
                      {showGeneratingUI ? 'Generating music & lyrics' : currentSong.artist || 'AI Generated'}
                    </p>
                  </div>
                </div>

                {/* Center: Playback Controls & Visualizer */}
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center justify-center gap-3">
                    {!showGeneratingUI && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => console.log('Previous not implemented')} // assuming playPrevious exists or just stub
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
                          onClick={() => console.log('Next not implemented')} // assuming playNext exists
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
                  </div>

                  {/* Visualizer Bars */}
                  {!showGeneratingUI && (
                    <div className="hidden lg:flex items-center gap-0.5 h-4">
                      {visualizerBars.map((height, index) => (
                        <motion.div
                          key={index}
                          className="w-1 bg-gradient-to-t from-purple-500/50 to-pink-500/50 rounded-full"
                          style={{ height: `${Math.max(height * 0.3, 2)}px` }}
                          animate={{ height: `${Math.max(height * 0.3, 2)}px` }}
                          transition={{ duration: 0.1 }}
                        />
                      ))}
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
                      disabled={!currentSong.audioUrl || isDownloading}
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
                      onClick={() => {
                        navigator.clipboard.writeText(activeShareUrl);
                        toast.success('Link copied!');
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

              {/* Bottom: Progress Bar (Expanded Only) */}
              {!showGeneratingUI && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-4 group px-1">
                    <span className="text-[11px] font-mono text-white/30 tabular-nums min-w-[35px] text-right">
                      {formatTime(currentTime)}
                    </span>
                    <div className="flex-1 relative h-6 flex items-center">
                      <Slider
                        value={sliderValue}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={(val) => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = val[0];
                            setCurrentTime(val[0]);
                          }
                        }}
                        className="z-10 cursor-pointer"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-white/30 tabular-nums min-w-[35px]">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>
              )}
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
                  ) : currentSong.coverImageUrl ? (
                    <img src={currentSong.coverImageUrl} alt={currentSong.title} className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-zinc-800" />
                  )}
                </div>
                <span className="text-xs font-bold text-white/80 tracking-tight truncate max-w-[80px]">
                  {isGenerating ? 'Cooking...' : currentSong.title || 'Player'}
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

function formatTime(seconds: number) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
