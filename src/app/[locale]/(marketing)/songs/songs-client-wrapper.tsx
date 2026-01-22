'use client';

import { GallerySongCard } from '@/components/songs/gallery-song-card';
import { SongDetailModal } from '@/components/songs/song-detail-modal';
import type { Song } from '@/types/song';
import { useState } from 'react';

export function SongsClientWrapper({ songs }: { songs: Song[] }) {
  // Manual modal state removed in favor of Route Interception patterns
  return (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {songs.map((song) => (
        <GallerySongCard key={song.id} item={song} />
      ))}
    </div>
  );
}
