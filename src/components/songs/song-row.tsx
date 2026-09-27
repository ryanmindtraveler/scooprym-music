'use client';

import type { SongItem } from '@/app/[locale]/(protected)/dashboard/mysongs/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import { formatBusinessDate } from '@/lib/shared/business-time';
import { cn } from '@/lib/utils';
import { Clock, Loader2, Music2, Pause, Play, Trash2 } from 'lucide-react';
import { memo } from 'react';

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
  extraContent?: React.ReactNode;
  songUrl?: string;
  hideDefaultActions?: boolean;
}

function SongRowBase({
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
  extraContent,
  songUrl,
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

  const isFailed = item.processingStatus?.startsWith('failed');
  const isPending =
    !isFailed &&
    (!item.audioUrl ||
      item.audioUrl === 'pending-stream' ||
      item.audioUrl === 'processing' ||
      item.processingStatus === 'processing');
  const hasAudio = Boolean(item.audioUrl) && item.audioUrl !== 'processing' && !isPending && !isFailed;

  return (
    <div
      className={cn(
        'group relative flex rounded-2xl border transition-all hover:shadow-md hover:shadow-purple-500/5 hover:-translate-y-0.5',
        extraContent ? 'flex-col' : 'items-center p-3',
        isPlaying
          ? 'bg-linear-to-r from-indigo-50/90 to-purple-50/90 border-indigo-200 dark:border-indigo-800 shadow-sm'
          : 'bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-white/10 shadow-sm hover:border-purple-300 dark:hover:border-purple-500/30'
      )}
    >
      {extraContent && <div className="min-w-0 p-4">{extraContent}</div>}
      <div
        className={cn(
          'flex w-full min-w-0 items-center gap-4',
          extraContent && 'flex-wrap border-t border-slate-100 px-4 py-3 md:flex-nowrap dark:border-white/10'
        )}
      >
        <div className="hidden sm:block w-8 shrink-0 text-center text-sm font-medium text-muted-foreground">
          {index}
        </div>
        <div className="relative group/cover shrink-0">
          <div
            className={cn(
              'flex items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 text-indigo-400 dark:text-indigo-300 overflow-hidden shadow-sm border border-white/50 dark:border-white/5',
              extraContent ? 'size-20 sm:size-24' : 'size-14'
            )}
          >
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

            {/* Status Overlay */}
            {(isPending || isFailed) && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                {isPending ? (
                  <Loader2 className="size-5 text-white animate-spin" />
                ) : (
                  <div className="text-[10px] font-bold text-red-400 bg-red-950/80 px-1 py-0.5 rounded">FAILED</div>
                )}
              </div>
            )}
          </div>

          {/* Play Overlay - Only show if valid audio */}
          {hasAudio && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-200',
                isPlaying ? 'bg-black/40 opacity-100' : 'bg-black/10 opacity-0 group-hover/cover:opacity-100'
              )}
            >
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  'rounded-full text-white hover:bg-white/20 hover:text-white',
                  extraContent ? 'size-11' : 'size-8'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayClick();
                }}
                disabled={!hasAudio}
                aria-label={isPlaying ? 'Pause song' : 'Play song'}
              >
                {isPlaying ? (
                  <Pause className={cn('fill-current', extraContent ? 'size-5' : 'size-4')} />
                ) : (
                  <Play className={cn('fill-current ml-0.5', extraContent ? 'size-5' : 'size-4')} />
                )}
              </Button>
            </div>
          )}
        </div>
        <div className={cn('min-w-0 flex-1', extraContent && 'basis-[calc(100%-6rem)] md:basis-auto')}>
          <button
            type="button"
            onClick={() => onSongClick(item)}
            className="truncate text-base font-semibold hover:underline hover:text-primary transition-colors text-left"
          >
            {item.title}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 sm:gap-x-4 text-[10px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              <span className="hidden xs:inline">
                {formatBusinessDate(item.createdAt, {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </span>
              <span className="xs:hidden">
                {formatBusinessDate(item.createdAt, {
                  month: '2-digit',
                  day: '2-digit',
                })}
              </span>
            </span>
            {item.durationSec ? <span>{formatDuration(item.durationSec)}</span> : null}
            <span className="hidden sm:flex items-center gap-1">
              <Play className="size-3" /> {item.plays} plays
            </span>
          </div>
          {songUrl && (
            <a
              href={songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block w-fit max-w-full break-all text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {songUrl}
            </a>
          )}
          {extraContent && actionEnd && <div className="mt-3 flex flex-wrap items-center gap-2">{actionEnd}</div>}
        </div>
        {(!extraContent || !hideDefaultActions || onDelete) && (
          <div className="ml-auto flex items-center gap-2">
            {!extraContent && actionEnd}
            {!hideDefaultActions && (
              <div className="flex items-center gap-1 sm:gap-2">
                <LikeButton songId={item.id} initialIsLiked={isLiked} className="size-8 sm:size-9" />
                <ShareButton
                  songId={item.id}
                  seoSlug={item.seoSlug}
                  songTitle={item.title}
                  newsSummary={item.newsSummary}
                  sourceText={item.sourceText}
                  className="size-8 sm:size-9"
                />
                <DownloadButton audioUrl={item.audioUrl} title={item.title} className="size-8 sm:size-9" />
              </div>
            )}

            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                    disabled={isDeleting}
                    aria-label="Delete song"
                  >
                    {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this song?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your song and remove it from our
                      servers.
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
        )}
      </div>
    </div>
  );
}

export const SongRow = memo(SongRowBase, (prev, next) => {
  return (
    prev.index === next.index &&
    prev.item === next.item &&
    prev.isPlaying === next.isPlaying &&
    prev.isDeleting === next.isDeleting &&
    prev.isLiked === next.isLiked &&
    prev.extraContent === next.extraContent &&
    prev.songUrl === next.songUrl &&
    prev.actionEnd === next.actionEnd &&
    prev.hideDefaultActions === next.hideDefaultActions
  );
});

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border p-3 border-purple-100/60 dark:border-white/5 bg-linear-to-r from-white/90 to-purple-50/40 dark:from-zinc-900/90 dark:to-zinc-900/50">
      <div className="hidden sm:flex w-8 shrink-0 justify-center">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="relative shrink-0">
        <Skeleton className="size-14 rounded-xl" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-5 w-48 mb-2">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
      </div>
    </div>
  );
}
