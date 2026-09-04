'use client';

import { formatBusinessDate } from '@/lib/business-time';
import { getNewsCardSummary } from '@/lib/song-editorial';
import { getSongCanonicalSlug } from '@/lib/song-seo';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { ExternalLink, Music2, Pause, Play, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';
import { toast } from 'sonner';

interface DailyHomeProps {
  songs: Song[];
  freshnessLabel?: string;
}

function getSongUrl(song: Song) {
  return `/songs/${getSongCanonicalSlug(song)}`;
}

function toPlayerSong(song: Song) {
  return {
    id: song.id,
    title: song.title,
    audioUrl: song.audioUrl || '',
    coverImageUrl: song.coverImageUrl,
    artist: 'ScoopRYM',
    newsSummary: song.newsSummary || undefined,
    newsContent: song.sourceText || undefined,
    newsLink: song.sourceUrl || undefined,
  };
}

function getNewsSummary(song: Song) {
  return getNewsCardSummary(song);
}

function Cover({ song, priority = false, className }: { song: Song; priority?: boolean; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-slate-900', className)}>
      {song.coverImageUrl ? (
        <Image
          src={song.coverImageUrl}
          alt={getNewsSummary(song)}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 42vw, 92vw"
          className="object-cover transition-transform duration-500 ease-out group-hover/media:scale-[1.025] motion-reduce:transition-none motion-reduce:transform-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-cyan-400 via-violet-500 to-pink-500">
          <Music2 className="size-12 text-[#fffdf8]/80" />
        </div>
      )}
    </div>
  );
}

function CoverPlayOverlay({
  active,
  label,
  onClick,
  size = 'default',
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  size?: 'default' | 'large';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'absolute inset-0 z-10 flex cursor-pointer items-center justify-center transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#d80d63]',
        active
          ? 'bg-[#17151f]/25'
          : 'bg-[#17151f]/10 lg:bg-transparent lg:group-hover/media:bg-[#17151f]/25 lg:group-focus-within/media:bg-[#17151f]/25'
      )}
    >
      <span
        className={cn(
          'pointer-events-none relative flex items-center justify-center rounded-full bg-[#fffdf8] text-[#d80d63] shadow-[0_12px_35px_rgba(23,21,31,0.3)] transition-[opacity,transform,background-color] duration-300 ease-out',
          size === 'large' ? 'size-16 md:size-[4.5rem]' : 'size-12',
          active
            ? 'scale-100 opacity-100'
            : 'scale-100 opacity-100 lg:scale-90 lg:opacity-0 lg:group-hover/media:scale-100 lg:group-hover/media:opacity-100 lg:group-focus-within/media:scale-100 lg:group-focus-within/media:opacity-100'
        )}
        aria-hidden="true"
      >
        {active ? (
          <Pause className={cn('fill-current', size === 'large' ? 'size-7' : 'size-5')} />
        ) : (
          <Play className={cn('ml-1 fill-current', size === 'large' ? 'size-7' : 'size-5')} />
        )}
      </span>
    </button>
  );
}

export function DailyHome({ songs, freshnessLabel = 'Latest Drops' }: DailyHomeProps) {
  const { currentSong, isPlaying, play, pause } = usePlayerStore();
  const featured = songs[0];
  // 首页今日区固定为 1 首左侧主打加 3 首右侧内容。
  const todayDrops = songs.slice(1, 4);
  const dateLabel = useMemo(
    () => formatBusinessDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

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
    play(song ? toPlayerSong(song) : undefined, songs.map(toPlayerSong));
  };

  if (!featured) {
    return (
      <section
        id="generator"
        className="relative z-20 overflow-hidden bg-[linear-gradient(90deg,#06b6d4_0%,#a78bfa_50%,#f472b6_100%)] px-4 py-28"
      >
        <div className="relative z-10 mx-auto max-w-3xl rounded-[2.5rem] border border-slate-950/8 bg-[#fffdf9] p-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <Sparkles className="mx-auto mb-5 size-10 text-pink-500" />
          <h2 className="text-4xl font-black tracking-tight text-slate-950">Today’s Drops are warming up.</h2>
          <p className="mt-4 text-lg font-medium text-slate-600">
            Come back soon for the internet’s next musical meltdown.
          </p>
        </div>
      </section>
    );
  }

  return (
    <main className="relative z-20 overflow-hidden bg-[linear-gradient(90deg,#06b6d4_0%,#a78bfa_50%,#f472b6_100%)] text-[#fffdf8]">
      <section id="today" className="relative scroll-mt-20 px-4 py-20 md:px-6 md:py-24 2xl:px-8">
        <span id="generator" className="absolute -top-24" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1760px]">
          {/* Header Bar */}
          <div className="mb-8 flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-3.5">
              <h1 className="text-4xl font-black tracking-tight drop-shadow-xs md:text-5xl">Today’s Drops</h1>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-white shadow-xs backdrop-blur-md">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-300 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-[#d80d63]" />
                </span>
                {freshnessLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-4 py-1.5 text-xs font-bold text-slate-700 backdrop-blur-md shadow-xs dark:bg-slate-900/60 dark:text-slate-200">
                <Sparkles className="size-3.5 text-[#d80d63]" />
                {dateLabel}
              </span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] xl:gap-8">
            {/* Featured / Lead Story Drop (Left) */}
            <article className="group/hero grid h-full overflow-hidden rounded-[2rem] border border-white/90 bg-[#fffdf9]/95 backdrop-blur-sm shadow-[0_24px_70px_rgba(60,34,82,0.18)] transition-all duration-500 hover:border-[#d80d63]/50 hover:shadow-[0_30px_80px_rgba(216,13,99,0.25)] md:grid-cols-[1.05fr_0.95fr] dark:border-white/12 dark:bg-[#241e2b]/95">
              <div className="group/media relative min-h-[340px] md:min-h-[490px]">
                {/* Top Badge */}
                <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#17151f]/80 px-3.5 py-1 text-[0.72rem] font-black uppercase tracking-wider text-amber-300 shadow-lg backdrop-blur-md">
                  <Sparkles className="size-3.5 fill-amber-400 text-amber-400" />
                  #1 Headline Drop
                </div>

                <Cover song={featured} priority className="absolute inset-0" />
                <CoverPlayOverlay
                  active={isActive(featured)}
                  label={isActive(featured) ? 'Pause today’s main story' : 'Play today’s main story'}
                  onClick={() => toggleSong(featured)}
                  size="large"
                />
              </div>

              <div className="flex min-h-[490px] flex-col p-6 md:p-8 xl:p-9">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#d80d63]">
                      Lead Story
                    </span>
                    {featured.sourceUrl && (
                      <a
                        href={featured.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-black text-slate-500 transition-colors hover:text-[#d80d63] dark:text-slate-300"
                      >
                        Read source <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>

                  <a href={getSongUrl(featured)} target="_blank" rel="noopener noreferrer" className="mt-5 block">
                    <p className="line-clamp-4 max-w-3xl text-[1.35rem] font-bold leading-[1.48] tracking-[-0.025em] text-[#201a29] transition-colors group-hover/hero:text-[#b90851] md:text-[1.5rem] xl:text-[1.65rem] dark:text-[#fffdf8]">
                      {getNewsSummary(featured)}
                    </p>
                  </a>
                </div>

                <div
                  className={cn(
                    'mt-auto flex w-full min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d80d63]',
                    isActive(featured)
                      ? 'border-[#d80d63]/40 bg-[#d80d63] text-white shadow-md'
                      : 'border-[#201a29]/10 bg-[#e8f7f6]/80 text-[#201a29] hover:border-[#d80d63]/30 hover:bg-[#e8f7f6] dark:border-white/10 dark:bg-[#193538]/80 dark:text-[#fffdf8]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSong(featured)}
                    aria-label={isActive(featured) ? `Pause ${featured.title}` : `Play ${featured.title}`}
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300',
                      isActive(featured) ? 'bg-white text-[#d80d63]' : 'bg-[#fff258] text-[#201a29]'
                    )}
                  >
                    {isActive(featured) ? (
                      <Pause className="size-4 fill-current" />
                    ) : (
                      <Play className="ml-0.5 size-4 fill-current" />
                    )}
                  </button>
                  <Music2 className="size-4 shrink-0 text-[#d80d63]" aria-hidden="true" />
                  <a
                    href={getSongUrl(featured)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm font-black transition-colors hover:text-[#d80d63] hover:underline hover:underline-offset-4"
                  >
                    {featured.title}
                  </a>
                </div>
              </div>
            </article>

            {/* Secondary Drops List (Right) */}
            <div className="grid auto-rows-fr gap-5 xl:gap-6">
              {todayDrops.map((song, index) => (
                <article
                  key={song.id}
                  className={cn(
                    'group grid min-h-[204px] overflow-hidden rounded-[1.75rem] border bg-[#fffdf9]/95 backdrop-blur-sm shadow-[0_16px_38px_rgba(60,34,82,0.1)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#d80d63]/50 hover:shadow-[0_22px_48px_rgba(60,34,82,0.16)] sm:grid-cols-[0.8fr_1.2fr] dark:border-white/10 dark:bg-[#241e2b]/95',
                    isActive(song) ? 'border-[#d80d63] ring-2 ring-[#d80d63]/30' : 'border-white/90'
                  )}
                >
                  <div className="group/media relative min-h-[204px]">
                    <span className="absolute top-3 left-3 z-20 rounded-full border border-white/20 bg-[#17151f]/80 px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-md">
                      Drop #{index + 2}
                    </span>

                    <Cover song={song} className="absolute inset-0" />
                    <CoverPlayOverlay
                      active={isActive(song)}
                      label={isActive(song) ? 'Pause story' : 'Play story'}
                      onClick={() => toggleSong(song)}
                    />
                  </div>

                  <div className="flex min-w-0 flex-col p-5 xl:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-[#d80d63]">
                        {formatBusinessDate(song.createdAt, { month: 'short', day: 'numeric' })}
                      </span>
                      {song.sourceUrl && (
                        <a
                          href={song.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hidden items-center gap-1 text-xs font-black text-slate-500 hover:text-[#d80d63] sm:inline-flex dark:text-slate-300"
                        >
                          Read source <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>

                    <a href={getSongUrl(song)} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                      <p className="line-clamp-3 text-[0.98rem] font-bold leading-[1.42] tracking-[-0.012em] text-[#201a29] transition-colors group-hover:text-[#b90851] xl:text-[1.05rem] dark:text-[#fffdf8]">
                        {getNewsSummary(song)}
                      </p>
                    </a>

                    <div
                      className={cn(
                        'mt-auto inline-flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-1.5 text-left text-xs font-black transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d80d63]',
                        isActive(song)
                          ? 'border-[#d80d63]/40 bg-[#d80d63] text-white shadow-xs'
                          : 'border-slate-200 bg-slate-100/80 text-[#201a29] hover:border-[#d80d63]/30 hover:bg-[#ffdce9] dark:border-white/10 dark:bg-slate-800/80 dark:text-[#fffdf8]'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSong(song)}
                        aria-label={isActive(song) ? `Pause ${song.title}` : `Play ${song.title}`}
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full transition-transform',
                          isActive(song) ? 'bg-white text-[#d80d63]' : 'bg-[#fff258] text-[#201a29]'
                        )}
                      >
                        {isActive(song) ? (
                          <Pause className="size-3 fill-current" />
                        ) : (
                          <Play className="ml-0.5 size-3 fill-current" />
                        )}
                      </button>
                      <a
                        href={getSongUrl(song)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate transition-colors hover:text-[#d80d63] hover:underline hover:underline-offset-2"
                      >
                        {song.title}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
              {todayDrops.length === 0 && (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-3xl border border-slate-950/8 bg-[#fffdf9]/70 p-8 text-center text-slate-600">
                  <Sparkles className="mb-2 size-8 text-pink-400" />
                  <p className="font-bold">More Drops are on their way.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
