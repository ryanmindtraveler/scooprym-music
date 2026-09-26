'use client';

import { getSourceUrl } from '@/lib/urls/source-url';

import { DownloadButton } from '@/components/songs/actions/download-button';
import { LikeButton } from '@/components/songs/actions/like-button';
import { ShareButton } from '@/components/songs/actions/share-button';
import { type SongCommentItem, SongComments } from '@/components/songs/song-comments';
import { Slider } from '@/components/ui/slider';
import { useSongLike } from '@/hooks/songs/use-song-like';
import { useImageColors } from '@/hooks/ui/use-image-colors';
import { LocaleLink } from '@/i18n/navigation';
import { cleanLyricsForDisplay } from '@/lib/music/lyrics-utils';
import { createEngagementSessionId, recordSongEngagement } from '@/lib/songs/song-engagement-client';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { Download, ExternalLink, Heart, Newspaper, NewspaperIcon, Pause, Play, Share2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import type { Song } from '@/types/song';
import styles from './song-detail-layout.module.css';

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
        newsLink: getSourceUrl(song.sourceUrl) || undefined,
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
        newsLink: getSourceUrl(song.sourceUrl) || undefined,
      });
    }
  };

  const accentColor = primary || '#6366f1';
  const secondaryAccent = secondary || '#ec4899';

  return (
    <div className="relative flex w-full flex-col selection:bg-indigo-500/30 bg-[#f8fafc] dark:bg-[#07070c] no-scrollbar overflow-x-clip">
      {/* === APPLE MUSIC STYLE ADAPTIVE AMBIENT MESH GRADIENT === */}
      <div
        className="pointer-events-none fixed -top-48 left-1/4 size-[720px] rounded-full blur-[170px] transition-all duration-1000 opacity-25 dark:opacity-35 animate-[aurora_16s_ease-in-out_infinite]"
        style={{ background: accentColor }}
      />
      <div
        className="pointer-events-none fixed top-1/3 right-10 size-[640px] rounded-full blur-[180px] transition-all duration-1000 opacity-20 dark:opacity-30 animate-[aurora_14s_ease-in-out_infinite_reverse]"
        style={{ background: secondaryAccent }}
      />
      <div
        className="pointer-events-none fixed -bottom-40 left-10 size-[520px] rounded-full blur-[160px] transition-all duration-1000 opacity-15 dark:opacity-25"
        style={{ background: muted || accentColor }}
      />
      <div className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

      {/* === IMMERSIVE SPLIT LAYOUT === */}
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[2200px] flex-col pt-20 md:flex-row">
        {/* LEFT: Sticky Vinyl Station (Fixed in place while scrolling page) */}
        <div
          className={cn(
            'relative flex h-auto w-full flex-col p-5 md:sticky md:top-20 md:h-[calc(100dvh-9rem)] md:w-[45%] md:self-start md:p-5 lg:w-[40%] xl:w-[35%]',
            styles.station
          )}
        >
          <div className={cn('relative z-20 mb-3 w-full pl-2 text-left', styles.info)}>
            {/* Breadcrumb Navigation */}
            <nav aria-label="breadcrumb" className="mb-3">
              <ol className="flex items-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                <li>
                  <LocaleLink href="/" className="hover:text-indigo-600 transition-colors">
                    {tNavbar('home.title')}
                  </LocaleLink>
                </li>
                <li className="mx-2 text-slate-300 dark:text-slate-700">/</li>
                <li>
                  <LocaleLink href="/#gallery" className="hover:text-indigo-600 transition-colors">
                    {tNavbar('gallery.title')}
                  </LocaleLink>
                </li>
                <li className="mx-2 text-slate-300 dark:text-slate-700">/</li>
                <li className="max-w-[200px] truncate font-medium text-slate-900 dark:text-slate-200">
                  {searchHeadline}
                </li>
              </ol>
            </nav>

            <div className="mb-3">
              <div
                className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300"
                style={{
                  borderColor: `${accentColor}40`,
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                <span className="size-1.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                Original Meme Single
              </div>
              <h1 className="max-w-xl text-balance font-serif text-2xl font-black leading-[1.08] tracking-tight text-slate-950 drop-shadow-xs dark:text-white sm:text-3xl md:text-3xl lg:text-[2.25rem]">
                {song.title}
              </h1>
            </div>

            {/* Style Tags - Clean Modern Frosted Pill Style */}
            {(() => {
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
                <div className="mt-2 mb-3 flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-white/80 bg-white/70 dark:border-white/10 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-semibold lowercase tracking-tight shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-default select-none group/tag"
                    >
                      <span className="opacity-40 mr-0.5 text-indigo-500 group-hover/tag:opacity-100 transition-opacity">
                        #
                      </span>
                      {tag.toLowerCase()}
                    </span>
                  ))}
                </div>
              );
            })()}

            {/* News Background Inset Card - Frosted Glass */}
            {(song.newsSummary || getSourceUrl(song.sourceUrl)) && (
              <article className="group/text relative mt-5 w-full max-w-lg rounded-2xl border border-white/90 bg-white/75 p-5 text-left shadow-[0_12px_36px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/4 backdrop-blur-3xl transition-all duration-300 hover:shadow-md dark:border-white/10 dark:bg-white/6 dark:ring-white/10">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2">
                    <NewspaperIcon className="size-3.5 text-indigo-500" style={{ color: accentColor }} />
                    <span
                      className="text-[11px] font-black tracking-[0.2em] text-indigo-600 dark:text-indigo-400 uppercase select-none"
                      style={{ color: accentColor }}
                    >
                      Background
                    </span>
                  </div>
                  {getSourceUrl(song.sourceUrl) && (
                    <a
                      href={getSourceUrl(song.sourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1.5 text-right text-xs font-black text-indigo-600 hover:text-pink-600 underline decoration-indigo-300 underline-offset-4 transition dark:text-indigo-300"
                      style={{ color: accentColor }}
                    >
                      Read the original report
                      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                    </a>
                  )}
                </div>
                <h2 className="text-pretty font-serif text-base sm:text-lg font-black leading-[1.3] tracking-tight text-slate-900 dark:text-white">
                  {searchHeadline}
                </h2>
                {storyContext && (
                  <p className="mt-2 text-pretty font-serif text-xs sm:text-sm font-medium italic leading-relaxed text-slate-600 dark:text-slate-300">
                    {storyContext}
                  </p>
                )}
              </article>
            )}
          </div>

          <div className={cn('relative z-10 flex w-full flex-col items-center', styles.vinylSection)}>
            {/* 2. CENTERPIECE: Vinyl Player */}
            <div className="relative group cursor-pointer shrink-0" onClick={handlePlay}>
              {/* Dynamic Progress/Glow Ring */}
              <div
                className={cn(
                  'absolute -inset-7.5 rounded-full blur-3xl transition-opacity duration-1000',
                  isThisSongPlaying ? 'opacity-45' : 'opacity-0 group-hover:opacity-20'
                )}
                style={{ background: accentColor }}
              />

              {/* Progress Border SVG */}
              <svg className="absolute -inset-3 size-[calc(100%+24px)] -rotate-90 z-10 pointer-events-none opacity-60">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2.5"
                  strokeDasharray="100 100"
                  strokeDashoffset={currentTime && duration ? 100 - (currentTime / duration) * 100 : 100}
                  className="transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>

              {/* Vinyl Disc */}
              <div
                className={cn(
                  'relative rounded-full shadow-2xl bg-neutral-950 overflow-hidden transition-all duration-500 ease-out group-hover:scale-[1.01] ring-2 ring-white/20',
                  'border-10 border-neutral-900',
                  'before:absolute before:inset-0 before:rounded-full before:bg-linear-to-tr before:from-transparent before:via-white/10 before:to-transparent before:z-20 before:pointer-events-none',
                  'after:absolute after:inset-3 after:rounded-full after:border-40 after:border-neutral-900/80 after:z-10',
                  styles.vinyl
                )}
                style={{
                  animation: isThisSongPlaying ? 'spin 6s linear infinite' : 'none',
                  boxShadow: isThisSongPlaying
                    ? `0 30px 180px -10px ${accentColor}, 0 0 350px ${accentColor}50`
                    : '0 20px 40px -10px rgba(0,0,0,0.45)',
                }}
              >
                {/* Album Art */}
                <div className="absolute inset-2 md:inset-3 rounded-full overflow-hidden z-0 bg-neutral-800 shadow-inner group-hover:scale-105 transition-transform duration-700">
                  <Image
                    src={song.coverImageUrl || '/images/funny-censored-fallback.png'}
                    alt={`Cover art for ${song.title}, inspired by: ${searchHeadline}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
                </div>
              </div>

              {/* Center Hole */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 md:size-5 rounded-full bg-neutral-950 border-2 border-white/25 z-30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />

              {/* Play Action Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-40">
                <div
                  className={cn(
                    'rounded-full p-6 transition-all duration-300 transform',
                    isThisSongPlaying
                      ? 'bg-transparent scale-100'
                      : 'bg-black/35 backdrop-blur-sm group-hover:scale-110 opacity-0 group-hover:opacity-100'
                  )}
                >
                  {isThisSongPlaying ? (
                    <div className="flex gap-1.5 h-9 items-end">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 bg-white/95 rounded-full animate-music-bar"
                          style={{ animationDelay: `${i * 0.15}s`, height: '100%' }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Play className="size-16 fill-white text-white drop-shadow-xl pl-2" />
                  )}
                </div>
              </div>

              {/* --- Tonearm (Needle) --- */}
              <div
                className={cn(
                  'absolute -top-8 -right-16 w-48 h-64 z-50 pointer-events-none transition-transform duration-1000 ease-in-out origin-[20%_10%]',
                  styles.tonearm,
                  isThisSongPlaying ? 'rotate-25' : 'rotate-0'
                )}
              >
                <svg viewBox="0 0 100 150" fill="none" className="w-full h-full drop-shadow-2xl">
                  <circle cx="20" cy="15" r="12" fill="#171717" />
                  <circle cx="20" cy="15" r="6" fill="#404040" />
                  <path d="M20 15 L35 110 L50 125" stroke="#737373" strokeWidth="4" strokeLinecap="round" />
                  <path
                    d="M20 15 L35 110 L50 125"
                    stroke="#a3a3a3"
                    strokeWidth="1"
                    strokeLinecap="round"
                    className="opacity-50"
                  />
                  <rect x="42" y="120" width="16" height="24" rx="2" transform="rotate(-15 50 132)" fill="#262626" />
                  <rect x="45" y="123" width="10" height="4" rx="1" transform="rotate(-15 50 132)" fill={accentColor} />
                </svg>
              </div>
            </div>

            {/* 3. CONTROL RAIL (Floating Bar) */}
            <div
              className={cn(
                'w-full max-w-md backdrop-blur-3xl p-2.5 pl-3.5 rounded-full border shadow-[0_16px_40px_rgba(15,23,42,0.06)] flex items-center gap-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group/rail relative',
                styles.controls,
                isThisSongPlaying
                  ? 'bg-white/85 dark:bg-zinc-900/80 border-white/90 dark:border-white/15'
                  : 'bg-white/75 dark:bg-zinc-900/70 border-white/80 dark:border-white/10'
              )}
              style={{
                boxShadow: isThisSongPlaying ? `0 14px 40px -5px ${accentColor}25` : undefined,
              }}
            >
              {/* Play Toggle */}
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
                  <span className="text-[10px] font-bold text-slate-500 tabular-nums">{formatTime(currentTime)}</span>
                  <span className="text-[10px] font-bold text-slate-500 tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-slate-200/80 dark:bg-white/10" />

              {/* Actions */}
              <div className="flex items-center gap-1.5 pr-2">
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
                  seoSlug={song.seoSlug}
                  songTitle={song.title}
                  newsSummary={song.newsSummary}
                  sourceText={song.sourceText}
                  className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Lyrics and comments stay visible together on wide screens. */}
        <div className="grid h-auto w-full min-h-0 grid-rows-[70vh_65vh] overflow-hidden bg-transparent md:sticky md:top-20 md:h-[calc(100dvh-9rem)] md:w-[55%] md:self-start md:grid-rows-[45%_55%] lg:w-[60%] xl:w-[65%] xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] xl:grid-rows-1 xl:overflow-visible">
          <div className="relative flex min-h-0 items-center justify-center overflow-hidden p-6 md:p-8 xl:p-10">
            <FormattedLyricsView
              lyrics={song.lyrics}
              duration={duration}
              songId={song.id}
              accentColor={accentColor}
              className="h-full w-full"
            />
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
            50% { transform: translate(6%, 8%) scale(1.12); }
            100% { transform: translate(-6%, -8%) scale(0.92); }
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
  accentColor = '#6366f1',
  className,
}: {
  lyrics: string | null | undefined;
  duration?: number | null;
  songId: string;
  accentColor?: string;
  className?: string;
}) {
  const { currentTime, isPlaying, currentSong } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Empty State ---
  if (!lyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
        <span>No lyrics available for this track.</span>
      </div>
    );
  }

  // --- 1. Parse lines ---
  const displayLines = useMemo(() => {
    let cleanText = cleanLyricsForDisplay(lyrics);
    cleanText = cleanText.replace(/\([^)]*\)/g, '');
    return cleanText.split('\n').filter((line: string) => line.trim() !== '');
  }, [lyrics]);

  // --- 2. Calculate Approximate Active Index (Linear) ---
  const activeIndex = useMemo(() => {
    const isPlayingThisSong = isPlaying && currentSong?.id === songId;
    if (!duration || duration <= 0 || !isPlayingThisSong) return -1;

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

  return (
    <div className="relative group/lyrics w-full h-full">
      <div
        ref={containerRef}
        className="h-full relative z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col items-center py-[12vh] px-6 text-center mask-[linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] group/container"
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
                  isSection ? 'py-8' : 'py-1.5',
                  !isSection && 'group-hover/container:opacity-30 hover:opacity-100! hover:scale-[1.02]',
                  !isSection && !isFocusZone && 'opacity-30 blur-[0.75px]',
                  !isSection && isFocusZone && 'opacity-100 scale-100 blur-none text-slate-900 dark:text-white'
                )}
              >
                {isSection ? (
                  <div className="flex flex-col items-center gap-4 my-6">
                    <div className="flex items-center gap-4 w-full justify-center opacity-60">
                      <div className="h-px w-16 bg-linear-to-r from-transparent via-slate-400 to-transparent dark:via-white/30" />
                      <span
                        className="font-serif italic text-xs sm:text-sm md:text-base font-black uppercase tracking-[0.25em]"
                        style={{ color: accentColor }}
                      >
                        {line.slice(1, -1)}
                      </span>
                      <div className="h-px w-16 bg-linear-to-r from-transparent via-slate-400 to-transparent dark:via-white/30" />
                    </div>
                  </div>
                ) : (
                  <p className="font-serif text-lg md:text-xl lg:text-[1.65rem] font-bold leading-[1.4] tracking-tight text-balance drop-shadow-2xs">
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
