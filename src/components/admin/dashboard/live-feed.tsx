'use client';

import { SongCoverImage } from '@/components/songs/song-cover-image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Routes } from '@/routes';
import { usePlayerStore } from '@/store';
import { ArrowRight, Music, Pause, Play, Radio, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { LiveSong } from './types';

export function LiveSongFeed({ songs }: { songs: LiveSong[] }) {
  const t = useTranslations('Dashboard.admin.overview');
  const { currentSong, isPlaying, play, pause } = usePlayerStore();

  const togglePlay = (songItem: LiveSong) => {
    if (!songItem.audioUrl) return;
    if (currentSong?.id === songItem.id && isPlaying) {
      pause();
    } else {
      play({
        id: songItem.id,
        title: songItem.title,
        audioUrl: songItem.audioUrl,
        coverImageUrl: songItem.coverImageUrl,
        artist: songItem.user?.name || 'ScoopRYM',
      });
    }
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-border/80 bg-card py-0 shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <Radio className="size-4" />
          </span>
          <div>
            <CardTitle className="text-sm font-bold leading-none text-foreground">{t('liveFeed')}</CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t('liveFeedDescription')}</p>
          </div>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs font-bold text-pink-600 hover:text-pink-700 dark:text-pink-400"
        >
          <Link href={Routes.AdminSongs}>
            所有曲目 <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="divide-y divide-border/60 p-0">
        {songs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Sparkles className="mb-2 size-6 text-muted-foreground/60" />
            <p className="text-xs font-medium">{t('noLiveActivity')}</p>
          </div>
        )}

        <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
          {songs.slice(0, 10).map((song) => {
            const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
            const songSlug = `/songs/${song.id}`;

            return (
              <div
                key={song.id}
                className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/25"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* 专辑封面 */}
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted shadow-2xs">
                    {song.coverImageUrl ? (
                      <SongCoverImage
                        src={song.coverImageUrl}
                        alt={song.title}
                        sizes="44px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-pink-500/20 to-violet-500/20 text-pink-600">
                        <Music className="size-5" />
                      </div>
                    )}
                    {/* 悬浮/播放按钮 */}
                    {song.audioUrl && (
                      <button
                        type="button"
                        onClick={() => togglePlay(song)}
                        className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                          isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrentPlaying ? (
                          <Pause className="size-4 fill-white text-white" />
                        ) : (
                          <Play className="size-4 fill-white text-white ml-0.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* 歌曲信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={songSlug}
                        target="_blank"
                        className="truncate text-xs font-bold text-foreground hover:text-pink-600 hover:underline dark:hover:text-pink-400"
                      >
                        {song.title}
                      </Link>
                      {isCurrentPlaying && (
                        <span className="inline-flex items-end gap-0.5 h-3 shrink-0">
                          <span className="w-0.5 h-full bg-pink-600 rounded-full animate-pulse" />
                          <span
                            className="w-0.5 h-2/3 bg-pink-600 rounded-full animate-pulse"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="w-0.5 h-4/5 bg-pink-600 rounded-full animate-pulse"
                            style={{ animationDelay: '300ms' }}
                          />
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-3.5">
                          <AvatarImage src={song.user?.image || ''} />
                          <AvatarFallback className="text-[8px]">
                            {(song.user?.name?.[0] || 'U').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">{song.user?.name || t('anonymous')}</span>
                      </div>
                      <span>·</span>
                      <span suppressHydrationWarning>
                        {new Date(song.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 快捷试听/详情 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {song.audioUrl && (
                    <Button
                      variant={isCurrentPlaying ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePlay(song)}
                      className={`h-7 px-2.5 text-xs font-bold ${
                        isCurrentPlaying ? 'bg-pink-600 text-white hover:bg-pink-700' : ''
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <>
                          <Pause className="mr-1 size-3 fill-current" />
                          播放中
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 size-3 fill-current" />
                          试听
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
