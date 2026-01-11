'use client';

/**
 * @file songs-client.tsx
 * @description "我的歌曲"页面客户端组件
 *
 * 主要功能:
 * 1. 在标签页中显示三个歌曲列表:
 *    - My Creations (我的创作): 用户创建的歌曲 (从数据库获取).
 *    - Recently Listened (最近播放): 用户最近播放的歌曲 (从播放历史获取).
 *    - My Favorites (我的收藏): 用户收藏的歌曲.
 *
 * 2. 交互功能:
 *    - 音频播放: 通过 `usePlayerStore` 与全局播放器集成.
 *    - 分页: 处理客户端分页状态并从 `/api/songs/*` API 路由获取数据.
 *    - 歌曲操作: 点赞 (切换收藏), 分享 (复制链接), 下载, 删除 (仅限我的创作).
 *    - 详情视图: 点击歌曲标题时打开 `SongDetailModal`.
 *
 * 3. 状态管理:
 *    - 管理歌曲列表 (`data`)、播放次数 (`playsById`) 和分页 (`pages`, `totalPages`) 的本地状态.
 *    - 与全局播放器存储同步播放状态.
 */

import { DownloadButton } from '@/components/songs/actions/download-button';
import { LikeButton } from '@/components/songs/actions/like-button';
import { ShareButton } from '@/components/songs/actions/share-button';
import { SongDetailModal } from '@/components/songs/song-detail-modal';
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
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { ChevronLeft, ChevronRight, Clock, Heart, Loader2, Mic2, Music2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { SongItem } from './types';

interface SongsPageClientProps {
  creations: SongItem[];
  recent: SongItem[];
  favorites: SongItem[];
  userId?: string;
  initialPagination?: {
    creations: number;
    recent: number;
    favorites: number;
  };
}

import { SongRow, SongRowSkeleton } from '@/components/songs/song-row';

/**
 * 组件: SongRow - Moved to @/components/songs/song-row.tsx
 */

/**
 * 组件: SongsPageClient
 * @description "我的歌曲"页面的主要客户端组件.
 *
 * 职责:
 * - 标签页管理: 在创作、最近播放和收藏之间切换.
 * - 数据获取: 切换页面或标签页时从 API 获取分页数据.
 * - 播放控制: 使用全局播放器存储协调播放/暂停操作.
 * - 乐观更新: 本地更新播放次数和列表以提供即时反馈 (例如删除).
 */
export function SongsPageClient({ creations, recent, favorites, userId, initialPagination }: SongsPageClientProps) {
  const { currentSong, isPlaying: globalIsPlaying, play, pause } = usePlayerStore();

  const [playsById, setPlaysById] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const song of creations) {
      initial[song.id] = song.plays;
    }
    for (const song of recent) {
      if (initial[song.id] == null) {
        initial[song.id] = song.plays;
      }
    }
    for (const song of favorites) {
      if (initial[song.id] == null) {
        initial[song.id] = song.plays;
      }
    }
    return initial;
  });

  const [activeTab, setActiveTab] = useState('creations');
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [pages, setPages] = useState<Record<string, number>>({
    creations: 1,
    recent: 1,
    favorites: 1,
  });
  // Track if pagination has occurred for each tab to force refetch on page 1 return
  const [hasNavigated, setHasNavigated] = useState<Record<string, boolean>>({
    creations: false,
    recent: false,
    favorites: false,
  });

  const [totalPages, setTotalPages] = useState<Record<string, number>>({
    creations: initialPagination?.creations || 1,
    recent: initialPagination?.recent || 1,
    favorites: initialPagination?.favorites || 1,
  });

  // Data states
  const [data, setData] = useState<Record<string, SongItem[]>>({
    creations: creations,
    recent: recent,
    favorites: favorites,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongItem | null>(null);

  const fetchData = useCallback(async (tab: string, page: number) => {
    setLoading(true);
    try {
      const endpoint = tab === 'creations' ? '/api/songs' : `/api/songs/${tab}`;
      const res = await fetch(`${endpoint}?page=${page}&limit=9`);
      const result = await res.json();
      if (result.success) {
        setData((prev) => ({ ...prev, [tab]: result.data }));
        setTotalPages((prev) => ({ ...prev, [tab]: result.pagination.totalPages }));

        // Update playsById if needed
        if (result.data) {
          setPlaysById((prev) => {
            const next = { ...prev };
            for (const s of result.data) {
              next[s.id] = s.plays;
            }
            return next;
          });
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load songs');
    } finally {
      setLoading(false);
    }
  }, []); // Stable dependency

  const handleDelete = useCallback(
    async (songId: string) => {
      setDeletingId(songId);
      const originalData = data[activeTab];
      // Optimistic Update: Filter out the deleted song immediately
      setData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter((s) => s.id !== songId),
      }));

      try {
        const res = await fetch(`/api/songs/${songId}`, {
          method: 'DELETE',
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to delete song');
        }

        toast.success('Song deleted successfully');
        // No need to fetch again immediately if optimistic update worked,
        // but if we are on page 1 and list is now empty, we might want to refresh.
        if (data[activeTab].length <= 1) {
          fetchData(activeTab, pages[activeTab]);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete song');
        // Revert on failure
        setData((prev) => ({
          ...prev,
          [activeTab]: originalData,
        }));
      } finally {
        setDeletingId(null);
      }
    },
    [activeTab, data, fetchData, pages]
  );

  const handlePlayClick = useCallback(
    (songItem: SongItem) => {
      if (currentSong?.id === songItem.id && globalIsPlaying) {
        pause();
      } else if (songItem.audioUrl && songItem.audioUrl !== 'processing') {
        play({
          id: songItem.id,
          title: songItem.title,
          audioUrl: songItem.audioUrl,
          coverImageUrl: songItem.coverImageUrl,
          artist: 'AI Generated',
        });
      }
    },
    [currentSong?.id, globalIsPlaying, pause, play]
  );

  // Hydration fix: Handle client-side only player state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const getIsPlaying = (id: string) => mounted && globalIsPlaying && currentSong?.id === id;

  // Polling logic: If any song is processing, refresh every 3 seconds
  useEffect(() => {
    const currentList = data[activeTab];
    const hasProcessing = currentList.some((s) => s.audioUrl === 'processing' || s.processingStatus === 'processing');

    if (!hasProcessing) return;

    const intervalId = setInterval(() => {
      // Quietly fetch updates (don't set loading spinner)
      const page = pages[activeTab];
      const endpoint = activeTab === 'creations' ? '/api/songs' : `/api/songs/${activeTab}`;
      fetch(`${endpoint}?page=${page}&limit=9`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) {
            setData((prev) => {
              // Only update if data actually changed to avoid re-renders?
              // For now just update to keep it simple and ensuring latest status
              return { ...prev, [activeTab]: result.data };
            });
            setTotalPages((prev) => ({ ...prev, [activeTab]: result.pagination.totalPages }));

            // Update playsById from polling data
            if (result.data) {
              setPlaysById((prev) => {
                const next = { ...prev };
                for (const s of result.data) {
                  next[s.id] = s.plays;
                }
                return next;
              });
            }

            // Check if we still need to poll
            const stillProcessing = result.data.some(
              (s: SongItem) => s.audioUrl === 'processing' || s.processingStatus === 'processing'
            );

            // Sync selectedSong if it's currently open
            if (selectedSong) {
              const updatedSelectedSong = result.data.find((s: SongItem) => s.id === selectedSong.id);
              if (updatedSelectedSong) {
                // If it was processing and is now failed, close modal and warn user
                if (updatedSelectedSong.processingStatus?.startsWith('failed')) {
                  setSelectedSong(null);
                  toast.error(`Generation failed for "${updatedSelectedSong.title}"`);
                } else if (
                  updatedSelectedSong.audioUrl !== 'processing' &&
                  updatedSelectedSong.audioUrl !== selectedSong.audioUrl
                ) {
                  // If audio URL is now available, update snapshot
                  setSelectedSong(updatedSelectedSong);
                }
              } else {
                // Song disappeared from list (likely failed and filtered by API)
                // We only close if it was previously in a 'processing' state
                const wasProcessing =
                  selectedSong.audioUrl === 'processing' || selectedSong.processingStatus === 'processing';
                if (wasProcessing) {
                  setSelectedSong(null);
                  toast.error('Track generation was interrupted or failed.');
                }
              }
            }
          }
        })
        .catch((err) => console.error('Polling error:', err));
    }, 3000);

    return () => clearInterval(intervalId);
  }, [activeTab, data, pages]); // Depend on data so it re-evaluates when data updates

  // Initial fetch logic
  useEffect(() => {
    // 仅在非初始加载 (page > 1) 或通过分页导航回到第 1 页时才获取数据
    // 初始加载 (page=1, !hasNavigated) 使用服务器渲染的数据
    const isInitialLoad = pages[activeTab] === 1 && !hasNavigated[activeTab];
    const shouldFetch = !isInitialLoad || (data[activeTab].length === 0 && activeTab !== 'creations');

    if (shouldFetch) {
      // 额外的检查，避免重复获取: 如果是 creations 且 page=1 且没有导航过，跳过
      if (activeTab === 'creations' && pages[activeTab] === 1 && !hasNavigated[activeTab]) {
        return;
      }
      fetchData(activeTab, pages[activeTab]);
    }
  }, [activeTab, pages, hasNavigated, fetchData]);

  const handlePageChange = (tab: string, newPage: number) => {
    setPages((prev) => ({ ...prev, [tab]: newPage }));
    setHasNavigated((prev) => ({ ...prev, [tab]: true }));
  };

  const renderPagination = (tab: string) => {
    const currentPage = pages[tab];
    // Force at least 1 page to ensure visibility as requested
    const total = Math.max(1, totalPages[tab]);

    return (
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/20 backdrop-blur-[1px] rounded-2xl">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-8 mb-12">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(tab, Math.max(1, currentPage - 1));
            }}
            disabled={currentPage === 1}
            className="gap-1 border-purple-100/60 dark:border-white/5 bg-background shadow-none hover:bg-muted/50"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <div className="min-w-12 text-sm font-medium text-muted-foreground tabular-nums text-right">
            Page {currentPage} of {total}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(tab, Math.min(total, currentPage + 1));
            }}
            disabled={currentPage === total}
            className="gap-1 border-purple-100/60 dark:border-white/5 bg-background shadow-none hover:bg-muted/50"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  };

  const creationsWithPlays: SongItem[] = data.creations.map((song) => ({
    ...song,
    plays: playsById[song.id] ?? song.plays,
  }));

  const recentSongsWithPlays: SongItem[] = data.recent.map((song) => ({
    ...song,
    plays: playsById[song.id] ?? song.plays,
  }));

  const favoriteSongsWithPlays: SongItem[] = data.favorites.map((song) => ({
    ...song,
    plays: playsById[song.id] ?? song.plays,
  }));

  return (
    <div className="w-full pb-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl ml-10">
        <TabsList className="bg-muted/50 p-1 rounded-lg h-auto flex-wrap justify-start w-fit">
          <TabsTrigger
            value="creations"
            className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Mic2 className="size-4 mr-2" /> My Creations
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Clock className="size-4 mr-2" /> Recently Listened
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Heart className="size-4 mr-2" /> My Favorites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creations" className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">My Creations</h2>
          </div>
          {creationsWithPlays.length > 0 ? (
            <div className={cn('transition-all duration-300')}>
              <div className="space-y-4">
                {loading
                  ? Array(6)
                      .fill(0)
                      .map((_, i) => <SongRowSkeleton key={i} />)
                  : creationsWithPlays.map((item, idx) => (
                      <SongRow
                        key={item.id}
                        index={(pages.creations - 1) * 9 + idx + 1}
                        item={item}
                        isPlaying={getIsPlaying(item.id)}
                        onPlayClick={() => handlePlayClick(item)}
                        isDeleting={deletingId === item.id}
                        onDelete={() => handleDelete(item.id)}
                        onSongClick={setSelectedSong}
                      />
                    ))}
              </div>
              {!loading && renderPagination('creations')}
            </div>
          ) : (
            <Card className="mt-4 flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/5 border-dashed border-2 rounded-[32px]">
              <div className="text-center space-y-4">
                <div className="size-20 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Music2 className="size-10" />
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-foreground">No songs yet</div>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    Your musical masterpieces will appear here once generated.
                  </p>
                </div>
                <Button asChild className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700">
                  <LocaleLink href="/create">Create Your First Song</LocaleLink>
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-8">
          {recentSongsWithPlays.length > 0 ? (
            <div className={cn('transition-all duration-300')}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  Recently Listened
                </h2>
              </div>
              <div className="space-y-4">
                {loading
                  ? Array(6)
                      .fill(0)
                      .map((_, i) => <SongRowSkeleton key={i} />)
                  : recentSongsWithPlays.map((item, idx) => (
                      <SongRow
                        key={item.id}
                        index={(pages.recent - 1) * 9 + idx + 1}
                        item={item}
                        isPlaying={getIsPlaying(item.id)}
                        onPlayClick={() => handlePlayClick(item)}
                        onSongClick={setSelectedSong}
                      />
                    ))}
              </div>
              {!loading && renderPagination('recent')}
            </div>
          ) : (
            <Card className="flex h-[320px] items-center justify-center p-6 text-muted-foreground bg-muted/10 border-dashed">
              <div className="text-center font-medium text-foreground">No recent listening yet</div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-8">
          {favoriteSongsWithPlays.length > 0 ? (
            <div className={cn('transition-all duration-300')}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">My Favorites</h2>
              </div>
              <div className="space-y-4">
                {loading
                  ? Array(6)
                      .fill(0)
                      .map((_, i) => <SongRowSkeleton key={i} />)
                  : favoriteSongsWithPlays.map((item, idx) => (
                      <SongRow
                        key={item.id}
                        index={(pages.favorites - 1) * 9 + idx + 1}
                        item={item}
                        isPlaying={getIsPlaying(item.id)}
                        onPlayClick={() => handlePlayClick(item)}
                        onSongClick={setSelectedSong}
                        isLiked={true}
                      />
                    ))}
              </div>
              {!loading && renderPagination('favorites')}
            </div>
          ) : (
            <Card className="flex h-[320px] items-center justify-center p-6 text-muted-foreground bg-muted/10 border-dashed">
              <div className="text-center font-medium text-foreground">No favorites yet</div>
            </Card>
          )}
        </TabsContent>

        {/* Manual Modal */}
        {selectedSong && (
          <SongDetailModal
            key={selectedSong.id}
            song={selectedSong}
            initialIsFavorite={favorites.some((f) => f.id === selectedSong.id)}
            defaultOpen={true}
            navigationMode="manual"
            onClose={() => setSelectedSong(null)}
          />
        )}
      </Tabs>
    </div>
  );
}
