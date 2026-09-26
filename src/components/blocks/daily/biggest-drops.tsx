'use client';

import { Marquee } from '@/components/magicui/marquee';
import { ShareButton } from '@/components/songs/actions/share-button';
import { Badge } from '@/components/ui/badge';
import { LocaleLink } from '@/i18n/navigation';
import { getAllTimeBiggestDrops, getNewsCardSummary } from '@/lib/songs/song-editorial';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { Headphones, Loader2, Music2, Pause, Play, Sparkles, Trophy } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface BiggestDropsProps {
  songs: Song[];
}

function getSongUrl(song: Song) {
  return `/songs/${getSongCanonicalSlug(song)}`;
}

function toPlayerSong(song: Song) {
  return {
    id: song.id,
    seoSlug: song.seoSlug,
    title: song.title,
    audioUrl: song.audioUrl || '',
    coverImageUrl: song.coverImageUrl,
    artist: 'ScoopRYM',
    newsSummary: song.newsSummary || undefined,
    newsContent: song.sourceText || undefined,
    newsLink: song.sourceUrl || undefined,
  };
}

function DropPortraitCard({
  song,
  index,
  isActive,
  onToggle,
}: {
  song: Song;
  index: number;
  isActive: boolean;
  onToggle: (song: Song) => void;
}) {
  const songUrl = getSongUrl(song);
  const description = song.newsSummary?.trim() ? getNewsCardSummary(song) : song.title;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(song);
  };

  return (
    <div
      className={cn(
        'group/card relative flex w-[300px] sm:w-[330px] shrink-0 flex-col overflow-hidden rounded-3xl bg-white text-left select-none border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-zinc-900 dark:border-zinc-800',
        isActive
          ? 'border-[#d80d63] shadow-[0_20px_45px_rgba(216,13,99,0.35)] ring-2 ring-[#d80d63]/70'
          : 'border-white/80 shadow-xl hover:border-[#d80d63]/40 dark:shadow-[0_16px_36px_rgba(0,0,0,0.4)]'
      )}
    >
      {/* 顶部正方形大封面区域 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-3xl bg-zinc-100 dark:bg-zinc-800">
        <LocaleLink
          prefetch={false}
          href={songUrl}
          scroll={false}
          className="relative block size-full cursor-pointer overflow-hidden"
        >
          {song.coverImageUrl ? (
            <Image
              src={song.coverImageUrl}
              alt={song.title}
              fill
              sizes="(min-width: 640px) 330px, 300px"
              className="object-cover transition-transform duration-700 group-hover/card:scale-105"
            />
          ) : (
            <div className="relative size-full bg-zinc-100 dark:bg-zinc-800">
              <Image
                src="/images/funny-censored-fallback.png"
                alt="Censored"
                fill
                sizes="(min-width: 640px) 330px, 300px"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <span className="rounded bg-black/80 px-3 py-1.5 text-center text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-md">
                  CONTENT FLAGGED: TOO HOT FOR AI ART
                </span>
              </div>
            </div>
          )}
        </LocaleLink>

        {/* 顶部悬浮工具栏 (类别Badge + 分享按钮) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-linear-to-b from-black/60 to-transparent p-3.5">
          <Badge className="pointer-events-auto h-6 border-0 bg-black/60 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-md hover:bg-black/80">
            {song.category || 'Music'}
          </Badge>
          <div className="pointer-events-auto">
            <ShareButton
              songId={song.id}
              seoSlug={song.seoSlug}
              songTitle={song.title}
              newsSummary={song.newsSummary}
              sourceText={song.sourceText}
              className="size-8.5 rounded-full border-0 bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
            />
          </div>
        </div>

        {/* 悬浮或播放状态时的播放按钮遮罩 */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-300',
            isActive
              ? 'opacity-100 bg-black/30 backdrop-blur-[2px]'
              : 'opacity-0 group-hover/card:opacity-100 bg-black/25 backdrop-blur-[2px]'
          )}
        >
          <button
            type="button"
            onClick={handlePlayClick}
            disabled={!song.audioUrl}
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform duration-300 hover:scale-110 active:scale-95"
            aria-label={isActive ? 'Pause' : 'Play'}
          >
            {isActive ? (
              <Pause className="size-6 fill-current text-[#d80d63]" />
            ) : (
              <Play className="ml-1 size-6 fill-current text-[#d80d63]" />
            )}
          </button>
        </div>
      </div>

      {/* 下方卡片内容区域 */}
      <div className="relative flex flex-1 flex-col px-4 pt-3.5 pb-4">
        {/* 新闻描述引语气泡框 */}
        <LocaleLink
          prefetch={false}
          href={songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group/snippet mb-3 block w-full text-left focus:outline-none"
        >
          <div className="relative rounded-[12px] bg-rose-50/70 px-3.5 py-2.5 shadow-xs transition-colors hover:bg-rose-100/70 dark:bg-rose-950/25 dark:hover:bg-rose-900/35">
            <p className="line-clamp-3 text-[13px] font-medium leading-[1.38] text-rose-950 transition-colors group-hover/snippet:text-rose-700 dark:text-rose-50 dark:group-hover/snippet:text-rose-200">
              {description}
            </p>
          </div>
        </LocaleLink>

        {/* 歌曲标题 */}
        <div className="mb-2">
          <LocaleLink
            prefetch={false}
            href={songUrl}
            scroll={false}
            className="group/title block w-full text-left focus:outline-none"
          >
            <div className="flex items-start gap-1.5">
              <Music2 className="mt-0.5 size-3.5 shrink-0 text-pink-500" aria-hidden="true" />
              <h3 className="line-clamp-1 text-[13.5px] font-bold leading-tight tracking-tight text-slate-900 transition-colors group-hover/title:text-pink-600 dark:text-slate-100">
                {song.title}
              </h3>
            </div>
          </LocaleLink>
        </div>

        {/* 底部元数据栏：动效音频波形与累计播放量。 */}
        <div className="mt-auto flex items-center gap-2 text-[11px] font-medium leading-none text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <div className="flex h-3 items-end gap-0.5">
              <div
                className={cn(
                  'w-0.5 h-1.5 bg-pink-500 rounded-full',
                  isActive && 'animate-[music-bar_1s_ease-in-out_infinite]'
                )}
              />
              <div
                className={cn(
                  'w-0.5 h-3 bg-pink-500 rounded-full',
                  isActive && 'animate-[music-bar_1.2s_ease-in-out_infinite_0.1s]'
                )}
              />
              <div
                className={cn(
                  'w-0.5 h-2 bg-pink-500 rounded-full',
                  isActive && 'animate-[music-bar_0.8s_ease-in-out_infinite_0.2s]'
                )}
              />
            </div>
            <span>Audio</span>
          </div>
          <span className="size-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Headphones className="size-3 text-slate-400" aria-hidden="true" />
            <span>{song.plays} Plays</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BiggestDrops({ songs }: BiggestDropsProps) {
  const { currentSong, isPlaying, play, pause } = usePlayerStore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  const rawBiggestSongs = useMemo(() => getAllTimeBiggestDrops(songs), [songs]);

  // 单行模式下，如果卡片数量少，扩充数量保证单行连续滚动充盈饱满
  const denseSongs = useMemo(() => {
    if (rawBiggestSongs.length === 0) return [];
    if (rawBiggestSongs.length < 8) {
      return [...rawBiggestSongs, ...rawBiggestSongs, ...rawBiggestSongs, ...rawBiggestSongs];
    }
    if (rawBiggestSongs.length < 15) {
      return [...rawBiggestSongs, ...rawBiggestSongs];
    }
    return rawBiggestSongs;
  }, [rawBiggestSongs]);

  const isActive = (song: Song) => currentSong?.id === song.id && isPlaying;

  const toggleSong = (song: Song) => {
    if (!song.audioUrl) {
      toast.error('This Drop is not ready to play yet.');
      return;
    }

    if (isActive(song)) {
      pause();
      return;
    }

    play(toPlayerSong(song), denseSongs.map(toPlayerSong));
  };

  return (
    <section
      id="biggest"
      className="relative z-20 overflow-hidden bg-indigo-900 bg-[linear-gradient(90deg,#6366f1_0%,#ec4899_50%,#22d3ee_100%)] px-4 py-20 text-[#fffdf8] md:px-6 md:py-24 2xl:px-8"
    >
      <div className="relative z-10 mx-auto max-w-[1760px]">
        {/* Header Bar */}
        <div className="flex flex-col gap-3 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-white shadow-xs backdrop-blur-md">
                <Trophy className="size-3.5 text-amber-300" />
                All-Time Hits
              </span>
            </div>
            <h2 className="mt-2.5 text-3xl font-black tracking-tight drop-shadow-xs sm:text-4xl md:text-5xl">
              Most Played Funny Songs
            </h2>
            <p className="mt-2 max-w-lg text-sm sm:text-base font-medium leading-relaxed text-white/90">
              The funny songs listeners keep coming back to. Hover any card to pause.
            </p>
          </div>
          <p className="max-w-lg text-xs sm:text-sm font-bold uppercase tracking-wider text-white/80 md:text-right">
            Ranked by total plays
          </p>
        </div>

        {/* Single Row Continuous Horizontal Moving Marquee */}
        <div className="relative mt-4 overflow-hidden rounded-3xl py-4">
          {/* Edge Gradient Mask Shadows */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 sm:w-28 bg-linear-to-r from-indigo-900/80 via-indigo-900/30 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 sm:w-28 bg-linear-to-l from-cyan-600/80 via-cyan-600/30 to-transparent" />

          {denseSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/40 p-10 text-center text-sm font-semibold text-white/90">
              <Sparkles className="mb-2 size-8 text-amber-300" />
              The chart is waiting for its first plays.
            </div>
          ) : (
            <Marquee pauseOnHover repeat={hasMounted ? 2 : 1} className="py-2 [--duration:55s] [--gap:1.75rem]">
              {denseSongs.map((song, idx) => (
                <DropPortraitCard
                  key={`biggest-single-${song.id}-${idx}`}
                  song={song}
                  index={idx % rawBiggestSongs.length}
                  isActive={isActive(song)}
                  onToggle={toggleSong}
                />
              ))}
            </Marquee>
          )}
        </div>
      </div>
    </section>
  );
}
