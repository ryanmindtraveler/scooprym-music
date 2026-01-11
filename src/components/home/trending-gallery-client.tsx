'use client';

import { SongDetailModal } from '@/components/songs/song-detail-modal';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { useEffect, useState } from 'react';
import { TrendingSongCard } from './trending-song-card';

interface TrendingGalleryClientProps {
  songs: Song[];
  currentPage: number;
  totalPages: number;
  initialSelectedSong?: Song | null;
}

export function TrendingGalleryClient({
  songs,
  currentPage,
  totalPages,
  initialSelectedSong = null,
}: TrendingGalleryClientProps) {
  const { currentSong, isPlaying: globalIsPlaying, play, togglePlay: globalTogglePlay } = usePlayerStore();
  const playingId = globalIsPlaying && currentSong ? currentSong.id : null;

  const [playsById, setPlaysById] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const song of songs) {
      initial[song.id] = song.plays;
    }
    return initial;
  });

  const [selectedSong, setSelectedSong] = useState<Song | null>(initialSelectedSong);
  const isGlobalLoading = false;

  useEffect(() => {
    setPlaysById((prev) => {
      const next: Record<string, number> = {};
      for (const song of songs) {
        next[song.id] = prev[song.id] ?? song.plays;
      }
      return next;
    });
  }, [songs]);

  const incrementPlays = async (songId: string) => {
    // Optimistic update
    setPlaysById((prev) => ({
      ...prev,
      [songId]: (prev[songId] || 0) + 1,
    }));

    try {
      await fetch(`/api/songs/${songId}/play`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to increment plays:', error);
    }
  };

  const togglePlay = async (song: Song) => {
    if (!song.audioUrl) return;

    if (currentSong?.id === song.id) {
      globalTogglePlay();
    } else {
      play({
        id: song.id,
        title: song.title,
        audioUrl: song.audioUrl,
        coverImageUrl: song.coverImageUrl,
        artist: 'AI Generated',
      });
      void incrementPlays(song.id);
    }
  };

  if (songs.length === 0) {
    return <div className="text-center text-muted-foreground py-10 font-medium">No trending music available yet.</div>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {songs.map((song) => (
        <TrendingSongCard
          key={song.id}
          song={song}
          isPlaying={playingId === song.id}
          isGlobalLoading={isGlobalLoading}
          plays={playsById[song.id] ?? song.plays}
          togglePlay={togglePlay}
          onSongClick={setSelectedSong}
        />
      ))}

      {selectedSong && (
        <SongDetailModal
          key={selectedSong.id}
          song={selectedSong}
          initialIsFavorite={selectedSong.isLiked ?? false}
          defaultOpen={true}
          navigationMode="manual"
          onClose={() => setSelectedSong(null)}
        />
      )}

      {/* Pagination Controls */}
      <div className="col-span-full mt-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`?page=${Math.max(1, currentPage - 1)}`}
                aria-disabled={currentPage <= 1}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {/* Simple Pagination Logic: Show all if small, or simplify */}
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              // Show first, last, current, and adjacent pages
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink href={`?page=${pageNum}`} isActive={currentPage === pageNum}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              // Ellipsis logic
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return null;
            })}

            <PaginationItem>
              <PaginationNext
                href={`?page=${Math.min(totalPages, currentPage + 1)}`}
                aria-disabled={currentPage >= totalPages}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
