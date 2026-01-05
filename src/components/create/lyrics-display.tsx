'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mic2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BeatPad } from './immersive/beat-pad';
import { SpectrumLoader } from './immersive/spectrum-loader';

// 定义组件的 Props 接口
interface LyricsDisplayProps {
  lyrics: string; // 当前显示的歌词内容
  setLyrics: (value: string) => void; // 更新歌词的方法
  isEditing: boolean; // 是否处于编辑模式
  setIsEditing: (value: boolean) => void; // 切换编辑模式的方法
  musicLyricsSnapshot: string | null; // 歌词快照（用于对比是否发生修改）
  hasUnsavedLyricsChanges: boolean; // 标记是否有未保存/未重新生成的歌词修改
  setHasUnsavedLyricsChanges: (value: boolean) => void;
  processingStatus: string | null; // 后端处理状态 ('processing', 'completed', 'failed' 等)
  handleRegenerateAudio: () => void; // 触发重新生成音频的方法
  musicLoading: boolean; // 音频是否正在加载/生成中
  handleRewriteLyrics: () => void; // 触发重写选中歌词的方法
  isRewriting: boolean; // 是否正在进行 AI 重写
  setSelectionRange: (range: { start: number; end: number } | null) => void; // 设置文本选择范围
  selectionRange: { start: number; end: number } | null; // 当前选中的文本范围
  newsSummary?: string; // 新增：新闻摘要
  musicUrl: string | null; // Generated Audio URL (used to hide overlay when ready)
  songTitle: string | null; // Song Title to display in header
}

export function LyricsDisplay({
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
  newsSummary, // 解构
  musicUrl,
  songTitle,
}: LyricsDisplayProps) {
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  // Logic: Show overlay (BeatPad) when:
  // 1. Initial State (!musicUrl)
  // 2. Generating New Song (musicLoading) - User wants it to "kill time"
  // HIDE during playback (isPlaying) to focus on lyrics, as requested.
  const showOverlay = !musicUrl || musicLoading;

  return (
    // Functional Soft Glass Card: consistent with control form
    <Card className="p-5 flex h-full flex-col shadow-2xl shadow-indigo-500/10 bg-white/80 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-white/10 backdrop-blur-3xl rounded-[32px]">
      {/* === 顶部标题栏 === */}
      <div className="flex items-center pb-2 border-b border-purple-100/50 dark:border-white/5 mb-1">
        <div className="flex items-center gap-3">
          {/* 图标 - 改为柔和的品牌色玻璃质感 */}
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
            <Mic2 className="size-5" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-indigo-950 dark:text-indigo-50">Lyrics</h3>

          {/* === 状态指示器 === */}
          {/* 如果有状态且不是 completed，显示状态标签 */}
          {processingStatus && processingStatus !== 'completed' && (
            <div className="ml-2 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
              {/* 状态圆点：根据不同状态显示不同颜色和动画 */}
              <div
                className={`size-2 rounded-full ${
                  processingStatus === 'processing'
                    ? 'bg-indigo-500 animate-pulse'
                    : processingStatus === 'generating_cover'
                      ? 'bg-violet-500 animate-pulse'
                      : 'bg-red-500' /* 失败 */
                }`}
              />
              <span>
                {processingStatus === 'processing' && 'Processing...'}
                {processingStatus === 'generating_cover' && 'Generating cover...'}
                {processingStatus === 'failed' && 'Processing failed'}
              </span>
            </div>
          )}

          {/* === 重新生成音频按钮 (仅在编辑模式且有修改时显示 === */}
          {isEditing && musicLyricsSnapshot && hasUnsavedLyricsChanges ? (
            <Button
              size="sm"
              onClick={handleRegenerateAudio}
              disabled={musicLoading}
              className="ml-3 h-9 px-4 text-xs font-bold uppercase tracking-wider text-white bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all rounded-full border border-white/10"
            >
              <Sparkles className="mr-1.5 size-3.5 fill-white/20 animate-pulse" />
              Regenerate Audio
            </Button>
          ) : null}
        </div>

        {/* === Song Title Display (Center) === */}
        {songTitle && (
          <div className="flex-1 flex justify-center px-4 overflow-hidden">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 truncate max-w-md drop-shadow-sm">
              {songTitle}
            </h2>
          </div>
        )}

        {/* === 编辑模式开关 === */}
        <div className="ml-auto flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          <span>Edit Mode</span>
          <Switch
            checked={isEditing}
            onCheckedChange={setIsEditing}
            disabled={!lyrics || musicLoading}
            aria-label="Edit Lyrics"
            className="data-[state=checked]:bg-indigo-600"
          />
        </div>
      </div>

      {/* === 摘要显示区域 (新增) === */}
      {newsSummary && (
        <div className="mb-2 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-0.5">News Background</h4>
          <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">{newsSummary}</p>
        </div>
      )}

      {/* === 歌词内容显示区域 === */}
      <div className="flex flex-col flex-1 min-h-[300px] overflow-hidden relative">
        {/* === IMMERSIVE GENERATION OVERLAY (V2 & V3 Redesign) === */}
        {/* Shows BeatPad during music generation */}
        {showOverlay && (
          <div className="absolute inset-0 z-50 overflow-hidden flex flex-col items-center justify-center bg-transparent pointer-events-none pb-24">
            {/* Center Stage: Spectrum Visualizer */}
            <div className="relative z-30 mb-8 animate-in zoom-in-50 fade-in duration-700">
               <SpectrumLoader className="scale-125" />
            </div>

            {/* Bottom Stage: Beat Pad (Interactive) */}
            <div className="absolute bottom-6 z-30 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-300">
              <BeatPad />
            </div>
          </div>
        )}

        {lyrics ? (
          // 如果有歌词，根据模式显示
          <div className="relative flex-1 h-full transition-all duration-1000 opacity-100">
            {isEditing ? (
              <Textarea
                value={lyrics}
                onChange={(e) => {
                  const value = e.target.value;
                  setLyrics(value);
                  // 实时比对：如果当前内容与快照不一致，标记为有未保存修改
                  if (musicLyricsSnapshot) {
                    const trimmed = value.trim();
                    setHasUnsavedLyricsChanges(trimmed !== musicLyricsSnapshot);
                  }
                }}
                // 文本选择事件处理：用于捕捉用户选中的文字范围
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  if (target.selectionStart !== target.selectionEnd) {
                    // 如果选中了文字，更新选择范围状态
                    setSelectionRange({
                      start: target.selectionStart,
                      end: target.selectionEnd,
                    });
                  } else {
                    // 如果只是光标移动没选中文字，清空状态
                    setSelectionRange(null);
                  }
                }}
                placeholder="Your generated lyrics will appear here..."
                // Updated to text-2xl font-bold to match view mode perfectly
                className="h-full w-full overflow-y-auto resize-none font-sans text-2xl font-bold leading-relaxed tracking-wide bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 backdrop-blur-xl focus:bg-white/60 dark:focus:bg-black/40 focus:border-indigo-500/50 focus:ring-0 transition-all duration-300 text-slate-800 dark:text-slate-100 placeholder:text-slate-400/70 p-8 rounded-3xl outline-none caret-indigo-500 selection:bg-indigo-500/20"
              />
            ) : (
              <FormattedLyricsView lyrics={lyrics} />
            )}

            {/* === 悬浮重写按钮 === */}
            {/* 仅在编辑模式且选中了文本时显示 */}
            {selectionRange && isEditing && (
              <div className="absolute bottom-6 right-6 z-10 animate-in fade-in slide-in-from-bottom-2">
                <Button
                  size="sm"
                  onClick={handleRewriteLyrics}
                  disabled={isRewriting}
                  className="shadow-xl shadow-indigo-500/10 bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-indigo-100 dark:border-zinc-700 rounded-xl px-5 py-2.5 font-semibold"
                >
                  {isRewriting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 size-4 text-indigo-500" />
                  )}
                  Rewrite Selected
                </Button>
              </div>
            )}
          </div>
        ) : (
          // === 空状态 / 占位符 ===
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center text-indigo-400/80 border-2 border-dashed border-purple-200 dark:border-zinc-800 rounded-2xl bg-purple-50/30 dark:bg-zinc-900/30 p-10">
            <div className="size-24 rounded-full bg-white/50 dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-white/50 dark:border-zinc-700">
              <Mic2 className="size-10 opacity-50 text-violet-400" />
            </div>
            {/* Updated to text-2xl font-bold to match view mode */}
            <p className="font-bold text-2xl max-w-2xl text-indigo-400/80 dark:text-slate-400/80 leading-relaxed">
              Enter news content on the left to start generating your track.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * FormattedLyricsView (格式化歌词视图 - Premium Center Design)
 * 用于在非编辑模式下展示美化后的歌词（居中、渐变遮罩、专辑质感）
 * Updated: Airy Layout + Header Parsing + Large Text (text-2xl)
 */
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
    return lyrics
      .replace(/\[(.*?)\]/g, '\n[$1]\n')
      .replace(/([,，])\s*/g, '$1\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
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
    }

    return () => {
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateCenter);
    };
  }, []);

  // Handle Heuristic Auto-Scroll: Map currentTime percentage to scroll position
  useEffect(() => {
    // Only auto-scroll if playing, duration is valid, and user is NOT interacting
    if (!isPlaying || !duration || duration <= 0 || !containerRef.current || !scrollContentRef.current || isInteracting) return;

    const progress = currentTime / duration;
    const contentHeight = scrollContentRef.current.scrollHeight;
    const viewportHeight = containerRef.current.clientHeight;

    // We want the total scroll range to cover from start to end
    // adding some buffer so the last lines don't stay at the very top
    const maxScroll = contentHeight - (viewportHeight / 2);
    const targetScroll = progress * maxScroll;

    containerRef.current.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
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
           transition={{ duration: 2.5, ease: "easeOut" }}
           className="absolute inset-0 z-0 pointer-events-none"
        >
          {currentSong?.coverImageUrl ? (
            <motion.img
              src={currentSong.coverImageUrl}
              alt=""
              className="w-full h-full object-cover blur-[100px]"
              animate={{
                rotate: [0, 8, 0, -8, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{
                duration: 60,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear"
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
          boxShadow: 'inset 0 0 150px rgba(0,0,0,0.02)'
        }}
      />

      {/* 3. SCROLLABLE CONTENT */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto px-6 md:px-12 scrollbar-hidden relative z-10 select-none pb-20"
      >
        <div ref={scrollContentRef} className="flex flex-col items-center pt-24 pb-12 w-full">
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
function LyricLine({ line, parentScrollPos, containerCenter }: {
  line: string,
  parentScrollPos: number,
  containerCenter: number
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
    const intensity = 1 - (t ** 1.8); // Adjusted curve for smoother drop-off

    setMetrics({
      opacity: 0.08 + (intensity * 0.92),
      scale: 0.88 + (intensity * 0.12),
      isBold: intensity > 0.82
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
          scale: metrics.scale
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
        scale: metrics.scale
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 30 }}
      className={cn(
        "text-xl leading-relaxed tracking-wide font-sans w-full max-w-2xl mx-auto px-4 mb-6 wrap-break-word text-center transition-all duration-700",
        metrics.isBold ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-400 dark:text-slate-600"
      )}
    >
      {line}
    </motion.p>
  );
}
