'use client';

import type { SongItem } from '@/app/[locale]/(protected)/songs/types';
import { DownloadButton } from '@/components/songs/actions/download-button';
import { LikeButton } from '@/components/songs/actions/like-button';
import { ShareButton } from '@/components/songs/actions/share-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, Loader2, Music2, Pause, Play, Trash2 } from 'lucide-react';

interface SongRowProps {
  index: number;
  item: SongItem;
  isPlaying: boolean;
  onPlayClick: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onSongClick: (song: SongItem) => void;
  isLiked?: boolean;
  actionEnd?: React.ReactNode;
  actionStart?: React.ReactNode;
  hideDefaultActions?: boolean;
}

export function SongRow({
  index,
  item,
  isPlaying,
  onPlayClick,
  onDelete,
  isDeleting,
  onSongClick,
  isLiked,
  actionEnd,
  actionStart,
  hideDefaultActions = false,
}: SongRowProps) {
  const formatDuration = (sec: number | null | undefined) => {
    if (!sec || sec <= 0) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const hasAudio = Boolean(item.audioUrl);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 rounded-2xl border p-3 transition-all hover:shadow-md hover:shadow-purple-500/5 hover:-translate-y-0.5',
        isPlaying
          ? 'bg-linear-to-r from-indigo-50/80 to-purple-50/80 border-indigo-200 dark:border-indigo-800'
          : 'bg-linear-to-r from-white/90 to-purple-50/40 dark:from-zinc-900/90 dark:to-zinc-900/50 border-purple-100/60 dark:border-white/5 hover:border-purple-200 dark:hover:border-white/10'
      )}
    >
      <div className="w-8 shrink-0 text-center text-sm font-medium text-muted-foreground">{index}</div>
      <div className="relative group/cover shrink-0">
        <div className="flex size-14 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 text-indigo-400 dark:text-indigo-300 overflow-hidden shadow-sm border border-white/50 dark:border-white/5">
          {item.coverImageUrl ? (
            <img src={item.coverImageUrl} alt={item.title} className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="relative size-full">
              <img src="/images/funny-censored-fallback.png" alt="Censored" className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[8px] font-bold text-center text-white/90 uppercase tracking-tighter">
                Too Hot for AI
              </div>
            </div>
          )}
        </div>

        {/* Play Overlay */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-200',
            isPlaying ? 'bg-black/40 opacity-100' : 'bg-black/10 opacity-100 hover:bg-black/40'
          )}
        >
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full text-white hover:bg-white/20 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onPlayClick();
            }}
            disabled={!hasAudio}
            aria-label={isPlaying ? 'Pause song' : 'Play song'}
          >
            {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
          </Button>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onSongClick(item)}
          className="truncate text-base font-semibold hover:underline hover:text-primary transition-colors text-left"
        >
          {item.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            })}
          </span>
          {item.durationSec ? <span>{formatDuration(item.durationSec)}</span> : null}
          <span className="flex items-center gap-1">
            <Play className="size-3" /> {item.plays} plays
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {actionEnd}
        {!hideDefaultActions && (
          <>
            <LikeButton songId={item.id} initialIsLiked={isLiked} className="size-9" />
            <ShareButton songId={item.id} className="size-9" />
            <DownloadButton audioUrl={item.audioUrl} title={item.title} className="size-9" />
          </>
        )}

        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this song?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your song and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    if (onDelete) onDelete();
                  }}
                  className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                >
                  {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
