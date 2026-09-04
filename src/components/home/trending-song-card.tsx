'use client';

import { DownloadButton } from '@/components/songs/actions/download-button';
import { LikeButton } from '@/components/songs/actions/like-button';
import { ShareButton } from '@/components/songs/actions/share-button';
import { formatBusinessDate } from '@/lib/business-time';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { Clock, Loader2, Music2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

interface TrendingSongCardProps {
  song: Song;
  isPlaying: boolean;
  isGlobalLoading: boolean;
  plays: number;
  togglePlay: (song: Song) => void;
  onSongClick: (song: Song) => void;
}

export function TrendingSongCard({
  song,
  isPlaying,
  isGlobalLoading,
  plays,
  togglePlay,
  onSongClick,
}: TrendingSongCardProps) {
  const { isCurrentLoading } = { isCurrentLoading: isPlaying && isGlobalLoading };

  const lyricsLines = (song.lyrics ?? '')
    .split('\n')
    .map((l) => l.replace(/\[[^\]]+\]/gi, '').trim())
    .filter(Boolean);
  const lyricsDescription = lyricsLines[0] ?? '';
  const baseDescription = (song.newsSummary ?? '').trim() || lyricsDescription || (song.prompt ?? '').trim();
  const maxLength = 120;
  const needsTruncate = baseDescription.length > maxLength;
  let desc = needsTruncate ? baseDescription.slice(0, maxLength - 3) : baseDescription;
  desc = desc.replace(/[,\.\?!;:，。！？；：、…]+$/u, '');
  let description = desc || '';
  if (!description) description = song.title;
  else if (needsTruncate) description = `${description}...`;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:border-indigo-100 dark:hover:border-indigo-900/50">
      {/* Cover Image Area */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {song.coverImageUrl ? (
          <img
            src={song.coverImageUrl}
            alt={song.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-800">
            <img
              src="/images/funny-censored-fallback.png"
              alt="No Cover"
              className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />

            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest shadow-sm">
                Audio Only
              </div>
            </div>
          </div>
        )}

        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-60" />

        <div className="absolute top-3 left-3 z-10">
          <span
            suppressHydrationWarning
            className="translate-no inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xl border border-white/10 shadow-sm"
          >
            {song.category || 'News'}
          </span>
        </div>

        {/* Play Button - Center Splash */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePlay(song);
            }}
            className={cn(
              'pointer-events-auto group/play flex size-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 hover:scale-110 hover:bg-white hover:text-indigo-600 shadow-xl',
              isPlaying
                ? 'scale-100 opacity-100 bg-white text-indigo-600 shadow-indigo-500/20'
                : 'scale-90 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
            )}
            disabled={!song.audioUrl}
          >
            {isCurrentLoading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="size-6 fill-current" />
            ) : (
              <Play className="size-6 fill-current ml-1" />
            )}
          </button>
        </div>

        {/* --- NEW ACTION BUTTONS (Top Right) --- */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 delay-75">
          <LikeButton
            songId={song.id}
            initialIsLiked={song.isLiked}
            className="bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-pink-500 hover:border-pink-500 hover:text-white size-8 rounded-full shadow-lg"
          />
          <ShareButton
            songId={song.id}
            songTitle={song.title}
            className="bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-blue-500 hover:border-blue-500 hover:text-white size-8 rounded-full shadow-lg"
          />
          {song.audioUrl && (
            <DownloadButton
              audioUrl={song.audioUrl}
              title={song.title}
              className="bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-emerald-500 hover:border-emerald-500 hover:text-white size-8 rounded-full shadow-lg"
            />
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex gap-2 z-10">
          <div className="flex items-center gap-3 text-xs font-semibold text-white/90 drop-shadow-md">
            <div className="flex items-center gap-1">
              <Clock className="size-3.5" />
              <span>
                {song.createdAt ? formatBusinessDate(song.createdAt, { month: 'short', day: 'numeric' }) : 'Now'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Play className="size-3.5 fill-current" />
              <span>{plays}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between px-4 py-4 bg-white dark:bg-slate-900">
        <div>
          <h3 className="line-clamp-1 text-[1.05rem] font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <button
              type="button"
              onClick={() => onSongClick(song)}
              className="focus:outline-none text-left w-full truncate"
            >
              <span className="absolute inset-0 z-0" aria-hidden="true" />
              {song.title}
            </button>
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
