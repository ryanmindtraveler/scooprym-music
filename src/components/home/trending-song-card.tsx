'use client';

import { DownloadButton } from '@/components/songs/actions/download-button';
import { LikeButton } from '@/components/songs/actions/like-button';
import { ShareButton } from '@/components/songs/actions/share-button';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { format } from 'date-fns';
import { Clock, Loader2, Music2, Pause, Play } from 'lucide-react';
import { useLocale } from 'next-intl';
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
  const locale = useLocale();
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
    <div className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-transparent hover:border-violet-500/20">
      {/* Cover Image Area */}
      <div className="relative aspect-4/3 w-full overflow-hidden">
        {song.coverImageUrl ? (
          <img
            src={song.coverImageUrl}
            alt={song.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20">
            <img src="/images/funny-censored-fallback.png" alt="Censored" className="size-full object-cover opacity-80" />
            <div className="absolute bottom-4 inset-x-0 bg-black/40 backdrop-blur-sm py-2 text-[10px] font-black text-center text-white uppercase tracking-widest px-2">
              Content flagged: Too hot for AI art
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/10">
            {song.category || 'Music'}
          </span>
        </div>

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePlay(song);
            }}
            className={cn(
              'pointer-events-auto group/play flex size-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white transition-all duration-300 hover:scale-110 hover:bg-white hover:text-violet-600 shadow-lg',
              isPlaying
                ? 'scale-100 opacity-100 bg-white text-violet-600'
                : 'scale-100 opacity-80 group-hover:opacity-100'
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
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2 translate-x-10 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <LikeButton
            songId={song.id}
            initialIsLiked={song.isLiked}
            className="bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-pink-500 hover:border-pink-500 hover:text-white size-8"
          />
          <ShareButton
            songId={song.id}
            className="bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-blue-500 hover:border-blue-500 hover:text-white size-8"
          />
          {song.audioUrl && (
            <DownloadButton
              audioUrl={song.audioUrl}
              title={song.title}
              className="bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-green-500 hover:border-green-500 hover:text-white size-8"
            />
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex gap-2 z-10">
          <div className="flex items-center gap-3 text-xs font-medium text-white/90">
            <div className="flex items-center gap-1">
              <Clock className="size-3.5" />
              <span>{song.createdAt ? format(new Date(song.createdAt), 'MMM d') : 'Just now'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Play className="size-3.5 fill-current" />
              <span>{plays}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between px-3 py-2 bg-white dark:bg-zinc-900 border-t border-transparent dark:border-white/5">
        <div>
          <h3 className="line-clamp-1 text-base font-bold tracking-tight text-gray-900 group-hover:text-violet-600 transition-colors dark:text-gray-100">
            <button type="button" onClick={() => onSongClick(song)} className="focus:outline-none text-left">
              <span className="absolute inset-0 z-0" aria-hidden="true" />
              {song.title}
            </button>
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
