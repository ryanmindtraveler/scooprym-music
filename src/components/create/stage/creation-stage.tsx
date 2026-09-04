'use client';

import { Card } from '@/components/ui/card';
import { useCreateStore } from '@/store';
import type { LyricWorkshop } from '@/types/lyric-workshop';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LyricsStageView } from './lyrics-stage-view';
import { StageTabs } from './stage-tabs';
import { TaskQueueView } from './task-queue-view';

// Props passed from Page (mostly for LyricsView)
interface CreationStageProps {
  lyrics: string;
  lyricWorkshop: LyricWorkshop | null;
  onUseDraft: (lyrics: string) => void;
  setLyrics: (value: string) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  musicLyricsSnapshot: string | null;
  hasUnsavedLyricsChanges: boolean;
  setHasUnsavedLyricsChanges: (value: boolean) => void;
  processingStatus: string | null;
  handleRegenerateAudio: () => void;
  musicLoading: boolean;
  handleRewriteLyrics: () => void;
  isRewriting: boolean;
  setSelectionRange: (range: { start: number; end: number } | null) => void;
  selectionRange: { start: number; end: number } | null;
  newsSummary?: string;
  newsContent?: string;
  newsLink?: string;
  musicUrl: string | null;
  songTitle: string | null;
  songId: string | null;
  coverImageUrl?: string | null;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function CreationStage(props: CreationStageProps) {
  const [mode, setMode] = useState<'stage' | 'queue'>('stage');

  // Connect to store to get queue count
  const tasks = useCreateStore((state) => state.tasks);
  const activeTasksCount = tasks.filter((t) => t.status === 'processing' || t.status === 'generating_cover').length;

  // Auto-switch to Queue if a new task is added?
  // User UX Decision: "No, keep control". We'll just show the badge.

  return (
    <Card className="flex h-full flex-col shadow-2xl shadow-indigo-500/10 bg-linear-to-br from-white via-indigo-50/40 to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border border-white/60 dark:border-white/5 backdrop-blur-3xl rounded-[32px] transition-all duration-500 overflow-hidden relative">
      {/* === Floating Tab Switcher (Top Right) - Always Visible === */}
      <div className="absolute top-6 right-6 z-40 pointer-events-none">
        <div className="pointer-events-auto shadow-sm shadow-indigo-500/5 rounded-xl">
          <StageTabs value={mode} onValueChange={setMode} queueCount={activeTasksCount} />
        </div>
      </div>

      {/* === Content Area === */}
      <div className="flex-1 w-full h-full p-0 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'stage' ? (
            <motion.div
              key="stage"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <LyricsStageView
                {...props}
                songId={props.songId}
                coverImageUrl={props.coverImageUrl}
                newsContent={props.newsContent}
                newsLink={props.newsLink}
                onPrevious={props.onPrevious}
                onNext={props.onNext}
                hasPrevious={props.hasPrevious}
                hasNext={props.hasNext}
              />
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: 20 }} // Slide from right
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full h-full overflow-hidden"
            >
              <TaskQueueView switchToStage={() => setMode('stage')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
