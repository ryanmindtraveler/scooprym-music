'use client';

import { GallerySongCard } from '@/components/songs/gallery-song-card';
import type { Song } from '@/types/song';

export function SongsClientWrapper({ songs }: { songs: Song[] }) {
  if (songs.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-[#17151f]/12 bg-[#fffdf9] p-10 text-base font-semibold text-slate-600">
        The story archive is waiting for its first published Drop.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
      {songs.map((song, index) => (
        <GallerySongCard key={song.id} item={song} priority={index < 4} />
      ))}
    </div>
  );
}
