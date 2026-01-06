'use client';

import type { SongItem } from '@/app/[locale]/(protected)/mysongs/types';
import { SongDetailModal } from '@/components/songs/song-detail-modal';
import { SongRow } from '@/components/songs/song-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTogglePublish } from '@/hooks/admin/use-admin-songs';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import type { SortingState } from '@tanstack/react-table';
import { CheckCircle2, ChevronLeft, ChevronRight, EyeOff, ListMusic, Loader2, Search } from 'lucide-react';
import { useState } from 'react';

interface SongsTableProps {
  data: SongItem[];
  total: number;
  pageIndex: number;
  pageSize: number;
  search: string;
  status: 'all' | 'published' | 'unpublished';
  sorting: SortingState;
  loading: boolean;
  onSearch: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortingChange: (sorting: SortingState) => void;
}

export function SongsTable({
  data,
  total,
  pageIndex,
  pageSize,
  search,
  status,
  loading,
  onSearch,
  onStatusChange,
  onPageChange,
  // sorting vars unused in list view but kept for interface compatibility
}: SongsTableProps) {
  const { currentSong, isPlaying: globalIsPlaying, play, pause } = usePlayerStore();
  const { mutate: togglePublish } = useTogglePublish();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongItem | null>(null);

  const totalPages = Math.ceil(total / pageSize);
  const currentPage = pageIndex + 1; // 1-based for display

  const handlePlayClick = (songItem: SongItem) => {
    if (currentSong?.id === songItem.id && globalIsPlaying) {
      pause();
    } else if (songItem.audioUrl) {
      play({
        id: songItem.id,
        title: songItem.title,
        audioUrl: songItem.audioUrl,
        coverImageUrl: songItem.coverImageUrl,
        artist: 'AI Generated',
      });
    }
  };

  const handlePublishToggle = (songId: string, currentStatus: boolean) => {
    setTogglingId(songId);
    togglePublish(
      { songId, isPublished: !currentStatus },
      {
        onSettled: () => setTogglingId(null),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search songs..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9 bg-background/50 border-purple-100/60 dark:border-white/5"
          />
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={status} onValueChange={onStatusChange} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50 p-1 h-10 w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger
              value="all"
              className="gap-2 px-4 shadow-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground"
            >
              <ListMusic className="h-4 w-4" />
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger
              value="published"
              className="gap-2 px-4 shadow-none data-[state=active]:bg-background data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all text-muted-foreground"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Published</span>
            </TabsTrigger>
            <TabsTrigger
              value="unpublished"
              className="gap-2 px-4 shadow-none data-[state=active]:bg-background data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all text-muted-foreground"
            >
              <EyeOff className="h-4 w-4" />
              <span>Hidden</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List Content */}
      <div className="space-y-4">
        {loading && data.length === 0 ? (
          <div className="py-20 flex justify-center text-muted-foreground">
            <Loader2 className="animate-spin size-8 text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
            No songs found.
          </div>
        ) : (
          data.map((song, i) => (
            <SongRow
              key={song.id}
              index={pageIndex * pageSize + i + 1}
              item={song}
              isPlaying={globalIsPlaying && currentSong?.id === song.id}
              onPlayClick={() => handlePlayClick(song)}
              onSongClick={(item) => setSelectedSong(item)}
              hideDefaultActions={true}
              // Admin doesn't have Delete/Like typically, or maybe Like is global?
              // Keeping Like logic simply based on isLiked prop if backend provides it.
              // Admin typically doesn't delete from this view unless requested, keeping clean.
              // Insert 'Publish' toggle.
              actionEnd={
                <div className="flex items-center gap-3 mr-4 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                  <Label
                    htmlFor={`publish-${song.id}`}
                    className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                  >
                    {song.isPublished ? 'Published' : 'Hidden'}
                  </Label>
                  <Switch
                    id={`publish-${song.id}`}
                    checked={!!song.isPublished}
                    onCheckedChange={() => handlePublishToggle(song.id, !!song.isPublished)}
                    disabled={togglingId === song.id}
                    className="scale-90"
                  />
                </div>
              }
            />
          ))
        )}
      </div>

      {/* Pagination (Simple 1-based logic to match My Songs) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex <= 0}
            className="gap-1 border-purple-100/60 dark:border-white/5"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <div className="text-sm font-medium text-muted-foreground mx-2">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={currentPage >= totalPages}
            className="gap-1 border-purple-100/60 dark:border-white/5"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Song Detail Modal */}
      {selectedSong && (
        <SongDetailModal
          song={selectedSong as unknown as Song}
          initialIsFavorite={false} // Admin view might not track favorites, defaulting to false
          defaultOpen={true}
          navigationMode="manual"
          onClose={() => setSelectedSong(null)}
          hideActions={false}
        />
      )}
    </div>
  );
}
