'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePlayerStore } from '@/store/player-store';
import { Loader2, Mic2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
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
  // Logic: Show overlay ONLY if generating AND music is not ready yet.
  // Logic: Show overlay (Spectrum/BeatPad) by default (waiting mode) OR when generating. Only hide when music is ready.
  const showOverlay = !musicUrl;

  return (
    // Functional Soft Glass Card: consistent with control form
    <Card className="p-8 flex h-full flex-col shadow-2xl shadow-indigo-500/10 bg-white/80 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-white/10 backdrop-blur-3xl rounded-[32px]">
      {/* === 顶部标题栏 === */}
      <div className="flex items-center pb-4 border-b border-purple-100/50 dark:border-white/5 mb-2">
        <div className="flex items-center gap-4">
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
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 truncate max-w-md">
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
        <div className="mb-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">Story Summary</h4>
          <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">{newsSummary}</p>
        </div>
      )}

      {/* === 歌词内容显示区域 === */}
      <div className="flex flex-col flex-1 min-h-[300px] overflow-hidden relative">
        {/* === IMMERSIVE GENERATION OVERLAY (V2 & V3 Redesign) === */}
        {/* Shows BeatPad during music generation */}
        {showOverlay && (
          <div className="absolute inset-0 z-50 overflow-hidden flex flex-col items-center justify-center bg-transparent pointer-events-none">
            {/* Scanning Beam & Animations - REMOVED per user request */}

            {/* Center Stage: Empty for now (Visuals removed) */}
            {/* <div className="relative z-30 mb-10 ..."><SpectrumLoader /></div> */}

            {/* Bottom Stage: Beat Pad (Interactive) */}
            <div className="absolute bottom-8 z-30 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-500">
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
                className="h-full w-full overflow-y-auto resize-none font-sans text-xl font-medium leading-relaxed tracking-wide bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 backdrop-blur-xl focus:bg-white/60 dark:focus:bg-black/40 focus:border-indigo-500/50 focus:ring-0 transition-all duration-300 text-slate-800 dark:text-slate-100 placeholder:text-slate-400/70 p-8 rounded-3xl outline-none caret-indigo-500 selection:bg-indigo-500/20"
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
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center text-indigo-400/80 border-2 border-dashed border-purple-200 dark:border-zinc-800 rounded-2xl bg-purple-50/30 dark:bg-zinc-900/30 p-10">
            <div className="size-20 rounded-full bg-white/50 dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-white/50 dark:border-zinc-700">
              <Mic2 className="size-9 opacity-50 text-violet-400" />
            </div>
            <p className="font-medium text-lg max-w-sm text-indigo-400/80 dark:text-slate-400">
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
 * Update: Keeps auto-scroll for approximate sync, but removes specific line highlighting per user request.
 */
function FormattedLyricsView({ lyrics }: { lyrics: string }) {
  const { currentTime, duration, isPlaying } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLElement | null)[]>([]);

  // 1. 预处理歌词行，过滤掉空行，以便准确计算进度分布
  const displayLines = useMemo(() => {
    return lyrics.split('\n').filter((line) => line.trim() !== '');
  }, [lyrics]);

  // 2. 计算当前激活行 (基于线性插值估算)
  // 假设歌词均匀分布在歌曲时长中 (简单但对于 AI 生成的规则结构通常有效)
  const activeIndex = useMemo(() => {
    if (!duration || duration <= 0 || !isPlaying) return -1;

    // 优化同步算法：假设 10% 主要是前奏，10% 是尾奏
    const introPadding = duration * 0.1;
    const outroPadding = duration * 0.1;
    const sungDuration = duration - introPadding - outroPadding;

    // 计算在 "演唱区间" 内的进度
    let progress = (currentTime - introPadding) / sungDuration;

    // 边界限制
    progress = Math.max(0, Math.min(1, progress));

    // 映射到行索引
    const index = Math.floor(progress * displayLines.length);
    return Math.min(index, displayLines.length - 1);
  }, [currentTime, duration, isPlaying, displayLines.length]);

  // 3. 自动滚动逻辑
  useEffect(() => {
    if (activeIndex >= 0 && lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // 始终居中
      });
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto p-6 bg-transparent text-center scrollbar-hidden relative" // 隐藏默认滚动条以获得更沉浸体验 (或保留 thin)
      style={{
        // 增强遮罩效果，聚焦中间区域
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
      }}
    >
      <div className="space-y-6 py-12">
        {' '}
        {/* Slightly reduced spacing for better density */}
        {displayLines.map((line, index) => {
          const trimmedLine = line.trim();
          const setRef = (el: HTMLElement | null) => {
            lineRefs.current[index] = el;
          };

          // 识别段落标题 [Chorus] 等
          const isSectionHeader = /^\[.*\]$/.test(trimmedLine);

          if (isSectionHeader) {
            return (
              <div
                key={index}
                ref={setRef}
                className="transition-all duration-700 ease-out transform opacity-90"
              >
                <div className="inline-block px-3 py-1 rounded-full bg-indigo-50/50 dark:bg-white/5 border border-indigo-100/50 dark:border-white/10 backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 select-none">
                    {trimmedLine.slice(1, -1)}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <p
              key={index}
              ref={setRef}
              className="text-xl font-bold leading-relaxed tracking-wide font-sans py-3 text-indigo-950/80 dark:text-zinc-100/90 transition-opacity duration-500"
            >
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}
