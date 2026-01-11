'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ban, Play } from 'lucide-react';
import type { LiveSong } from './types';

export function LiveSongFeed({ songs }: { songs: LiveSong[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live Generation Feed</CardTitle>
        <CardDescription>Real-time stream of newly created songs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {songs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <p className="text-sm">No live activity detected.</p>
          </div>
        )}
        {songs.map((song) => (
          <div key={song.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
            <div className="flex items-center space-x-4">
              <div className="relative h-12 w-12 rounded-md overflow-hidden bg-secondary">
                {song.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={song.coverImageUrl} alt={song.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium leading-none">{song.title}</p>
                <div className="flex items-center pt-1 gap-2">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={song.user?.image || ''} />
                    <AvatarFallback>{(song.user?.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground">
                    {song.user?.name || 'Anonymous'} ·{' '}
                    <span suppressHydrationWarning>{new Date(song.createdAt).toLocaleTimeString()}</span>
                  </p>
                </div>
                {song.tags && (
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] truncate">{song.tags}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Play className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Ban className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
