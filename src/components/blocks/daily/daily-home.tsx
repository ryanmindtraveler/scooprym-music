'use client';

import { getSourceUrl } from '@/lib/urls/source-url';

import { getNewsCardSummary, getNewsDescription } from '@/lib/songs/song-editorial';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { ArrowUpRight, Disc3, ExternalLink, Flame, Globe, Music2, Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface DailyHomeProps {
  songs: Song[];
  freshnessLabel?: string;
  hasNewToday?: boolean;
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
    newsLink: getSourceUrl(song.sourceUrl) || undefined,
  };
}

function getNewsSummary(song: Song) {
  return getNewsCardSummary(song);
}

function getSourceDomain(url?: string | null) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
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
          sizes="(min-width: 1024px) 45vw, 95vw"
          className="object-cover transition-transform duration-500 ease-out group-hover/media:scale-[1.03] motion-reduce:transition-none motion-reduce:transform-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-cyan-400 via-violet-500 to-pink-500">
          <Music2 className="size-16 text-[#fffdf8]/80" />
        </div>
      )}
    </div>
  );
}

function SoundwaveEqualizer({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-0.5 px-1 text-current" aria-hidden="true">
      <span className="h-2 w-0.5 animate-[pulse_0.6s_ease-in-out_infinite] rounded-full bg-current" />
      <span className="h-3.5 w-0.5 animate-[pulse_0.8s_ease-in-out_infinite_0.15s] rounded-full bg-current" />
      <span className="h-4.5 w-0.5 animate-[pulse_0.7s_ease-in-out_infinite_0.3s] rounded-full bg-current" />
      <span className="h-2.5 w-0.5 animate-[pulse_0.9s_ease-in-out_infinite_0.2s] rounded-full bg-current" />
    </span>
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
          ? 'bg-[#17151f]/35'
          : 'bg-[#17151f]/15 lg:bg-transparent lg:group-hover/media:bg-[#17151f]/30 lg:group-focus-within/media:bg-[#17151f]/30'
      )}
    >
      <span
        className={cn(
          'pointer-events-none relative flex items-center justify-center rounded-full bg-[#fffdf8] text-[#d80d63] shadow-[0_12px_35px_rgba(23,21,31,0.35)] transition-[opacity,transform,background-color] duration-300 ease-out',
          size === 'large' ? 'size-18 md:size-22' : 'size-12 md:size-14',
          active
            ? 'scale-100 opacity-100 ring-4 ring-[#d80d63]/30'
            : 'scale-100 opacity-100 lg:scale-90 lg:opacity-0 lg:group-hover/media:scale-100 lg:group-hover/media:opacity-100 lg:group-focus-within/media:scale-100 lg:group-focus-within/media:opacity-100'
        )}
        aria-hidden="true"
      >
        {active ? (
          <Pause className={cn('fill-current', size === 'large' ? 'size-8 md:size-9' : 'size-5 md:size-6')} />
        ) : (
          <Play className={cn('ml-1 fill-current', size === 'large' ? 'size-8 md:size-9' : 'size-5 md:size-6')} />
        )}
      </span>
    </button>
  );
}

export function DailyHome({ songs, freshnessLabel = 'Latest Drops', hasNewToday = false }: DailyHomeProps) {
  const { currentSong, isPlaying, play, pause } = usePlayerStore();
  const featured = songs[0];
  // 首页今日区固定为 1 首左侧主打加 3 首右侧内容。
  const todayDrops = songs.slice(1, 4);

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
        className="relative z-20 overflow-hidden bg-[linear-gradient(90deg,#06b6d4_0%,#a78bfa_50%,#f472b6_100%)] px-4 py-32"
      >
        <div className="relative z-10 mx-auto max-w-4xl rounded-[3rem] border border-slate-950/8 bg-[#fffdf9] p-12 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <Sparkles className="mx-auto mb-6 size-12 text-pink-500" />
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950">
            Today’s Drops are warming up.
          </h2>
          <p className="mt-4 text-xl font-medium text-slate-600">
            Come back soon for the internet’s next musical meltdown.
          </p>
        </div>
      </section>
    );
  }

  const leadDescription = getNewsDescription(featured);
  const leadDomain = getSourceDomain(getSourceUrl(featured.sourceUrl));

  return (
    <main className="relative z-20 overflow-hidden bg-[linear-gradient(90deg,#06b6d4_0%,#a78bfa_50%,#f472b6_100%)] text-[#fffdf8]">
      <section id="today" className="relative scroll-mt-20 px-4 py-18 sm:py-24 md:px-8 md:py-28 2xl:px-12">
        <span id="generator" className="absolute -top-24" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1760px]">
          {/* Header Bar */}
          <div className="mb-7 flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between md:mb-10">
            <div className="flex flex-wrap items-center gap-3.5">
              <h2 className="text-4xl font-black tracking-tight drop-shadow-xs sm:text-5xl md:text-6xl">
                {hasNewToday ? 'Today’s Drops' : 'Latest Drops'}
              </h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-4 py-1.5 text-xs sm:text-sm font-black uppercase tracking-widest text-white shadow-xs backdrop-blur-md">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-300 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-[#d80d63]" />
                </span>
                {freshnessLabel}
              </span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] xl:gap-9 items-stretch">
            {/* Featured / Lead Story Drop (Left Card) */}
            <article
              className={cn(
                'group/hero flex flex-col overflow-hidden rounded-[2.25rem] border bg-[#fffdf9]/98 backdrop-blur-md shadow-[0_28px_80px_rgba(60,34,82,0.18)] transition-all duration-300 hover:shadow-[0_36px_90px_rgba(216,13,99,0.25)] md:grid md:grid-cols-[1.1fr_0.9fr] dark:border-white/12 dark:bg-[#201a2b]/95',
                isActive(featured)
                  ? 'border-[#d80d63] ring-2 ring-[#d80d63]/40'
                  : 'border-white/90 hover:border-[#d80d63]/40'
              )}
            >
              {/* Media Image Side */}
              <div className="group/media relative min-h-[340px] sm:min-h-[440px] md:min-h-[520px] lg:min-h-full">
                {/* Top Badge */}
                <div className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#17151f]/85 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-amber-300 shadow-xl backdrop-blur-md">
                  <Sparkles className="size-4 fill-amber-400 text-amber-400" />
                  #1 Headline Drop
                </div>

                <Cover song={featured} priority className="absolute inset-0" />
                <CoverPlayOverlay
                  active={isActive(featured)}
                  label={isActive(featured) ? 'Pause featured story' : 'Play featured story'}
                  onClick={() => toggleSong(featured)}
                  size="large"
                />
              </div>

              {/* Story Content Side */}
              <div className="flex flex-col justify-between p-7 sm:p-8 md:p-9 xl:p-10">
                <div className="space-y-4.5">
                  {/* Top Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-white/8">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d80d63]/10 px-2.5 py-1 text-[0.75rem] font-black uppercase tracking-[0.14em] text-[#d80d63]">
                        Lead Story
                      </span>
                      {leadDomain && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-slate-400">
                          <Globe className="size-3.5" />
                          {leadDomain}
                        </span>
                      )}
                    </div>

                    {getSourceUrl(featured.sourceUrl) && (
                      <a
                        href={getSourceUrl(featured.sourceUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-black text-slate-500 transition-colors hover:text-[#d80d63] dark:text-slate-300"
                      >
                        Read source <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Headline Title */}
                  <a
                    href={getSongUrl(featured)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group/title"
                  >
                    <h2 className="line-clamp-3 text-xl font-black leading-[1.32] tracking-[-0.025em] text-[#201a29] transition-colors group-hover/title:text-[#d80d63] sm:text-2xl lg:text-[1.75rem] xl:text-[2rem] dark:text-[#fffdf8]">
                      {getNewsSummary(featured)}
                    </h2>
                  </a>

                  {/* Editorial Excerpt & Vibe Pill */}
                  {leadDescription && (
                    <p className="line-clamp-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                      {leadDescription}
                    </p>
                  )}

                  {/* Tag Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/20 bg-pink-500/10 px-3.5 py-1 text-xs font-bold text-pink-700 dark:text-pink-300">
                      <Disc3 className="size-3.5 animate-spin text-pink-600" style={{ animationDuration: '4s' }} />
                      AI Hit Single
                    </span>
                    {featured.plays > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Flame className="size-3.5 text-amber-600" />
                        {featured.plays} Plays
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      Full Audio Drop
                    </span>
                  </div>
                </div>

                {/* Bottom Interactive Music Player Card */}
                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/8">
                  <div
                    className={cn(
                      'flex w-full min-w-0 items-center gap-4 rounded-2xl border p-4 sm:p-4.5 text-left transition-all duration-300',
                      isActive(featured)
                        ? 'border-[#d80d63]/40 bg-[#d80d63] text-white shadow-xl'
                        : 'border-[#201a29]/10 bg-[#f0faf9] text-[#201a29] hover:border-[#d80d63]/30 hover:bg-[#e7f7f5] dark:border-white/10 dark:bg-[#162a2d] dark:text-[#fffdf8]'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSong(featured)}
                      aria-label={isActive(featured) ? `Pause ${featured.title}` : `Play ${featured.title}`}
                      className={cn(
                        'flex size-13 sm:size-14 shrink-0 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105 active:scale-95 shadow-md',
                        isActive(featured) ? 'bg-white text-[#d80d63]' : 'bg-[#fff258] text-[#201a29]'
                      )}
                    >
                      {isActive(featured) ? (
                        <Pause className="size-5.5 fill-current" />
                      ) : (
                        <Play className="ml-1 size-5.5 fill-current" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <SoundwaveEqualizer active={isActive(featured)} />
                        <a
                          href={getSongUrl(featured)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-base sm:text-lg font-black transition-colors hover:text-[#d80d63] hover:underline"
                        >
                          {featured.title}
                        </a>
                      </div>
                      <p
                        className={cn(
                          'text-xs sm:text-[13px] font-medium transition-colors',
                          isActive(featured) ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
                        )}
                      >
                        ScoopRYM Originals · AI Mastered
                      </p>
                    </div>

                    <a
                      href={getSongUrl(featured)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'hidden sm:inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-black shrink-0 transition-colors',
                        isActive(featured)
                          ? 'bg-white/20 text-white hover:bg-white/30'
                          : 'bg-white text-[#201a29] border border-slate-200 hover:text-[#d80d63] dark:bg-white/10 dark:text-white dark:border-transparent'
                      )}
                    >
                      Lyrics <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </article>

            {/* Secondary Drops List (Right Column) */}
            <div className="flex flex-col gap-4.5 justify-between">
              {todayDrops.map((song, index) => {
                const domain = getSourceDomain(getSourceUrl(song.sourceUrl));
                return (
                  <article
                    key={song.id}
                    className={cn(
                      'group grid overflow-hidden rounded-4xl border bg-[#fffdf9]/98 backdrop-blur-md shadow-[0_16px_40px_rgba(60,34,82,0.12)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(60,34,82,0.18)] grid-cols-[135px_1fr] sm:grid-cols-[170px_1fr] xl:grid-cols-[190px_1fr] dark:border-white/10 dark:bg-[#201a2b]/95 flex-1',
                      isActive(song)
                        ? 'border-[#d80d63] ring-2 ring-[#d80d63]/40'
                        : 'border-white/90 hover:border-[#d80d63]/40'
                    )}
                  >
                    {/* Media Thumbnail */}
                    <div className="group/media relative min-h-40 sm:min-h-[180px] h-full">
                      <span className="absolute top-3 left-3 z-20 rounded-full border border-white/20 bg-[#17151f]/85 px-2.5 py-0.5 text-[0.68rem] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-md">
                        Drop #{index + 2}
                      </span>

                      <Cover song={song} className="absolute inset-0 size-full" />
                      <CoverPlayOverlay
                        active={isActive(song)}
                        label={isActive(song) ? 'Pause story' : 'Play story'}
                        onClick={() => toggleSong(song)}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col justify-between p-4 sm:p-5.5">
                      <div>
                        {/* Meta row */}
                        <div className="flex items-center justify-end gap-2 text-xs">
                          {getSourceUrl(song.sourceUrl) && (
                            <a
                              href={getSourceUrl(song.sourceUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#d80d63] dark:text-slate-400"
                            >
                              {domain || 'Source'} <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>

                        {/* Title */}
                        <a
                          href={getSongUrl(song)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block group/subtitle"
                        >
                          <h3 className="line-clamp-2 text-sm sm:text-base lg:text-[1.05rem] font-black leading-snug text-[#201a29] transition-colors group-hover/subtitle:text-[#d80d63] dark:text-[#fffdf8]">
                            {getNewsSummary(song)}
                          </h3>
                        </a>
                      </div>

                      {/* Mini Player */}
                      <div
                        className={cn(
                          'mt-3.5 inline-flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs sm:text-[13px] font-black transition-all duration-200',
                          isActive(song)
                            ? 'border-[#d80d63]/40 bg-[#d80d63] text-white shadow-sm'
                            : 'border-slate-200/80 bg-slate-100/90 text-[#201a29] hover:border-[#d80d63]/30 hover:bg-[#ffdce9] dark:border-white/10 dark:bg-white/10 dark:text-[#fffdf8]'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSong(song)}
                          aria-label={isActive(song) ? `Pause ${song.title}` : `Play ${song.title}`}
                          className={cn(
                            'flex size-7 sm:size-7.5 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 shadow-2xs',
                            isActive(song) ? 'bg-white text-[#d80d63]' : 'bg-[#fff258] text-[#201a29]'
                          )}
                        >
                          {isActive(song) ? (
                            <Pause className="size-3.5 fill-current" />
                          ) : (
                            <Play className="ml-0.5 size-3.5 fill-current" />
                          )}
                        </button>
                        <SoundwaveEqualizer active={isActive(song)} />
                        <a
                          href={getSongUrl(song)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 truncate text-xs sm:text-[13px] font-black transition-colors hover:text-[#d80d63] hover:underline"
                        >
                          {song.title}
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}

              {todayDrops.length === 0 && (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-slate-950/8 bg-[#fffdf9]/70 p-8 text-center text-slate-600">
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
