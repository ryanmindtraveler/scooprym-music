'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cleanLyricsForDisplay } from '@/lib/lyrics-utils';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, Mic2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BeatPad } from '../immersive/beat-pad';
import { SpectrumLoader } from '../immersive/spectrum-loader';
import { HeaderPlayer } from './header-player';

// Re-using the props interface (simplified or adapted if needed)
export interface LyricsStageViewProps {
  lyrics: string;
  setLyrics: (value: string) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  musicLyricsSnapshot: string | null;
  hasUnsavedLyricsChanges: boolean;
  setHasUnsavedLyricsChanges: (value: boolean) => void;
  // Processing status might be less relevant here if handled by Queue, but keeping for "Current Song" status
  processingStatus: string | null;
  handleRegenerateAudio: () => void;
  musicLoading: boolean;
  handleRewriteLyrics: () => void;
  isRewriting: boolean;
  setSelectionRange: (range: { start: number; end: number } | null) => void;
  selectionRange: { start: number; end: number } | null;
  newsSummary?: string;
  musicUrl: string | null;
  songTitle: string | null;
  newsContent?: string;
  newsLink?: string;
  headerControls?: React.ReactNode;
  songId: string | null;
  coverImageUrl?: string | null;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function LyricsStageView({
  lyrics,
  setLyrics,
  isEditing,
  setIsEditing,
  musicLyricsSnapshot,
  hasUnsavedLyricsChanges,
  setHasUnsavedLyricsChanges,
  processingStatus,
  handleRegenerateAudio,
  musicLoading,
  handleRewriteLyrics,
  isRewriting,
  setSelectionRange,
  selectionRange,
  newsSummary,
  musicUrl,
  songTitle,
  newsContent,
  newsLink,
  headerControls,
  songId,
  coverImageUrl,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: LyricsStageViewProps) {
  // Logic: Show overlay (BeatPad) when:
  const showOverlay = (!musicUrl && musicLoading) || (musicLoading && processingStatus === 'processing');

  const { currentSong, isPlaying } = usePlayerStore();
  const isPlayingThisSong = isPlaying && currentSong?.id === songId;

  // Auto-exit edit mode when playback starts
  useEffect(() => {
    if (isPlayingThisSong && isEditing) {
      setIsEditing(false);
    }
  }, [isPlayingThisSong, isEditing, setIsEditing]);

  // Context Song for Playback
  const contextSong = useMemo(() => {
    if (!musicUrl || !songId) return null;
    return {
      id: songId,
      audioUrl: musicUrl,
      title: songTitle || 'New Creation',
      coverImageUrl:
        coverImageUrl || (currentSong?.id === songId ? (currentSong?.coverImageUrl ?? undefined) : undefined),
    };
  }, [musicUrl, songId, songTitle, currentSong, coverImageUrl]);

  // Fallback chain: AI Summary -> User Text -> User URL (Props > PlayerStore)
  const displaySummary =
    newsSummary ||
    currentSong?.newsSummary ||
    newsContent ||
    currentSong?.newsContent ||
    newsLink ||
    currentSong?.newsLink;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* === Main Content Area (Background Layer) === */}
      <div className="absolute inset-0 z-0 flex flex-col h-full w-full">
        {/* Overlay for BeatPad (Processing) */}
        {showOverlay && (
          <div className="absolute inset-0 z-50 overflow-hidden flex flex-col items-center justify-center bg-transparent pointer-events-none pb-24">
            <div className="relative z-30 mb-8 animate-in zoom-in-50 fade-in duration-700">
              <SpectrumLoader className="scale-125" />
            </div>
            <div className="absolute bottom-6 z-30 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-300">
              <BeatPad />
            </div>
          </div>
        )}

        {lyrics ? (
          <div className="relative flex-1 h-full flex flex-col transition-all duration-1000 opacity-100 group/lyrics-container">
            {/* Lyrics Scroll Area */}
            <div className="flex-1 relative overflow-hidden h-full">
              {isEditing ? (
                <Textarea
                  value={lyrics}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLyrics(value);
                    if (musicLyricsSnapshot) {
                      setHasUnsavedLyricsChanges(value.trim() !== musicLyricsSnapshot);
                    }
                  }}
                  onSelect={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    if (target.selectionStart !== target.selectionEnd) {
                      setSelectionRange({ start: target.selectionStart, end: target.selectionEnd });
                    } else {
                      setSelectionRange(null);
                    }
                  }}
                  placeholder="Type your lyrics here..."
                  className="h-full w-full overflow-y-auto resize-none font-sans text-xl md:text-2xl font-bold leading-relaxed tracking-wide bg-transparent border-0 focus:bg-white/50 dark:focus:bg-black/40 transition-colors duration-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400/50 px-8 pt-36 pb-48 outline-none caret-indigo-500 selection:bg-indigo-500/30"
                />
              ) : (
                <FormattedLyricsView lyrics={lyrics} />
              )}

              {/* Rewrite Button */}
              {selectionRange && isEditing && (
                <div className="absolute bottom-24 right-6 z-40 animate-in zoom-in-90 fade-in duration-300">
                  <Button
                    size="sm"
                    onClick={handleRewriteLyrics}
                    disabled={isRewriting}
                    className="shadow-2xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 backdrop-blur-md border border-white/10 hover:scale-105 transition-all rounded-full px-5 h-9"
                  >
                    {isRewriting ? (
                      <Loader2 className="mr-2 size-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 size-3" />
                    )}
                    Rewrite
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center opacity-50 pt-20">
            <Mic2 className="size-12 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-bold text-slate-400">Ready to Create</p>
          </div>
        )}
      </div>

      {/* === UNIFIED HEADER AREA (Foreground Layer) === */}
      <div className="absolute top-0 inset-x-0 z-20 flex justify-between items-start px-6 pt-6 pb-12 gap-6 bg-linear-to-b from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 pointer-events-none">
        {/* LEFT COLUMN */}
        <div className="flex items-center gap-6 max-w-[70%] pointer-events-auto">
          {/* Visual Anchor */}
          <div
            className={cn(
              'flex items-center justify-center size-24 rounded-2xl text-white shadow-xl shadow-indigo-500/20 ring-1 ring-black/5 dark:ring-white/10 shrink-0 overflow-hidden relative group',
              coverImageUrl ? 'bg-slate-100 dark:bg-slate-800' : 'bg-indigo-600'
            )}
          >
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt="Cover"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              // Frontend Fallback for missing covers
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/images/funny-censored-fallback.png"
                alt="Fallback Cover"
                className="size-full object-cover opacity-80"
              />
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center gap-1.5 min-w-0">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight drop-shadow-sm line-clamp-1 py-0.5">
              {songTitle || 'New Creation'}
            </h2>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 max-w-xl">
                {displaySummary || <span className="opacity-50 italic">No context available</span>}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col items-end gap-3 shrink-0 pointer-events-auto">
          <div className="h-10 w-px" />
          <div className="flex items-center gap-3 pt-1">
            <AnimatePresence>
              {isEditing && musicLyricsSnapshot && hasUnsavedLyricsChanges && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    size="sm"
                    onClick={handleRegenerateAudio}
                    disabled={musicLoading}
                    className="h-8 px-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  >
                    Regenerate
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2.5 bg-slate-100/80 dark:bg-white/5 p-1.5 pr-2.5 rounded-full border border-slate-200/50 dark:border-white/10 backdrop-blur-sm shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Edit</span>
              <Switch
                checked={isEditing}
                onCheckedChange={setIsEditing}
                disabled={!lyrics || musicLoading}
                className="data-[state=checked]:bg-indigo-600 scale-90"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 z-30 pb-0 pt-12 bg-linear-to-t from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 pointer-events-none">
        {processingStatus === 'failed' ? (
          <div className="w-full py-6 px-6 flex items-center justify-center pointer-events-auto bg-red-50/50 dark:bg-red-900/10 backdrop-blur-sm border-t border-red-100 dark:border-red-900/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-red-500" />
              <p className="text-sm font-bold text-red-800 dark:text-red-300 tracking-wide uppercase">
                Generation Failed
              </p>
            </div>
          </div>
        ) : (
          <HeaderPlayer
            variant="footer"
            className="w-full pointer-events-auto"
            contextSong={contextSong ?? undefined}
            onPrevious={onPrevious}
            onNext={onNext}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
          />
        )}
      </div>
    </div>
  );
}

/**
 * FormattedLyricsView (Cinematic Lyrics Overhaul)
 * Implements:
 * - Ambient Cover Motion Background
 * - Cinematic "Focus Lens" (Depth of Field)
 * - Smooth Heuristic Progress-Based Auto-Scroll
 */
function FormattedLyricsView({ lyrics }: { lyrics: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  // Player state for sync
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);

  // Interaction State: Pause auto-scroll when user is interacting
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Split lines into structured segments
  const displayLines = useMemo(() => {
    if (!lyrics) return [];

    // Use shared utility for consistent cleaning across app
    const cleanText = cleanLyricsForDisplay(lyrics);

    return cleanText
      .replace(/\[(.*?)\]/g, '\n[$1]\n')
      .replace(/([,，])\s*/g, '$1\n')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line !== '');
  }, [lyrics]);

  // Track parent scroll position and center point for children to calculate focus efficiently
  const [parentScrollPos, setParentScrollPos] = useState(0);
  const [containerCenter, setContainerCenter] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setParentScrollPos(containerRef.current.scrollTop);
      }
    };

    const updateCenter = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerCenter(rect.top + rect.height / 2);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      updateCenter();
      window.addEventListener('resize', updateCenter);

      // Robust Resize Observer for layout shifts (Sidebar, Keyboard)
      const resizeObserver = new ResizeObserver(() => {
        updateCenter();
        handleScroll(); // Re-read scroll pos
      });
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', updateCenter);
        resizeObserver.disconnect();
      };
    }
    return () => {};
  }, []);

  // Handle Heuristic Auto-Scroll: Map currentTime percentage to scroll position
  useEffect(() => {
    // Only auto-scroll if playing, duration is valid, and user is NOT interacting
    if (!isPlaying || !duration || duration <= 0 || !containerRef.current || !scrollContentRef.current || isInteracting)
      return;

    const progress = currentTime / duration;
    const contentHeight = scrollContentRef.current.scrollHeight;
    const viewportHeight = containerRef.current.clientHeight;

    // We want the total scroll range to cover from start to end
    // adding some buffer so the last lines don't stay at the very top
    const maxScroll = contentHeight - viewportHeight / 2;
    const targetScroll = progress * maxScroll;

    containerRef.current.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  }, [currentTime, duration, isPlaying, isInteracting]);

  // Interaction logic: Detect user action and pause auto-sync
  const handleUserInteraction = () => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 4000); // Resume auto-scroll after 4 seconds of inactivity
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-[24px]"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => {
        // Only resume if not currently interacting via scroll
        if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
        interactionTimeoutRef.current = setTimeout(() => setIsInteracting(false), 2000);
      }}
      onWheel={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {/* 1. AMBIENT COVER MOTION BACKGROUND */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSong?.coverImageUrl || 'default'}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 0.15, scale: 1.1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          {currentSong?.coverImageUrl ? (
            <motion.img
              src={currentSong.coverImageUrl}
              alt=""
              className="w-full h-full object-cover blur-[100px]"
              animate={{
                rotate: [0, 8, 0, -8, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{
                duration: 60,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-[80px]" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 2. CINEMATIC GRADIENT MASK (Soft Edge Mask) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 10%, transparent 90%, transparent 100%)',
          boxShadow: 'inset 0 0 150px rgba(0,0,0,0.02)',
        }}
      />

      {/* 3. SCROLLABLE CONTENT */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto px-6 md:px-12 scrollbar-hidden relative z-10 select-none"
      >
        <div ref={scrollContentRef} className="flex flex-col items-center pt-36 pb-48 w-full">
          {displayLines.map((line, index) => (
            <LyricLine
              key={`${index}-${line}`}
              line={line}
              parentScrollPos={parentScrollPos}
              containerCenter={containerCenter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * LyricLine: Individual line with Focus Lens / Depth-of-Field Logic
 * Optimized: Uses props for calculation instead of own scroll listener
 */
function LyricLine({
  line,
  parentScrollPos,
  containerCenter,
}: {
  line: string;
  parentScrollPos: number;
  containerCenter: number;
}) {
  const lineRef = useRef<HTMLDivElement>(null);

  // Local state for focus metrics (Removed Blur)
  const [metrics, setMetrics] = useState({ opacity: 0.15, scale: 0.9, isBold: false });

  useEffect(() => {
    if (!lineRef.current || containerCenter === 0) return;

    // Efficient focus calculation: calculate distance to viewport center
    const rect = lineRef.current.getBoundingClientRect();
    const lineCenter = rect.top + rect.height / 2;
    const distance = Math.abs(lineCenter - containerCenter);

    const maxFocusRange = 400; // Visible reach
    const t = Math.min(distance / maxFocusRange, 1);
    const intensity = 1 - t ** 1.8; // Adjusted curve for smoother drop-off

    setMetrics({
      opacity: 0.08 + intensity * 0.92,
      scale: 0.88 + intensity * 0.12,
      isBold: intensity > 0.82,
    });
  }, [parentScrollPos, containerCenter]);

  const trimmedLine = line.trim();
  const isSectionHeader = /^\[.*\]$/.test(trimmedLine);

  if (isSectionHeader) {
    return (
      <div
        ref={lineRef}
        className="mt-20 mb-10 transition-all duration-1000 select-none"
        style={{
          opacity: metrics.opacity * 0.7,
          scale: metrics.scale,
        }}
      >
        <span className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] border border-indigo-500/20 backdrop-blur-md">
          {trimmedLine.slice(1, -1)}
        </span>
      </div>
    );
  }

  return (
    <motion.p
      ref={lineRef}
      animate={{
        opacity: metrics.opacity,
        scale: metrics.scale,
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 30 }}
      className={cn(
        'text-xl leading-relaxed tracking-wide font-sans w-full max-w-2xl mx-auto px-4 mb-6 wrap-break-word text-center transition-all duration-700',
        metrics.isBold ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-400 dark:text-slate-600'
      )}
    >
      {line}
    </motion.p>
  );
}
