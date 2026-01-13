'use client';

import { cn } from '@/lib/utils';
import { useCreateStore, usePlayerStore } from '@/store';
import type { CreationTask } from '@/store/create-store';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Disc, Loader2, Music2, Pause, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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

  const playSong = usePlayerStore((state) => state.play);

  const updateTask = useCreateStore((state) => state.updateTask);

  const handleTaskClick = async (task: CreationTask) => {
    if (task.status === 'failed') {
      toast.error('This generation failed.');
      return;
    }

    // Optimistic Load (Immediate feedback)
    setMusicId(task.id);
    setMusicTitle(task.title);
    setMusicUrl(task.audioUrl || null);
    setMusicCoverUrl(task.coverUrl || null);
    setLyrics(task.lyrics || '');
    setMusicLyricsSnapshot(task.lyrics || null);

    // Default to existing task data
    let currentNewsSummary = task.newsSummary || '';
    let currentNewsContent = task.newsContent || '';
    let currentNewsLink = task.newsLink || '';

    // Eager Fetch for Fresh Metadata (Backstory check)
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

          // Use Fresh Data
          currentNewsSummary = freshSong.newsSummary || '';
          currentNewsContent = freshSong.sourceText || '';
          currentNewsLink = freshSong.sourceUrl || '';
        }
      } catch (e) {
        console.error('Failed to refresh task metadata', e);
      }
    }

    // Apply Context (Persisted Freshness)
    setNewsSummary(currentNewsSummary);
    setNewsContent(currentNewsContent);
    setNewsLink(currentNewsLink);

    // Switch Tab
    switchToStage();

    // Auto Play with Context
    if (task.audioUrl) {
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
            <div className="flex items-center gap-2">
                {/* Removed count as requested */}
            </div>
        </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {tasks.map((task, index) => {
            const isActive = musicId === task.id;
            const isProcessing = task.status === 'processing' || task.status === 'generating_cover';
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
                    ) : (
                        <div className={cn("size-full flex items-center justify-center", isActive ? "text-indigo-100" : "text-slate-300 dark:text-slate-600")}>
                             {isProcessing ? (
                                 <Loader2 className="size-5 animate-spin text-indigo-500" />
                             ) : (
                                 <Music2 className="size-5" />
                             )}
                        </div>
                    )}

                    {/* Equalizer Overlay (Active) */}
                    {isActive && (
                         <div className="absolute inset-0 bg-indigo-900/30 flex items-center justify-center">
                            <div className="flex gap-0.5 items-end h-3 pb-1">
                                <span className="w-0.5 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]" style={{ height: '60%' }} />
                                <span className="w-0.5 bg-white animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]" style={{ height: '100%' }} />
                                <span className="w-0.5 bg-white animate-[music-bar_0.5s_ease-in-out_infinite_0.2s]" style={{ height: '40%' }} />
                                <span className="w-0.5 bg-white animate-[music-bar_0.7s_ease-in-out_infinite_0.3s]" style={{ height: '70%' }} />
                            </div>
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
                  <span className={cn("text-[10px]", isActive ? "text-indigo-200" : "text-slate-400")}>
                    {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    {/* Status Text */}
                    {isProcessing ? (
                        <span className="text-[10px] font-semibold text-indigo-500 flex items-center gap-1">
                            <Loader2 className="size-2.5 animate-spin" />
                            {task.status === 'generating_cover' ? 'Painting...' : 'Cooking...'}
                        </span>
                    ) : isFailed ? (
                        <span className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
                            <AlertCircle className="size-2.5" /> Failed
                        </span>
                    ) : (
                        <span className={cn("text-[10px] font-medium truncate max-w-[120px]", isActive ? "text-indigo-100" : "text-slate-500")}>
                             {task.style || 'Custom Vibe'}
                        </span>
                    )}
                 </div>
              </div>
            </div>

            {/* Play/Pause Button (Hover) */}
            {!isProcessing && (
                <div className={cn(
                  "absolute right-4 transition-all duration-300",
                  isActive ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                )}>
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center shadow-lg transition-all transform",
                      isActive
                        ? "bg-white text-indigo-600 shadow-indigo-900/20"
                        : "bg-indigo-500 text-white translate-x-2 group-hover:translate-x-0"
                    )}>
                        {isActive ? (
                          <Pause className="size-3.5 fill-current" />
                        ) : (
                          <Play className="size-3.5 fill-current ml-0.5" />
                        )}
                    </div>
                </div>
            )}

            {/* Active Glow causing overlap issue? No, constrained by layout */}
          </motion.div>
        )})}
      </AnimatePresence>
      </div>
    </div>
  );
}

// Removed helper function as logic is inlined for cleaner access to isActive state
function getTaskStatusBadge(status: string) { return null; }
