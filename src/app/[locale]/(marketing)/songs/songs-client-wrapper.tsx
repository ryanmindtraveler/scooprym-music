'use client';

import { GallerySongCard } from '@/components/songs/gallery-song-card';
import { SongDetailModal } from '@/components/songs/song-detail-modal';
import type { Song } from '@/types/song';
import { useState } from 'react';

export function SongsClientWrapper({ songs }: { songs: Song[] }) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  return (
    <>
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {songs.map((song) => (
          <GallerySongCard key={song.id} item={song} onSongClick={setSelectedSong} />
        ))}
      </div>

      {selectedSong && (
        <SongDetailModal
          key={selectedSong.id}
          song={selectedSong}
          initialIsFavorite={false} // Would need to fetch status to be accurate, defaulting false for public browse
          defaultOpen={true}
          navigationMode="manual"
          onClose={() => setSelectedSong(null)}
          hideActions={false}
        />
      )}
    </>
  );
}
