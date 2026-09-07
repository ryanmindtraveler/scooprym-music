'use client';

import { getFailedProductionLabel } from '@/lib/creation/music-retry-policy';
import { cn } from '@/lib/utils';
import { useCreateStore, usePlayerStore } from '@/store';
import type { CreationTask } from '@/store/create-store';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, Music2, Pause, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const PHASE_LABELS: Record<NonNullable<CreationTask['workflowPhase']>, string> = {
  source_preparation: 'Preparing source',
  lyrics_studio: 'Writing lyrics',
  music_production: 'Producing audio',
  cover_production: 'Creating cover',
  product_check: 'Checking release',
  publish_ready: 'Ready to publish',
};

function getTaskPhaseLabel(task: CreationTask) {
  if (task.workflowStage === 'uploading_audio') return 'Saving audio';
  if (task.workflowPhase) return PHASE_LABELS[task.workflowPhase];
  if (task.status === 'queued') return 'Waiting to start';
  if (task.status === 'generating_cover') return 'Creating cover';
  if (task.status === 'completed' || task.status === 'completed_without_cover') return 'Ready to publish';
  return 'Producing audio';
}

export function TaskQueueView({ switchToStage }: { switchToStage: () => void }) {
  const tasks = useCreateStore((state) => state.tasks);
  const musicId = useCreateStore((state) => state.musicId);
  const setMusicId = useCreateStore((state) => state.setMusicId);
  const setMusicUrl = useCreateStore((state) => state.setMusicUrl);
  const setMusicCoverUrl = useCreateStore((state) => state.setMusicCoverUrl);
  const setLyrics = useCreateStore((state) => state.setLyrics);
  const setMusicTitle = useCreateStore((state) => state.setMusicTitle);
  const setMusicLyricsSnapshot = useCreateStore((state) => state.setMusicLyricsSnapshot);
  const setNewsSummary = useCreateStore((state) => state.setNewsSummary);
  const setNewsContent = useCreateStore((state) => state.setNewsContent);
  const setNewsLink = useCreateStore((state) => state.setNewsLink);
  const setMusicPrompt = useCreateStore((state) => state.setMusicPrompt);

  const playSong = usePlayerStore((state) => state.play);
  const pauseSong = usePlayerStore((state) => state.pause);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isLoading = usePlayerStore((state) => state.isLoading);
  const currentSong = usePlayerStore((state) => state.currentSong);

  const updateTask = useCreateStore((state) => state.updateTask);

  const retryTask = async (task: CreationTask) => {
    if (!task.workflowRunId) {
      toast.error('This older task cannot be retried from the queue. Open it on Stage and create a new version.');
      return;
    }

    const previousStatus = task.status;
    const isCoverRetry = task.retryableStage === 'generating_cover';
    const isProductCheckRetry = task.retryableStage === 'checking_product' || task.retryableStage === 'finalizing';
    updateTask(task.id, {
      status: isCoverRetry ? 'generating_cover' : 'processing',
      workflowPhase: isCoverRetry ? 'cover_production' : isProductCheckRetry ? 'product_check' : 'music_production',
      workflowStage: isCoverRetry ? 'generating_cover' : isProductCheckRetry ? 'checking_product' : 'queued_audio',
      updatedAt: Date.now(),
      error: undefined,
    });

    try {
      const response = await fetch(`/api/generate/workflows/${task.workflowRunId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: isProductCheckRetry ? 'product_check' : 'music' }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'The retry could not be started');
      }

      // 请求期间的旧轮询响应可能覆盖乐观状态；收到服务端确认后重新开始轮询。
      updateTask(task.id, {
        status: result.stage === 'product_check' ? 'completed' : 'processing',
        error: undefined,
        updatedAt: Date.now(),
      });

      toast.success(isProductCheckRetry ? 'Release check restarted' : 'Production restarted');
    } catch (error) {
      updateTask(task.id, { status: previousStatus, error: error instanceof Error ? error.message : 'Retry failed' });
      toast.error(error instanceof Error ? error.message : 'Retry failed');
    }
  };

  const handleTaskClick = async (task: CreationTask) => {
    // Allow selecting failed tasks to view lyrics/prompt and potentially retry
    if (task.status === 'failed') {
      // toast.error('This generation failed, but you can view the details.');
    }

    // Optimistic Load (Immediate feedback)
    setMusicId(task.id);
    setMusicTitle(task.title);
    setMusicUrl(task.audioUrl || null);
    setMusicCoverUrl(task.coverUrl || null);
    setLyrics(task.lyrics || '');
    setMusicLyricsSnapshot(task.lyrics || null);

    // Default to existing task data
    const currentNewsSummary = task.newsSummary || '';
    const currentNewsContent = task.newsContent || '';
    const currentNewsLink = task.newsLink || '';

    // Apply Context (Persisted Freshness)
    setNewsSummary(currentNewsSummary);
    setNewsContent(currentNewsContent);
    setNewsLink(currentNewsLink);
    setMusicPrompt(task.style || '');

    // Playback Logic: Toggle if same song, Play if different
    if (task.audioUrl) {
      if (currentSong?.id === task.id) {
        if (isPlaying && !isLoading) {
          pauseSong();
        } else {
          playSong(); // RESUME current
        }
      } else {
        // Play NEW song
        playSong({
          id: task.id,
          title: task.title,
          audioUrl: task.audioUrl,
          coverImageUrl: task.coverUrl || null,
          artist: 'AI Generate',
          newsSummary: currentNewsSummary || undefined,
          newsContent: currentNewsContent || undefined,
          newsLink: currentNewsLink || undefined,
        });
      }
    } else if (task.status === 'completed' || task.status === 'completed_without_cover') {
      // Edge case: Completed but no URL yet? (Shouldn't happen with new logic, but safe to ignore or toast)
      // toast('Audio not ready yet');
    }

    // Switch Tab
    switchToStage();

    // Eager Fetch for Fresh Metadata (Backstory check) - update silently if needed
    if (task.status === 'completed' || task.status === 'completed_without_cover') {
      try {
        const res = await fetch(`/api/songs/${task.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          const freshSong = data.data;

          // Update Persisted Store (Self-healing)
          updateTask(task.id, {
            newsSummary: freshSong.newsSummary,
            newsContent: freshSong.sourceText,
            newsLink: freshSong.sourceUrl,
          });

          // Update Local Context if changed (optional, but good for accuracy)
          setNewsSummary(freshSong.newsSummary || '');
          setNewsContent(freshSong.sourceText || '');
          setNewsLink(freshSong.sourceUrl || '');
        }
      } catch (e) {
        console.error('Failed to refresh task metadata', e);
      }
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="size-20 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center relative z-10 shadow-xl shadow-indigo-500/5 group-hover:scale-105 transition-transform duration-500">
            <Music2 className="size-8 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors duration-500" />
          </div>
        </div>
        <div className="mt-6 text-center space-y-1">
          <p className="font-bold text-lg text-slate-700 dark:text-slate-200 tracking-tight">Your Session is Empty</p>
          <p className="text-sm text-slate-400 max-w-[200px] mx-auto leading-relaxed">
            Start a new creation on the Stage to build your queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="shrink-0 pl-6 pr-40 py-5 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-10">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Music2 className="size-3.5" />
          Session Queue
        </h3>
        <div className="flex items-center gap-2">{/* Removed count as requested */}</div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((task, index) => {
            const isActive = musicId === task.id;
            const isProcessing =
              task.status === 'queued' || task.status === 'processing' || task.status === 'generating_cover';
            const isFailed = task.status === 'failed';

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleTaskClick(task)}
                className={cn(
                  'group relative flex items-center gap-3 p-2 pr-4 rounded-xl transition-all cursor-pointer border',
                  isActive
                    ? 'bg-linear-to-r from-violet-500 via-indigo-500 to-blue-500 border-indigo-400/50 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-white/20'
                )}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      'size-12 rounded-lg overflow-hidden flex items-center justify-center relative z-10 bg-slate-100 dark:bg-zinc-800',
                      isProcessing && 'ring-2 ring-indigo-500/20',
                      isActive && 'ring-0 shadow-sm'
                    )}
                  >
                    {task.coverUrl ? (
                      <img src={task.coverUrl} alt={task.title} className="size-full object-cover" />
                    ) : isProcessing ? (
                      <div className="size-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800">
                        <Loader2 className="size-5 animate-spin text-indigo-500" />
                      </div>
                    ) : (
                      // Frontend Fallback
                      <img
                        src="/images/funny-censored-fallback.png"
                        alt="Fallback"
                        className="size-full object-cover opacity-80"
                      />
                    )}

                    {/* Equalizer/Spinner Overlay (Active & Not Failed) */}
                    {isActive && !isFailed && (
                      <div className="absolute inset-0 bg-indigo-900/30 flex items-center justify-center">
                        {isProcessing ? (
                          <Loader2 className="size-5 text-white/80 animate-spin" />
                        ) : isLoading ? (
                          <Loader2 className="size-4 text-white animate-spin" />
                        ) : isPlaying ? (
                          <div className="flex gap-0.5 items-end h-3 pb-1">
                            <span
                              className="w-0.5 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]"
                              style={{ height: '60%' }}
                            />
                            <span
                              className="w-0.5 bg-white animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]"
                              style={{ height: '100%' }}
                            />
                            <span
                              className="w-0.5 bg-white animate-[music-bar_0.5s_ease-in-out_infinite_0.2s]"
                              style={{ height: '40%' }}
                            />
                            <span
                              className="w-0.5 bg-white animate-[music-bar_0.7s_ease-in-out_infinite_0.3s]"
                              style={{ height: '70%' }}
                            />
                          </div>
                        ) : (
                          <div className="size-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Play className="size-3 fill-white text-white ml-0.5" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <h4
                      className={cn(
                        'font-bold text-sm truncate',
                        isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                      )}
                    >
                      {task.title || 'Untitled Track'}
                    </h4>
                    {/* Timestamp */}
                    <span className={cn('text-[10px]', isActive ? 'text-indigo-200' : 'text-slate-400')}>
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Status Text */}
                      {isProcessing ? (
                        <span className="text-[10px] font-semibold text-indigo-500 flex items-center gap-1">
                          <Loader2 className="size-2.5 animate-spin" />
                          {getTaskPhaseLabel(task)}
                        </span>
                      ) : isFailed ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-red-600">
                            <AlertCircle className="size-2.5 shrink-0" />
                            <span className="truncate" title={task.error}>
                              {getFailedProductionLabel(task.retryableStage, !!task.audioUrl)}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void retryTask(task);
                            }}
                            className={cn(
                              'inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition-colors',
                              'border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
                              isActive && 'border-white/40 bg-white/15 text-white hover:bg-white/25'
                            )}
                            aria-label={`Retry ${task.title}`}
                          >
                            <RotateCcw className="size-2.5" />
                            Retry
                          </button>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            'text-[10px] font-medium truncate max-w-[120px]',
                            isActive ? 'text-indigo-100' : 'text-slate-500'
                          )}
                        >
                          {task.workflowPhase === 'publish_ready' ? 'Ready to publish' : task.style || 'Custom Vibe'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Play/Pause Button (Hover) */}
                {!isProcessing && !isFailed && (
                  <div
                    className={cn(
                      'absolute right-4 transition-all duration-300',
                      isActive
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                    )}
                  >
                    <div
                      className={cn(
                        'size-8 rounded-full flex items-center justify-center shadow-lg transition-all transform',
                        isActive
                          ? 'bg-white text-indigo-600 shadow-indigo-900/20'
                          : 'bg-indigo-500 text-white translate-x-2 group-hover:translate-x-0'
                      )}
                    >
                      {isActive ? (
                        isLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Pause className="size-3.5 fill-current" />
                        )
                      ) : (
                        <Play className="size-3.5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                )}

                {/* Active Glow causing overlap issue? No, constrained by layout */}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
