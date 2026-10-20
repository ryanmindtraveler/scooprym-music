'use client';

import type { SongItem } from '@/app/[locale]/(protected)/dashboard/mysongs/types';
import { SongPublicationSettings } from '@/components/admin/song-publication-settings';
import { SongSourcePreview } from '@/components/admin/song-source-preview';
import { SongDetailDialog } from '@/components/songs/song-detail-dialog';
import { SongRow } from '@/components/songs/song-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useRetrySongCover,
  useSaveSongPlacement,
  useSchedulePublish,
  useTogglePublish,
} from '@/hooks/admin/use-admin-songs';
import { formatBusinessDateTime, parseBusinessDateTimeInput } from '@/lib/shared/business-time';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { getCanonicalBaseUrl } from '@/lib/urls/urls';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import type { SortingState } from '@tanstack/react-table';
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  ListMusic,
  Loader2,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SongsTableProps {
  data: SongItem[];
  total: number;
  pageIndex: number;
  pageSize: number;
  search: string;
  status: 'all' | 'published' | 'scheduled' | 'unpublished';
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
  const { mutate: retryCover } = useRetrySongCover();
  const placementMutation = useSaveSongPlacement();
  const { mutate: schedulePublish, isPending: isScheduling } = useSchedulePublish();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [retryingCoverId, setRetryingCoverId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
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

  const submitSchedule = (songId: string) => {
    if (!scheduledAt) return;
    const californiaSchedule = parseBusinessDateTimeInput(scheduledAt);
    if (!californiaSchedule) {
      toast.error('Choose a valid California date and time.');
      return;
    }
    schedulePublish(
      { songId, scheduledAt: californiaSchedule.toISOString() },
      {
        onSuccess: () => {
          setSchedulingId(null);
          setScheduledAt('');
        },
      }
    );
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

  const handleRetryCover = (songId: string) => {
    setRetryingCoverId(songId);
    retryCover(songId, {
      onSettled: () => setRetryingCoverId(null),
    });
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
          <TabsList className="bg-muted/50 p-1 h-10 w-full sm:w-auto grid grid-cols-4 sm:flex">
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
              value="scheduled"
              className="gap-2 px-4 shadow-none data-[state=active]:bg-background data-[state=active]:text-violet-600 data-[state=active]:shadow-sm transition-all text-muted-foreground"
            >
              <CalendarClock className="h-4 w-4" />
              <span>Scheduled</span>
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
          data.map((song, i) => {
            const canPublish = Boolean(song.audioUrl) && !song.processingStatus?.startsWith('failed');
            return (
              <SongRow
                key={song.id}
                index={pageIndex * pageSize + i + 1}
                item={song}
                isPlaying={globalIsPlaying && currentSong?.id === song.id}
                onPlayClick={() => handlePlayClick(song)}
                onSongClick={(item) => setSelectedSong(item)}
                hideDefaultActions={true}
                extraContent={<SongSourcePreview item={song} />}
                songUrl={`${getCanonicalBaseUrl()}/songs/${getSongCanonicalSlug(song)}`}
                // Admin doesn't have Delete/Like typically, or maybe Like is global?
                // Keeping Like logic simply based on isLiked prop if backend provides it.
                // Admin typically doesn't delete from this view unless requested, keeping clean.
                // Insert 'Publish' toggle.
                actionEnd={
                  <div className="flex flex-wrap items-center gap-2">
                    <SongPublicationSettings
                      songId={song.id}
                      songTitle={song.title}
                      placement={{
                        publicationChannel: song.publicationChannel || 'gallery',
                        loreTopicSlug: song.loreTopicSlug || null,
                      }}
                      isPending={placementMutation.isPending}
                      onSave={async (placement) => {
                        await placementMutation.mutateAsync({ songId: song.id, placement });
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`gap-1.5 rounded-full transition-all ${
                        !song.coverImageUrl
                          ? 'border-amber-400/60 bg-amber-50/50 text-amber-700 hover:bg-amber-100/60 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      disabled={retryingCoverId === song.id}
                      onClick={() => handleRetryCover(song.id)}
                      title={song.coverImageUrl ? 'Regenerate cover art' : 'Retry generating cover art'}
                    >
                      {retryingCoverId === song.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="size-3.5" />
                      )}
                      {song.coverImageUrl ? 'Regen Cover' : 'Retry Cover'}
                    </Button>
                    {schedulingId === song.id ? (
                      <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-background px-2 py-1 shadow-sm">
                        <Input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(event) => setScheduledAt(event.target.value)}
                          className="h-8 w-[190px] border-0 px-2 text-xs shadow-none focus-visible:ring-0"
                          aria-label={`Schedule ${song.title}`}
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          PT
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8"
                          disabled={!scheduledAt || isScheduling}
                          onClick={() => submitSchedule(song.id)}
                        >
                          {isScheduling ? <Loader2 className="size-3.5 animate-spin" /> : 'Set'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setSchedulingId(null)}
                          aria-label="Close schedule editor"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-full"
                        disabled={!!song.isPublished || !canPublish}
                        onClick={() => {
                          setSchedulingId(song.id);
                          setScheduledAt('');
                        }}
                        title={
                          !canPublish
                            ? 'Cannot schedule until audio is ready and generation issues are resolved'
                            : undefined
                        }
                      >
                        <CalendarClock className="size-3.5" />
                        {song.scheduledAt ? formatBusinessDateTime(song.scheduledAt) : 'Schedule'}
                      </Button>
                    )}
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5',
                        !canPublish && !song.isPublished && 'opacity-60 cursor-not-allowed'
                      )}
                      title={
                        !canPublish && !song.isPublished
                          ? 'Cannot publish until audio is ready and generation issues are resolved'
                          : undefined
                      }
                    >
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
                        disabled={togglingId === song.id || (!song.isPublished && !canPublish)}
                        className="scale-90"
                      />
                    </div>
                  </div>
                }
              />
            );
          })
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
        <SongDetailDialog
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
