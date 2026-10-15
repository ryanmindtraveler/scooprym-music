'use client';

import { SongCoverImage } from '@/components/songs/song-cover-image';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { Routes } from '@/routes';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowUpRight, Clock3, Headphones, Music2, Pause, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export interface RecentListeningSong extends Song {
  lastPlayedAt: Date | string;
}

interface RecentListeningListProps {
  songs: RecentListeningSong[];
  startIndex?: number;
  mode?: 'recent' | 'saved';
}

export function RecentListeningList({ songs, startIndex = 0, mode = 'recent' }: RecentListeningListProps) {
  const t = useTranslations('Dashboard.activity');
  const dateLocale = enUS;
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);

  if (songs.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 text-center shadow-sm backdrop-blur-lg">
        <div className="flex size-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
          <Headphones className="size-7" />
        </div>
        <h3 className="mt-5 text-xl font-black text-slate-900">
          {mode === 'saved' ? t('noSavedSongs') : t('nothingPlayed')}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {mode === 'saved' ? t('saveHint') : t('playHint')}
        </p>
        <Link
          href={Routes.Gallery}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          {t('exploreGallery')} <ArrowUpRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/78 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.5)] backdrop-blur-xl">
      <div className="hidden grid-cols-[42px_76px_minmax(0,1fr)_170px_52px] items-center gap-4 border-b border-slate-200/80 bg-slate-50/75 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 md:grid">
        <span>{t('number')}</span>
        <span>{t('cover')}</span>
        <span>{t('storyAndSong')}</span>
        <span>{mode === 'saved' ? t('saved') : t('lastPlayed')}</span>
        <span className="sr-only">{t('playback')}</span>
      </div>

      <ol className="divide-y divide-slate-200/75">
        {songs.map((song, index) => {
          const songUrl = `/songs/${getSongCanonicalSlug(song)}`;
          const isCurrentSong = currentSong?.id === song.id;
          const isCurrentSongPlaying = isCurrentSong && isPlaying;
          const summary = song.newsSummary?.trim() || song.sourceText?.trim() || t('openStory');
          const playedAt = new Date(song.lastPlayedAt);
          const playedAgo = formatDistanceToNow(playedAt, { addSuffix: true, locale: dateLocale });
          const exactPlayedAt = format(playedAt, 'MMM d, h:mm a', { locale: dateLocale });

          const togglePlay = () => {
            if (isCurrentSongPlaying) {
              pause();
              return;
            }
            if (!song.audioUrl) return;
            play({
              id: song.id,
              title: song.title,
              audioUrl: song.audioUrl,
              seoSlug: song.seoSlug,
              coverImageUrl: song.coverImageUrl,
              artist: 'ScoopRYM',
              newsSummary: song.newsSummary || undefined,
              newsContent: song.sourceText || undefined,
              newsLink: song.sourceUrl || undefined,
            });
          };

          return (
            <li
              key={song.id}
              className="group grid grid-cols-[68px_minmax(0,1fr)_44px] items-center gap-3 px-4 py-4 transition-colors hover:bg-cyan-50/45 md:grid-cols-[42px_76px_minmax(0,1fr)_170px_52px] md:gap-4 md:px-5"
            >
              <span className="hidden font-mono text-xs font-black text-pink-500 md:block">
                {String(startIndex + index + 1).padStart(2, '0')}
              </span>

              <Link
                href={songUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative size-[68px] overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-900/5 md:size-[76px]"
              >
                <SongCoverImage
                  src={song.coverImageUrl || '/images/funny-censored-fallback.png'}
                  alt=""
                  sizes="76px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              <div className="min-w-0">
                <Link
                  href={songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 transition-colors hover:text-pink-700 md:text-[15px]"
                >
                  {summary}
                </Link>
                <div className="mt-1.5 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                  <Music2 className="size-3.5 shrink-0 text-pink-600" />
                  <span className="truncate font-semibold">{song.title}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 md:hidden">
                  <Clock3 className="size-3" />
                  <span>{mode === 'saved' ? t('savedAgo', { time: playedAgo }) : playedAgo}</span>
                </div>
              </div>

              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-700">
                  {mode === 'saved' ? t('savedAgo', { time: playedAgo }) : playedAgo}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">{exactPlayedAt}</p>
              </div>

              <button
                type="button"
                onClick={togglePlay}
                disabled={!song.audioUrl}
                aria-label={
                  isCurrentSongPlaying ? t('pauseSong', { title: song.title }) : t('playSong', { title: song.title })
                }
                className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:scale-105 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCurrentSongPlaying ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="ml-0.5 size-4 fill-current" />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
