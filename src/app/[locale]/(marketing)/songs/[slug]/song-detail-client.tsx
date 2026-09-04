'use client';

import { DownloadButton } from '@/components/songs/actions/download-button';
import { LikeButton } from '@/components/songs/actions/like-button';
import { ShareButton } from '@/components/songs/actions/share-button';
import { type SongCommentItem, SongComments } from '@/components/songs/song-comments';
import { Slider } from '@/components/ui/slider';
import { useSongLike } from '@/hooks/songs/use-song-like';
import { useImageColors } from '@/hooks/ui/use-image-colors';
import { LocaleLink } from '@/i18n/navigation';
import { formatBusinessDate } from '@/lib/business-time';
import { cleanLyricsForDisplay } from '@/lib/lyrics-utils';
import { createEngagementSessionId, recordSongEngagement } from '@/lib/song-engagement-client';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { Download, ExternalLink, Heart, Newspaper, NewspaperIcon, Pause, Play, Share2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import type { Song } from '@/types/song';

interface SongDetailClientProps {
  song: Song;
  initialIsFavorite: boolean;
  autoPlay?: boolean;
  searchHeadline: string;
  storyContext: string;
  initialComments: {
    comments: SongCommentItem[];
    total: number;
    totalPages: number;
  };
  viewer: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

const formatTime = (seconds: number | null | undefined) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function SongDetailClient({
  song,
  initialIsFavorite,
  autoPlay = false,
  searchHeadline,
  storyContext,
  initialComments,
  viewer,
}: SongDetailClientProps) {
  const locale = useLocale();
  const tNavbar = useTranslations('Marketing.navbar');

  // Global Player Store
  const { currentSong, isPlaying: globalIsPlaying, togglePlay, play, duration } = usePlayerStore();
  const currentTime = usePlayerStore((state) => state.currentTime);

  const isThisSongPlaying = globalIsPlaying && currentSong?.id === song.id;

  useEffect(() => {
    const sessionId = createEngagementSessionId('detail');
    void recordSongEngagement(song.id, 'detail_view', sessionId).catch(() => {});
  }, [song.id]);

  // Dynamic color extraction from album art
  const { primary, secondary, muted, darkMuted, isLoading: colorsLoading } = useImageColors(song.coverImageUrl);

  // Auto-play logic
  useEffect(() => {
    if (autoPlay && song.audioUrl && song.audioUrl !== 'processing' && currentSong?.id !== song.id) {
      play({
        id: song.id,
        title: song.title,
        audioUrl: song.audioUrl,
        coverImageUrl: song.coverImageUrl,
        artist: 'AI Generated',
        newsSummary: song.newsSummary || undefined,
        newsContent: song.sourceText || undefined,
        newsLink: song.sourceUrl || undefined,
      });
    }
  }, [song.id, autoPlay, song.audioUrl, song.title, song.coverImageUrl, play, currentSong?.id]);

  const { isLiked } = useSongLike({
    songId: song.id,
    initialIsLiked: initialIsFavorite,
  });

  // Handlers
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        newsSummary: song.newsSummary || undefined,
        newsContent: song.sourceText || undefined,
        newsLink: song.sourceUrl || undefined,
      });
    }
  };

  const formattedDate = useMemo(() => {
    try {
      return formatBusinessDate(song.createdAt, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  }, [song.createdAt]);

  return (
    <div className="relative flex w-full flex-col selection:bg-indigo-500/30 bg-slate-50 dark:bg-black no-scrollbar">
      <div className="absolute inset-0 z-0 backdrop-blur-[120px] pointer-events-none" />
      {/* Grain overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

      {/* === IMMERSIVE SPLIT LAYOUT === */}
      <div className="relative z-10 flex min-h-dvh w-full max-w-[2200px] flex-col mx-auto pt-20 md:flex-row md:pt-24">
        {/* LEFT: Sticky Vinyl Station (Fixed in place while scrolling page) */}
        <div className="relative flex h-auto w-full flex-col justify-start overflow-visible p-6 md:sticky md:top-24 md:h-[calc(100vh-120px)] md:w-[45%] md:self-start md:p-8 lg:w-[40%] xl:w-[35%]">
          {/* Decorative floating elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-linear-to-b from-white/0 via-white/50 to-white/0 dark:from-black/0 dark:via-white/5 dark:to-black/0 rotate-45 blur-3xl opacity-30 pointer-events-none" />

          <div className="relative z-20 w-full text-left mb-6 md:mb-10 pl-2">
            {/* Breadcrumb Navigation */}
            <nav aria-label="breadcrumb" className="mb-3">
              <ol className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <li>
                  <LocaleLink href="/" className="hover:text-indigo-500 transition-colors">
                    {tNavbar('home.title')}
                  </LocaleLink>
                </li>
                <li className="mx-2">/</li>
                <li>
                  <LocaleLink href="/#gallery" className="hover:text-indigo-500 transition-colors">
                    {tNavbar('gallery.title')}
                  </LocaleLink>
                </li>
                <li className="mx-2">/</li>
                <li className="max-w-[180px] truncate font-medium text-slate-900 dark:text-slate-200">
                  {searchHeadline}
                </li>
              </ol>
            </nav>

            <div className="mb-5">
              <p className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400">
                <span aria-hidden="true">♪</span>
                Original meme song
              </p>
              <p className="max-w-xl text-balance font-serif text-2xl font-black leading-[1.05] tracking-[-0.035em] text-slate-950 drop-shadow-sm dark:text-white md:text-3xl lg:text-[2.15rem]">
                {song.title}
              </p>
              {formattedDate && (
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Published {formattedDate}
                </p>
              )}
            </div>

            {/* Style Tags - Enhanced Visibility */}
            {(() => {
              // Regex: Split by commas, periods, pipes, OR whitespace specifically followed by a hashtag
              const tags = song.prompt
                ? Array.from(
                    new Set(
                      song.prompt
                        .split(/[,，.|]+|\s+(?=#)/)
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0)
                    )
                  ).slice(0, 8)
                : [];

              if (tags.length === 0) return null;

              return (
                <div className="flex flex-wrap gap-2.5 mt-2 mb-6">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-indigo-50/50 dark:bg-white/5 text-indigo-600 dark:text-indigo-300 text-sm font-medium lowercase tracking-tight transition-all duration-300 hover:bg-indigo-100/50 dark:hover:bg-white/10 hover:scale-105 cursor-default select-none group/tag"
                    >
                      <span className="opacity-50 mr-0.5 group-hover/tag:opacity-100 transition-opacity">#</span>
                      {tag.toLowerCase()}
                    </span>
                  ))}
                </div>
              );
            })()}

            {/* 新闻标题是页面唯一 H1，但视觉上从属于歌曲信息。 */}
            {(song.newsSummary || song.sourceText) && (
              <article className="group/text relative mt-5 w-full max-w-lg rounded-r-2xl border-l-4 border-indigo-500/50 bg-white/40 py-4 pr-5 pl-5 text-left shadow-sm ring-1 ring-slate-200/50 backdrop-blur-2xl transition-all duration-500 hover:shadow-lg hover:ring-indigo-500/20 dark:bg-white/5 dark:shadow-black/20 dark:ring-white/10 dark:hover:shadow-black/40">
                <div className="mb-2 flex items-center gap-2">
                  <NewspaperIcon className="size-3.5 text-indigo-500" />
                  <span className="text-[11px] font-black tracking-[0.2em] text-indigo-600 dark:text-indigo-400 uppercase select-none">
                    {locale.startsWith('zh') ? '背景' : 'Background'}
                  </span>
                </div>
                <h1 className="text-pretty font-serif text-lg font-black leading-[1.22] tracking-[-0.025em] text-slate-900 selection:bg-indigo-500/30 dark:text-white md:text-xl">
                  {searchHeadline}
                </h1>
                {storyContext && (
                  <p className="mt-2.5 text-pretty font-serif text-sm italic leading-relaxed text-slate-600 selection:bg-indigo-500/30 dark:text-slate-300">
                    {storyContext}
                  </p>
                )}
                {song.sourceUrl && (
                  <a
                    href={song.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 underline decoration-indigo-300 underline-offset-4 transition hover:text-pink-600 dark:text-indigo-300"
                  >
                    Read the original report
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                )}
              </article>
            )}
          </div>

          <div className="relative z-10 w-full flex flex-col items-center gap-8 h-full justify-start md:justify-center">
            {/* 2. CENTERPIECE: Vinyl Player */}
            <div className="relative group cursor-pointer shrink-0" onClick={handlePlay}>
              {/* Dynamic Progress/Glow Ring */}
              <div
                className={cn(
                  'absolute inset-[-25px] rounded-full blur-3xl transition-opacity duration-1000',
                  isThisSongPlaying ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'
                )}
                style={{ background: primary }}
              />

              {/* Progress Border SVG */}
              <svg className="absolute inset-[-12px] size-[calc(100%+24px)] -rotate-90 z-10 pointer-events-none opacity-40">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke={primary}
                  strokeWidth="2"
                  strokeDasharray="100 100"
                  strokeDashoffset={currentTime && duration ? 100 - (currentTime / duration) * 100 : 100}
                  className="transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>

              {/* Vinyl Disc */}
              <div
                className={cn(
                  'relative size-[300px] md:size-[420px] lg:size-[520px] rounded-full shadow-2xl bg-neutral-950 overflow-hidden transition-all duration-500 ease-out group-hover:scale-[1.01] ring-1 ring-white/10',
                  'border-10 border-neutral-900', // Outer rim
                  'before:absolute before:inset-0 before:rounded-full before:bg-linear-to-tr before:from-transparent before:via-white/10 before:to-transparent before:z-20 before:pointer-events-none', // Shine
                  'after:absolute after:inset-[12px] after:rounded-full after:border-40 after:border-neutral-900/80 after:z-10' // Grooves illusion
                )}
                style={{
                  animation: isThisSongPlaying ? 'spin 6s linear infinite' : 'none',
                  boxShadow: isThisSongPlaying
                    ? `0 30px 200px -10px ${primary}, 0 0 400px ${primary}60`
                    : '0 20px 40px -10px rgba(0,0,0,0.5)',
                }}
              >
                {/* Album Art */}
                <div className="absolute inset-[8px] md:inset-[12px] rounded-full overflow-hidden z-0 bg-neutral-800 shadow-inner group-hover:scale-105 transition-transform duration-700">
                  <Image
                    src={song.coverImageUrl || '/images/funny-censored-fallback.png'}
                    alt={`Cover art for ${song.title}, inspired by: ${searchHeadline}`}
                    fill
                    className="object-cover"
                  />
                  {/* Surface Flare overlay */}
                  <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
                </div>
              </div>

              {/* Center Hole */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 md:size-5 rounded-full bg-neutral-950 border-2 border-white/10 z-30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />

              {/* Play Action Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-40">
                <div
                  className={cn(
                    'rounded-full p-6 transition-all duration-300 transform',
                    isThisSongPlaying
                      ? 'bg-transparent scale-100'
                      : 'bg-black/30 backdrop-blur-sm group-hover:scale-110 opacity-0 group-hover:opacity-100'
                  )}
                >
                  {isThisSongPlaying ? (
                    <div className="flex gap-1.5 h-8 items-end">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-white/90 rounded-full animate-music-bar"
                          style={{ animationDelay: `${i * 0.15}s`, height: '100%' }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Play className="size-16 fill-white text-white drop-shadow-lg pl-2" />
                  )}
                </div>
              </div>

              {/* --- Tonearm (Needle) --- */}
              <div
                className={cn(
                  'absolute -top-8 -right-16 w-48 h-64 z-50 pointer-events-none transition-transform duration-1000 ease-in-out origin-[20%_10%]',
                  isThisSongPlaying ? 'rotate-25' : 'rotate-0'
                )}
              >
                <svg viewBox="0 0 100 150" fill="none" className="w-full h-full drop-shadow-2xl">
                  {/* Base Pivot */}
                  <circle cx="20" cy="15" r="12" fill="#171717" />
                  <circle cx="20" cy="15" r="6" fill="#404040" />
                  {/* Main Arm */}
                  <path d="M20 15 L35 110 L50 125" stroke="#737373" strokeWidth="4" strokeLinecap="round" />
                  <path
                    d="M20 15 L35 110 L50 125"
                    stroke="#a3a3a3"
                    strokeWidth="1"
                    strokeLinecap="round"
                    className="opacity-50"
                  />
                  {/* Head/Cartridge */}
                  <rect x="42" y="120" width="16" height="24" rx="2" transform="rotate(-15 50 132)" fill="#262626" />
                  <rect x="45" y="123" width="10" height="4" rx="1" transform="rotate(-15 50 132)" fill="#dc2626" />{' '}
                  {/* Needle Accent */}
                </svg>
              </div>
            </div>

            {/* 3. CONTROL RAIL (Floating Bar) */}
            <div
              className={cn(
                'w-full max-w-md backdrop-blur-2xl p-2 pl-3 rounded-full border shadow-lg flex items-center gap-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl group/rail relative',
                isThisSongPlaying
                  ? 'bg-white/90 dark:bg-white/10 border-indigo-500/30 shadow-indigo-500/10'
                  : 'bg-white/80 dark:bg-white/5 border-slate-200/50 dark:border-white/10'
              )}
              style={{
                boxShadow: isThisSongPlaying ? `0 10px 30px -5px ${primary}20` : undefined,
              }}
            >
              {/* Play Toggle (Mini) */}
              <button
                type="button"
                onClick={handlePlay}
                className="size-12 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-black shadow-md hover:scale-110 active:scale-95 transition-all duration-300"
              >
                {isThisSongPlaying ? (
                  <Pause className="size-5 fill-current" />
                ) : (
                  <Play className="size-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Slider & Time */}
              <div className="flex-1 flex flex-col justify-center gap-1 group-hover/rail:gap-1.5 transition-all">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={(vals) => usePlayerStore.getState().setCurrentTime(vals[0])}
                  className="cursor-pointer py-1"
                />
                <div className="flex justify-between w-full px-1">
                  <span className="text-[9px] font-bold text-slate-400 tabular-nums">{formatTime(currentTime)}</span>
                  <span className="text-[9px] font-bold text-slate-400 tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />

              {/* Actions */}
              <div className="flex items-center gap-2 pr-2">
                <LikeButton
                  songId={song.id}
                  initialIsLiked={isLiked}
                  className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300"
                />
                {song.audioUrl && (
                  <DownloadButton
                    audioUrl={song.audioUrl}
                    title={song.title}
                    className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                  />
                )}
                <ShareButton
                  songId={song.id}
                  songTitle={song.title}
                  className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Lyrics and comments stay visible together on wide screens. */}
        <div className="grid h-auto w-full min-h-0 grid-rows-[70vh_65vh] overflow-hidden bg-transparent md:sticky md:top-24 md:h-[calc(100vh-120px)] md:w-[55%] md:self-start md:grid-rows-[45%_55%] lg:w-[60%] xl:w-[65%] xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] xl:grid-rows-1 xl:overflow-visible">
          <div className="relative flex min-h-0 items-center justify-center overflow-hidden p-6 md:p-8 xl:p-10">
            <FormattedLyricsView lyrics={song.lyrics} duration={duration} songId={song.id} className="h-full w-full" />
          </div>
          <SongComments songId={song.id} viewer={viewer} initialData={initialComments} />
        </div>
      </div>

      <style>{`
        @keyframes music-bar {
            0%, 100% { height: 30%; }
            50% { height: 100%; }
        }
        @keyframes aurora {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(5%, 5%) scale(1.1); }
            100% { transform: translate(-5%, -5%) scale(0.9); }
        }
        .animate-music-bar {
            animation: music-bar 0.8s ease-in-out infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// === Sub-component: FormattedLyricsView ===

function FormattedLyricsView({
  lyrics,
  duration,
  songId,
  className,
}: {
  lyrics: string | null | undefined;
  duration?: number | null;
  songId: string;
  className?: string;
}) {
  const locale = useLocale();
  const { currentTime, isPlaying, currentSong } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Empty State ---
  if (!lyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
        <span>{locale.startsWith('zh') ? '这首歌暂时没有可显示的歌词。' : 'No lyrics available for this track.'}</span>
      </div>
    );
  }

  // --- 1. Parse lines ---
  const displayLines = useMemo(() => {
    let cleanText = cleanLyricsForDisplay(lyrics);
    // Remove content within parentheses, e.g. (Yeah), (Ooh)
    cleanText = cleanText.replace(/\([^)]*\)/g, '');
    return cleanText.split('\n').filter((line: string) => line.trim() !== '');
  }, [lyrics]);

  // --- 2. Calculate Approximate Active Index (Linear) ---
  const activeIndex = useMemo(() => {
    const isPlayingThisSong = isPlaying && currentSong?.id === songId;
    if (!duration || duration <= 0 || !isPlayingThisSong) return -1;

    // Simple Linear Mapping: Map audio progress directly to line count.
    // We removed the 10% padding because it caused the lyrics to "stuck" at the start.
    const progress = currentTime / duration;
    const safeProgress = Math.max(0, Math.min(1, progress));

    const index = Math.floor(safeProgress * displayLines.length);
    return index;
  }, [currentTime, duration, isPlaying, displayLines.length, currentSong?.id, songId]);

  // 始终高亮最多 7 句实际歌词，段落标题不占用高亮名额。
  const focusLineIndices = useMemo(() => {
    const lyricLineIndices = displayLines
      .map((line, index) => ({ index, isSection: line.startsWith('[') && line.endsWith(']') }))
      .filter((line) => !line.isSection)
      .map((line) => line.index);

    if (lyricLineIndices.length === 0) return new Set<number>();

    const nearestPosition = lyricLineIndices.findIndex((index) => index >= Math.max(activeIndex, 0));
    const centerPosition = nearestPosition === -1 ? lyricLineIndices.length - 1 : nearestPosition;
    const windowSize = Math.min(7, lyricLineIndices.length);
    let start = Math.max(0, centerPosition - 3);
    let end = Math.min(lyricLineIndices.length, start + windowSize);

    start = Math.max(0, end - windowSize);
    end = Math.min(lyricLineIndices.length, start + windowSize);

    return new Set(lyricLineIndices.slice(start, end));
  }, [activeIndex, displayLines]);

  // --- 3. Smooth Auto-scroll ---
  useEffect(() => {
    const container = containerRef.current;
    const activeElement = lineRefs.current[activeIndex];

    // Only auto-scroll if user isn't hovering (Tactile override)
    // Actually, simple "soft" scroll is usually fine unless user force-scrolls.
    // basic scrollintoView
    if (activeIndex >= 0 && container && activeElement) {
      const containerHeight = container.clientHeight;
      const elementTop = activeElement.offsetTop;
      const elementHeight = activeElement.offsetHeight;
      const targetScroll = elementTop - containerHeight / 2 + elementHeight / 2;

      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  // No per-line click-to-seek, since sync is considered inaccurate.
  const handleLineClick = () => {};

  return (
    <div className={cn('relative group/lyrics w-full h-full', className)}>
      <div
        ref={containerRef}
        className="h-full relative z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col items-center py-[10vh] px-6 text-center mask-[linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] group/container"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="flex flex-col gap-6 w-full max-w-4xl">
          {displayLines.map((line, index) => {
            const isSection = line.startsWith('[') && line.endsWith(']');
            const isFocusZone = focusLineIndices.has(index);

            return (
              <div
                key={index}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                className={cn(
                  'transition-all duration-700 ease-out select-none w-full px-4 origin-center',
                  isSection ? 'py-8' : 'py-1',
                  !isSection && 'group-hover/container:opacity-30 hover:opacity-100! hover:scale-[1.02]', // Tactile (Hover)
                  !isSection && !isFocusZone && 'opacity-30 blur-[1px]', // Ambient Fade (Simulated Depth)
                  !isSection && isFocusZone && 'opacity-100 scale-100 blur-none text-slate-800 dark:text-white' // Focus Zone
                )}
              >
                {isSection ? (
                  <div className="flex flex-col items-center gap-4 mt-8">
                    <div className="flex items-center gap-4 w-full justify-center opacity-40">
                      <div className="h-px w-12 bg-current" />
                      <span className="font-serif italic text-lg tracking-widest text-slate-500">
                        {line.slice(1, -1)}
                      </span>
                      <div className="h-px w-12 bg-current" />
                    </div>
                  </div>
                ) : (
                  <p className="font-serif text-base md:text-lg lg:text-2xl font-bold leading-[1.4] tracking-tight text-balance mix-blend-screen">
                    {line}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
