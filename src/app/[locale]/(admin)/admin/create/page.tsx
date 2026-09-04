'use client';

// ... imports ...
import { DEFAULT_CUSTOM_VIBE_PROMPT } from '@/components/create/form/create-music-data';
import { CreateMusicForm } from '@/components/create/form/create-music-form';
import { CreationStage } from '@/components/create/stage/creation-stage'; // Updated Import

import { useCreditBalance } from '@/hooks/billing/use-credits';
import { authClient } from '@/lib/auth-client';
import { fetchCreationQueue } from '@/lib/creation-queue-request';
import { normalizeStructuredLyrics } from '@/lib/lyrics-utils';
import { useCreateStore, usePlayerStore } from '@/store';
import type { CreationTask } from '@/store/create-store'; // Data Type
import type { LyricWorkshop } from '@/types/lyric-workshop';

import { creditsKeys } from '@/hooks/billing/use-credits';
import { useLocalePathname, useLocaleRouter } from '@/i18n/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Routes } from '@/routes';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

const MUSIC_CREDIT_COST = 2;
const MISSING_TASK_GRACE_MS = 2 * 60 * 1000;
const POLL_INTERVAL_MS = 4000;

type ServerSong = {
  id: string;
  title?: string | null;
  lyrics?: string | null;
  prompt?: string | null;
  audioUrl?: string | null;
  coverImageUrl?: string | null;
  processingStatus?: string | null;
  processingError?: string | null;
  workflow?: SongStatusResponse['workflow'];
  createdAt?: string | number | Date | null;
  updatedAt?: string | number | Date | null;
  newsSummary?: string | null;
  sourceSummary?: string | null;
  newsContent?: string | null;
  sourceText?: string | null;
  newsLink?: string | null;
  sourceUrl?: string | null;
};

type SongStatusResponse = {
  success?: boolean;
  status?: string;
  error?: string;
  message?: string;
  processingError?: string | null;
  creditError?: string | null;
  song?: ServerSong;
  details?: {
    processingStatus?: string | null;
  };
  workflow?: {
    id: string;
    status: string;
    currentStage: string;
    phase:
      | 'source_preparation'
      | 'lyrics_studio'
      | 'music_production'
      | 'cover_production'
      | 'product_check'
      | 'publish_ready';
    lastError?: string | null;
    retryableStage?: string;
  } | null;
};

type ServerSongsResponse = {
  success?: boolean;
  error?: string;
  data?: ServerSong[] | { songs?: ServerSong[] };
  songs?: ServerSong[];
};

type LyricsGenerationResponse = {
  success?: boolean;
  error?: string;
  title?: string;
  summary?: string;
  lyrics?: string;
  workshop?: LyricWorkshop;
  workflowRunId?: string;
  workflowStage?: string;
  extractedSourceText?: string;
  sourceText?: string;
  sourceUrl?: string;
  source?: {
    text?: string;
    url?: string;
  };
  sourceSnapshot?: {
    text?: string;
    url?: string;
  };
};

type MusicGenerationResponse = {
  success?: boolean;
  error?: string;
  audio?: string;
  song?: ServerSong;
  meta?: {
    songId?: string;
  };
};

type WorkflowRunResponse = {
  success?: boolean;
  run?: {
    currentStage?: string;
    status?: string;
    title?: string | null;
    summary?: string | null;
    lyrics?: string | null;
    lyricWorkshop?: LyricWorkshop | null;
    sourceUrl?: string | null;
    sourceText?: string | null;
  };
};

type GenerationContext = {
  newsSummary: string;
  newsContent: string;
  newsLink: string;
  style: string;
  productionVariantId: string | null;
  workflowRunId: string | null;
};

function isActiveTask(task: CreationTask) {
  return task.status === 'queued' || task.status === 'processing' || task.status === 'generating_cover';
}

function normalizeTaskStatus(status: string | null | undefined, song?: ServerSong): CreationTask['status'] {
  const normalized = status?.toLowerCase();

  if (normalized === 'queued') return 'queued';
  if (
    normalized === 'processing' ||
    normalized === 'generating_audio' ||
    normalized === 'uploading_audio' ||
    normalized === 'finalizing'
  )
    return 'processing';
  if (normalized === 'audio_uploaded' || normalized === 'generating_cover') return 'generating_cover';
  if (normalized === 'completed_without_cover') return 'completed_without_cover';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'failed' || normalized?.startsWith('failed_') || normalized?.endsWith('_failed')) return 'failed';

  if (song?.audioUrl) {
    return song.coverImageUrl ? 'completed' : 'completed_without_cover';
  }

  return 'processing';
}

function toTimestamp(value: ServerSong['createdAt'], fallback = Date.now()) {
  if (!value) return fallback;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : fallback;
}

function toCreationTask(song: ServerSong): CreationTask {
  return {
    id: song.id,
    status: normalizeTaskStatus(song.processingStatus, song),
    error: song.processingError || undefined,
    workflowRunId: song.workflow?.id,
    workflowPhase: song.workflow?.phase,
    workflowStage: song.workflow?.currentStage,
    retryableStage: song.workflow?.retryableStage,
    title: song.title?.trim() || 'Untitled Track',
    lyrics: song.lyrics || undefined,
    style: song.prompt || undefined,
    audioUrl: song.audioUrl || undefined,
    coverUrl: song.coverImageUrl || undefined,
    newsSummary: song.sourceSummary || song.newsSummary || undefined,
    newsContent: song.sourceText || song.newsContent || undefined,
    newsLink: song.sourceUrl || song.newsLink || undefined,
    createdAt: toTimestamp(song.createdAt),
    updatedAt: toTimestamp(song.updatedAt, toTimestamp(song.createdAt)),
  };
}

function createClientSongId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Number.parseInt(randomHex(), 16);
    const value = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function AdminCreateSongPage() {
  const t = useTranslations('Dashboard.admin.createStudio');
  const searchParams = useSearchParams();
  const router = useLocaleRouter();
  const pathname = useLocalePathname();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const isAdmin = session?.user?.role === 'admin';

  // --- Store State ---
  const {
    newsLink,
    setNewsLink,
    newsContent,
    setNewsContent,
    newsSummary,
    setNewsSummary,
    musicPrompt,
    setMusicPrompt,
    productionVariantId,
    setProductionVariantId,
    isProductionVariantLocked,
    setIsProductionVariantLocked,
    musicTitle,
    setMusicTitle,
    lyrics,
    setLyrics,
    lyricWorkshop,
    setLyricWorkshop,
    musicLyricsSnapshot,
    setMusicLyricsSnapshot,
    hasUnsavedLyricsChanges,
    setHasUnsavedLyricsChanges,
    musicUrl,
    setMusicUrl,
    musicCoverUrl,
    setMusicCoverUrl,
    musicId,
    setMusicId,
    workflowRunId,
    setWorkflowRunId,
    tasks, // New Queue
    addTask,
    mergeTasks,
    replaceTaskId,
    updateTask,
    initializeForUser,
    shouldAutoGenerate,
    setShouldAutoGenerate,
    reset,
  } = useCreateStore();

  const playSong = usePlayerStore((state) => state.play);
  const stopPlayer = usePlayerStore((state) => state.stop);
  const setGlobalIsGenerating = usePlayerStore((state) => state.setIsGenerating);
  const setPlayerCoverImage = usePlayerStore((state) => state.setCoverImage);
  const { data: balance, isLoading: isBalanceLoading, error: balanceError } = useCreditBalance();
  const queryClient = useQueryClient();
  const currentBalance = balance ?? 0;

  // --- Local UI State ---
  const [isGenerating, setIsGenerating] = useState(false); // For Lyrics Gen only now
  const [isEditing, setIsEditing] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false); // Tracks if "Current Stage" is loading (Legacy or Direct)
  const [isRewriting, setIsRewriting] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null); // For current stage
  const [error, setError] = useState<string | null>(null);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [hasJustQueued, setHasJustQueued] = useState(false);
  const [workspaceUserId, setWorkspaceUserId] = useState<string | null>(null);
  const recoveredUserRef = useRef<string | null>(null);
  const workflowSubmissionRef = useRef(false);
  const musicSubmissionRef = useRef(false);
  const workflowRecoveryRef = useRef<string | null>(null);

  const isWorkspaceReady = isAdmin && !!currentUserId && workspaceUserId === currentUserId;
  const hasGenerationInput = !!(newsContent.trim() || newsLink.trim());
  const hasEnoughCredits = isAdmin || isBalanceLoading || !!balanceError || currentBalance >= MUSIC_CREDIT_COST;
  const canGenerate = isWorkspaceReady && hasGenerationInput && !isGenerating && !musicLoading && hasEnoughCredits;

  const loadTaskIntoStage = useCallback(
    (task: CreationTask, options?: { autoplay?: boolean }) => {
      setMusicId(task.id);
      setLyrics(task.lyrics || '');
      setLyricWorkshop(null);
      setMusicLyricsSnapshot(task.lyrics || null);
      setHasUnsavedLyricsChanges(false);
      setMusicTitle(task.title || 'Untitled Track');
      setNewsContent(task.newsContent || '');
      setNewsLink(task.newsLink || '');
      setNewsSummary(task.newsSummary || '');
      setMusicPrompt(task.style || DEFAULT_CUSTOM_VIBE_PROMPT);
      setMusicUrl(task.audioUrl || null);
      setMusicCoverUrl(task.coverUrl || null);
      setProcessingStatus(task.status);
      setIsEditing(false);
      setSelectionRange(null);
      setError(null);
      setMusicError(task.status === 'failed' ? task.error || 'Generation failed' : null);

      if (task.coverUrl) {
        setPlayerCoverImage(task.coverUrl);
      }

      if (options?.autoplay && task.audioUrl) {
        playSong({
          id: task.id,
          title: task.title || 'Untitled Track',
          audioUrl: task.audioUrl,
          coverImageUrl: task.coverUrl || null,
          artist: 'AI Generation',
          newsSummary: task.newsSummary,
          newsContent: task.newsContent,
          newsLink: task.newsLink,
        });
      } else if (options?.autoplay) {
        stopPlayer();
      }
    },
    [
      playSong,
      setHasUnsavedLyricsChanges,
      setLyrics,
      setLyricWorkshop,
      setMusicCoverUrl,
      setMusicId,
      setMusicLyricsSnapshot,
      setMusicPrompt,
      setMusicTitle,
      setMusicUrl,
      setNewsContent,
      setNewsLink,
      setNewsSummary,
      setPlayerCoverImage,
      stopPlayer,
    ]
  );

  // 只有管理员能进入创作工作区；同时等待持久化缓存完成后再按用户初始化。
  useEffect(() => {
    if (isSessionPending) return;

    if (!currentUserId || !isAdmin) {
      setWorkspaceUserId(null);
      router.replace(Routes.Dashboard);
      return;
    }

    const prepareWorkspace = () => {
      initializeForUser(currentUserId);
      setWorkspaceUserId(currentUserId);
    };

    if (useCreateStore.persist.hasHydrated()) {
      prepareWorkspace();
      return;
    }

    return useCreateStore.persist.onFinishHydration(prepareWorkspace);
  }, [currentUserId, initializeForUser, isAdmin, isSessionPending, router]);

  // --- Effect: Reset Player on Mount (Decoupling) ---
  useEffect(() => {
    if (!isWorkspaceReady) return;
    stopPlayer();
    setGlobalIsGenerating(false);
  }, [isWorkspaceReady, stopPlayer, setGlobalIsGenerating]);

  // 刷新或换设备后，以服务端任务为准恢复队列；localStorage 只作为当前账号的即时缓存。
  useEffect(() => {
    if (!isWorkspaceReady || !currentUserId) return;

    const controller = new AbortController();
    let refreshing = false;
    let recoveryFailures = 0;
    let nextRecoveryAt = 0;

    const recoverTasks = async () => {
      if (refreshing || controller.signal.aborted || !navigator.onLine || Date.now() < nextRecoveryAt) return;
      refreshing = true;
      const requestStartedAt = Date.now();
      try {
        const result = await fetchCreationQueue<ServerSongsResponse>(controller.signal);
        if (!result.ok) {
          if (result.reason === 'cancelled') return;
          recoveryFailures += 1;
          nextRecoveryAt = Date.now() + Math.min(30_000 * 2 ** Math.min(recoveryFailures - 1, 3), 120_000);
          // 预期的网络故障仅记录摘要，不向 Next 开发覆盖层传递原始 Error。
          if (recoveryFailures === 1)
            console.warn('[creation-queue] Sync unavailable; keeping saved tasks.', result.reason);
          return;
        }
        if (controller.signal.aborted) return;
        recoveryFailures = 0;
        nextRecoveryAt = 0;
        const payload = result.payload;

        const rows = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.data?.songs)
            ? payload.data.songs
            : Array.isArray(payload.songs)
              ? payload.songs
              : [];
        const currentTasks = useCreateStore.getState().tasks;
        const restoredTasks = rows
          .filter((song) => !!song.id)
          .map(toCreationTask)
          .filter((task) => {
            const local = currentTasks.find((candidate) => candidate.id === task.id);
            // 不允许较早发出的恢复请求覆盖刚刚点击重试后的本地状态。
            return !local || !isActiveTask(local) || (local.updatedAt || 0) <= requestStartedAt;
          });
        const initialRestore = recoveredUserRef.current !== currentUserId;
        mergeTasks(restoredTasks);
        recoveredUserRef.current = currentUserId;

        // 后续状态同步不能覆盖管理员正在编辑的歌词或切换播放器。
        if (!initialRestore) return;
        const state = useCreateStore.getState();
        const selectedTask = state.tasks.find((task) => task.id === state.musicId);
        if (selectedTask) {
          loadTaskIntoStage(selectedTask);
        } else {
          const nextTask = restoredTasks.find(isActiveTask) || restoredTasks[0];
          if (nextTask) loadTaskIntoStage(nextTask);
        }
      } catch (restoreError) {
        if (!controller.signal.aborted) {
          console.error('Failed to restore creation queue', restoreError);
        }
      } finally {
        refreshing = false;
      }
    };

    void recoverTasks();
    const refreshOnFocus = () => {
      nextRecoveryAt = 0;
      void recoverTasks();
    };
    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('online', refreshOnFocus);
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        (recoveryFailures > 0 || useCreateStore.getState().tasks.some((task) => task.status === 'failed'))
      ) {
        void recoverTasks();
      }
    }, 30_000);
    return () => {
      controller.abort();
      window.removeEventListener('focus', refreshOnFocus);
      window.removeEventListener('online', refreshOnFocus);
      window.clearInterval(timer);
    };
  }, [currentUserId, isWorkspaceReady, loadTaskIntoStage, mergeTasks]);

  // --- Effect: Handle URL Params (e.g. from Marketing Page) ---
  useEffect(() => {
    // ... Existing logic kept same for brevity ...
    const contentParam = searchParams.get('content');
    if (isWorkspaceReady && contentParam && !isGenerating) {
      // ... (Simplified re-inclusion of same logic)
      try {
        reset();
        const decoded = decodeURIComponent(contentParam).trim();
        // ... parsing logic ...
        // Smart Detect: URL vs Text
        if (/^(https?:\/\/|www\.)[^ "]+$/i.test(decoded)) {
          setNewsLink(decoded);
          setNewsContent('');
        } else {
          setNewsContent(decoded);
          setNewsLink('');
        }
        setShouldAutoGenerate(true);
        router.replace(Routes.AdminCreate);
      } catch (e) {
        router.replace(Routes.AdminCreate);
      }
    }
  }, [
    searchParams,
    reset,
    setNewsContent,
    setNewsLink,
    setMusicPrompt,
    setShouldAutoGenerate,
    isGenerating,
    isWorkspaceReady,
    router,
  ]);

  // --- Ref: Prevent Double Fire in Strict Mode ---
  const autoGenLock = useRef(false);

  // --- Effect: Auto-Generate on Mount ---
  useEffect(() => {
    let autoGenerateTimer: ReturnType<typeof setTimeout> | null = null;

    if (isWorkspaceReady && shouldAutoGenerate && (newsContent || newsLink) && !isGenerating && !autoGenLock.current) {
      autoGenLock.current = true;
      setShouldAutoGenerate(false);
      autoGenerateTimer = setTimeout(() => {
        void handleGenerate();
      }, 100);
    }

    return () => {
      if (autoGenerateTimer) clearTimeout(autoGenerateTimer);
    };
  }, [shouldAutoGenerate, newsContent, newsLink, isGenerating, isWorkspaceReady]);

  // Safety: If user edits inputs manually after queuing, cancel the "Create Another" (Reset) mode
  useEffect(() => {
    if (hasJustQueued) {
      setHasJustQueued(false);
    }
  }, [newsContent, newsLink, musicPrompt, lyrics, musicTitle]);

  const activeTaskSignature = tasks
    .filter(isActiveTask)
    .map((task) => task.id)
    .sort()
    .join('|');

  // --- POLLING LOGIC (Multi-Task) ---
  useEffect(() => {
    if (!isWorkspaceReady || !activeTaskSignature) return;

    let isCancelled = false;
    let nextPollTimer: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();
    const missingTaskCounts = new Map<string, number>();

    const pollTask = async (task: CreationTask) => {
      const age = Date.now() - task.createdAt;
      // 任务创建时间不代表本次尝试的耗时；失败与停滞由服务器按最新进度判定。

      try {
        const response = await fetch(`/api/songs/${task.id}/processing-status`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.replace(Routes.Dashboard);
            return;
          }

          if (response.status === 404) {
            const missingCount = (missingTaskCounts.get(task.id) || 0) + 1;
            missingTaskCounts.set(task.id, missingCount);

            // 请求响应丢失时先保留本地 UUID 继续查询；确认长期不存在后再明确失败。
            if (age > MISSING_TASK_GRACE_MS && missingCount >= 3) {
              updateTask(task.id, {
                status: 'failed',
                error: 'The generation request was not accepted by the server.',
                updatedAt: Date.now(),
              });
              if (useCreateStore.getState().musicId === task.id) {
                setMusicLoading(false);
                setProcessingStatus('failed');
                setMusicError('The generation request was not accepted. Please try again.');
              }
            }
          }
          return;
        }

        const result = (await response.json()) as SongStatusResponse;
        if (!result.success || !result.status) return;

        missingTaskCounts.delete(task.id);
        const currentTask = useCreateStore.getState().tasks.find((candidate) => candidate.id === task.id);
        if (!currentTask) return;

        const newStatus = normalizeTaskStatus(result.details?.processingStatus || result.status, result.song);
        const updates: Partial<CreationTask> = {
          status: newStatus,
          updatedAt: toTimestamp(result.song?.updatedAt),
        };

        if (result.song?.title) updates.title = result.song.title;
        if (result.song?.coverImageUrl) updates.coverUrl = result.song.coverImageUrl;
        if (result.song?.audioUrl) updates.audioUrl = result.song.audioUrl;
        if (result.song?.lyrics) updates.lyrics = result.song.lyrics;
        if (result.song?.sourceSummary || result.song?.newsSummary) {
          updates.newsSummary = result.song.sourceSummary || result.song.newsSummary || undefined;
        }
        if (result.song?.sourceText || result.song?.newsContent) {
          updates.newsContent = result.song.sourceText || result.song.newsContent || undefined;
        }
        if (result.song?.sourceUrl || result.song?.newsLink) {
          updates.newsLink = result.song.sourceUrl || result.song.newsLink || undefined;
        }
        if (newStatus === 'failed') {
          updates.error =
            result.processingError || result.creditError || result.error || result.message || 'Generation failed';
        }
        if (result.workflow) {
          updates.workflowRunId = result.workflow.id;
          updates.workflowPhase = result.workflow.phase;
          updates.workflowStage = result.workflow.currentStage;
          updates.retryableStage =
            result.workflow.retryableStage ||
            (result.workflow.status === 'failed' ? result.workflow.currentStage : undefined);
        }

        const statusChanged = newStatus !== currentTask.status;
        const metadataChanged =
          (!!updates.audioUrl && updates.audioUrl !== currentTask.audioUrl) ||
          (!!updates.coverUrl && updates.coverUrl !== currentTask.coverUrl) ||
          (!!updates.title && updates.title !== currentTask.title) ||
          (!!updates.lyrics && updates.lyrics !== currentTask.lyrics) ||
          (!!updates.newsSummary && updates.newsSummary !== currentTask.newsSummary) ||
          (!!updates.newsContent && updates.newsContent !== currentTask.newsContent) ||
          (!!updates.newsLink && updates.newsLink !== currentTask.newsLink) ||
          (!!updates.workflowPhase && updates.workflowPhase !== currentTask.workflowPhase) ||
          (!!updates.workflowStage && updates.workflowStage !== currentTask.workflowStage) ||
          updates.retryableStage !== currentTask.retryableStage;

        if (statusChanged || metadataChanged) {
          updateTask(task.id, updates);
        }

        const isTerminal =
          newStatus === 'completed' || newStatus === 'completed_without_cover' || newStatus === 'failed';
        if (statusChanged && isTerminal) {
          void queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
        }

        const isSelectedTask = useCreateStore.getState().musicId === task.id;
        if (isSelectedTask) {
          setProcessingStatus(newStatus);

          if (newStatus === 'completed' || newStatus === 'completed_without_cover') {
            const audioUrl = result.song?.audioUrl || updates.audioUrl;
            const coverUrl = result.song?.coverImageUrl || updates.coverUrl;
            setMusicUrl(audioUrl || null);
            setMusicCoverUrl(coverUrl || null);
            setMusicLoading(false);
            if (coverUrl) setPlayerCoverImage(coverUrl);

            if (statusChanged && audioUrl) {
              toast.success('Track ready! Playing now.');
              playSong({
                id: task.id,
                title: updates.title || currentTask.title,
                audioUrl,
                coverImageUrl: coverUrl || null,
                artist: 'AI Generation',
                newsSummary: updates.newsSummary || currentTask.newsSummary,
                newsContent: updates.newsContent || currentTask.newsContent,
                newsLink: updates.newsLink || currentTask.newsLink,
              });
            }
          } else if (newStatus === 'failed') {
            setMusicLoading(false);
            setMusicError(updates.error || 'Generation failed');
          }
        } else if (statusChanged && (newStatus === 'completed' || newStatus === 'completed_without_cover')) {
          toast.success(`"${updates.title || currentTask.title}" is ready!`);
        }
      } catch (pollError) {
        if (!controller.signal.aborted) {
          console.error('Poll error', pollError);
        }
      }
    };

    const pollLoop = async () => {
      if (isCancelled) return;
      const activeTasks = useCreateStore.getState().tasks.filter(isActiveTask);
      if (activeTasks.length === 0) return;

      await Promise.all(activeTasks.map(pollTask));

      if (!isCancelled && useCreateStore.getState().tasks.some(isActiveTask)) {
        nextPollTimer = setTimeout(() => void pollLoop(), POLL_INTERVAL_MS);
      }
    };

    void pollLoop();

    return () => {
      isCancelled = true;
      controller.abort();
      if (nextPollTimer) clearTimeout(nextPollTimer);
    };
  }, [
    activeTaskSignature,
    isWorkspaceReady,
    updateTask,
    playSong,
    queryClient,
    router,
    setPlayerCoverImage,
    setMusicUrl,
    setMusicCoverUrl,
    setMusicLoading,
  ]);

  /**
   * Phase 2: Generate Music (Queue Based)
   */
  const handleGenerateMusic = async (
    inputLyrics?: string,
    inputTitle?: string,
    contextOverride?: Partial<GenerationContext>
  ) => {
    if (!isWorkspaceReady || musicLoading || musicSubmissionRef.current) return;

    // React onClick 会传入 MouseEvent；这里只接受明确的字符串，绝不让 DOM 事件进入持久化状态。
    const targetLyrics = typeof inputLyrics === 'string' ? inputLyrics : lyrics;
    const targetTitle = typeof inputTitle === 'string' ? inputTitle : musicTitle;
    const safeContextOverride =
      contextOverride && typeof contextOverride === 'object' && !('nativeEvent' in contextOverride)
        ? contextOverride
        : undefined;

    if (!targetLyrics) return;
    setMusicError(null);

    if (!isAdmin && !isBalanceLoading && !balanceError && currentBalance < MUSIC_CREDIT_COST) {
      const insufficientCreditsMessage = 'Insufficient credits (Code: 1010)';
      setMusicError(insufficientCreditsMessage);
      toast.error('Insufficient credits. You need more juice to drop this track.');
      return;
    }

    musicSubmissionRef.current = true;
    setMusicLoading(true);
    const clientSongId = createClientSongId();
    const state = useCreateStore.getState();
    const currentTask = state.tasks.find((task) => task.id === state.musicId);
    const generationContext: GenerationContext = {
      newsSummary: safeContextOverride?.newsSummary ?? currentTask?.newsSummary ?? state.newsSummary,
      newsContent: safeContextOverride?.newsContent ?? currentTask?.newsContent ?? state.newsContent,
      newsLink: safeContextOverride?.newsLink ?? currentTask?.newsLink ?? state.newsLink,
      style: safeContextOverride?.style ?? state.musicPrompt ?? currentTask?.style ?? DEFAULT_CUSTOM_VIBE_PROMPT,
      productionVariantId:
        safeContextOverride?.productionVariantId ?? currentTask?.productionVariantId ?? state.productionVariantId,
      workflowRunId: safeContextOverride?.workflowRunId ?? state.workflowRunId,
    };

    const newTask: CreationTask = {
      id: clientSongId,
      status: 'processing',
      title: targetTitle || 'Untitled Track',
      lyrics: targetLyrics,
      style: generationContext.style,
      newsSummary: generationContext.newsSummary,
      newsContent: generationContext.newsContent,
      newsLink: generationContext.newsLink,
      productionVariantId: generationContext.productionVariantId || undefined,
      workflowRunId: generationContext.workflowRunId || undefined,
      workflowPhase: 'music_production',
      workflowStage: 'queued_audio',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 在发送请求前保存 UUID。即使响应丢失，刷新和轮询仍能找回服务端任务。
    addTask(newTask);
    setMusicId(clientSongId);
    setMusicUrl(null);
    setMusicCoverUrl(null);
    setMusicLyricsSnapshot(targetLyrics);
    setHasUnsavedLyricsChanges(false);
    setProcessingStatus('processing');

    try {
      const response = await fetch('/api/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: clientSongId,
          workflowRunId: generationContext.workflowRunId || undefined,
          lyrics: targetLyrics,
          prompt: generationContext.style,
          musicDirectionPrompt: generationContext.style,
          title: targetTitle,
          sourceText: generationContext.newsContent,
          sourceUrl: generationContext.newsLink,
          sourceSummary: generationContext.newsSummary,
          newsSummary: generationContext.newsSummary,
          productionVariantId: generationContext.productionVariantId || undefined,
          useStream: false,
        }),
      });

      let data: MusicGenerationResponse | null = null;
      try {
        data = (await response.json()) as MusicGenerationResponse;
      } catch {
        // 请求可能已经被服务端接收，只是响应体在传输中丢失。保留 UUID 交给轮询确认。
      }

      if (!data) {
        const requestError = response.ok
          ? 'The server accepted the request, but its response was interrupted.'
          : `The submission response was interrupted (${response.status}).`;
        updateTask(clientSongId, {
          status: 'processing',
          error: requestError,
          updatedAt: Date.now(),
        });
        setHasJustQueued(true);
        toast.warning('Submission response was interrupted. We will keep checking this task.');
        return;
      }

      if (!response.ok || !data.success) {
        const requestError = data.error || 'Generation failed';
        updateTask(clientSongId, {
          status: 'failed',
          error: requestError,
          updatedAt: Date.now(),
        });
        setProcessingStatus('failed');
        setMusicError(requestError);
        toast.error(requestError);
        void queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
        return;
      }

      const serverSongId = data.song?.id || data.meta?.songId || clientSongId;
      const acceptedStatus = data.audio ? 'completed' : normalizeTaskStatus(data.song?.processingStatus, data.song);
      const acceptedUpdates: Partial<CreationTask> = {
        status: acceptedStatus,
        title: data.song?.title?.trim() || newTask.title,
        audioUrl: data.audio || data.song?.audioUrl || undefined,
        coverUrl: data.song?.coverImageUrl || undefined,
        updatedAt: Date.now(),
        error: undefined,
      };

      if (serverSongId !== clientSongId) {
        replaceTaskId(clientSongId, serverSongId, acceptedUpdates);
      } else {
        updateTask(clientSongId, acceptedUpdates);
      }

      setMusicId(serverSongId);
      setProcessingStatus(acceptedStatus);
      setHasJustQueued(true);

      if (data.song?.title) {
        setMusicTitle(data.song.title);
      }

      if (data.audio) {
        setMusicUrl(data.audio);
      }

      toast.success('Added to Queue!', {
        description: 'Your song is cooking in the background.',
        duration: 5000,
      });
    } catch (requestError) {
      console.error('Generation Request Failed', requestError);
      const message = getErrorMessage(requestError, 'Network failed while submitting the request.');
      updateTask(clientSongId, {
        // 服务器可能已经接单：保留 UUID 和活跃状态，让轮询继续确认，而不是删除任务。
        status: 'processing',
        error: message,
        updatedAt: Date.now(),
      });
      setHasJustQueued(true);
      toast.warning('Connection lost after submission. We will keep checking this task.');
    } finally {
      musicSubmissionRef.current = false;
      setMusicLoading(false);
    }
  };

  /**
   * Stage 上的失败按钮按失败阶段恢复：成品检查失败只重跑免费校验，绝不再次调用音乐模型。
   * 只有音频生成本身失败时才创建新的 Music 2.0 生产任务。
   */
  const handleRetryCurrentTask = async () => {
    const state = useCreateStore.getState();
    const currentTask = state.tasks.find((task) => task.id === state.musicId);
    const isProductCheckRetry =
      currentTask?.retryableStage === 'checking_product' || currentTask?.retryableStage === 'finalizing';

    if (currentTask?.workflowRunId && currentTask.status === 'failed' && !isProductCheckRetry) {
      const coverOnly = currentTask.retryableStage === 'generating_cover';
      setMusicLoading(true);
      setMusicError(null);
      updateTask(currentTask.id, {
        status: coverOnly ? 'generating_cover' : 'processing',
        error: undefined,
        updatedAt: Date.now(),
        workflowStage: coverOnly ? 'generating_cover' : 'queued_audio',
      });
      try {
        const response = await fetch(`/api/generate/workflows/${currentTask.workflowRunId}/retry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 'music' }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to resume production');
        updateTask(currentTask.id, { status: 'processing', error: undefined, updatedAt: Date.now() });
        setMusicError(null);
        toast.success('Production resumed from the saved stage.');
      } catch (error) {
        const message = getErrorMessage(error, 'Unable to resume production');
        updateTask(currentTask.id, { status: 'failed', error: message });
        setMusicError(message);
      } finally {
        setMusicLoading(false);
      }
      return;
    }

    if (!currentTask?.workflowRunId || !isProductCheckRetry) {
      await handleGenerateMusic();
      return;
    }

    setMusicLoading(true);
    setMusicError(null);
    updateTask(currentTask.id, {
      status: 'processing',
      workflowPhase: 'product_check',
      workflowStage: 'checking_product',
      error: undefined,
      updatedAt: Date.now(),
    });

    try {
      const response = await fetch(`/api/generate/workflows/${currentTask.workflowRunId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'product_check' }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || result?.productCheck?.issues?.join(' ') || 'Release check failed');
      }

      if (result.stage === 'music') {
        updateTask(currentTask.id, {
          status: 'generating_cover',
          workflowPhase: 'cover_production',
          workflowStage: 'generating_cover',
          updatedAt: Date.now(),
        });
        toast.success('Resuming the missing cover. The existing audio is preserved.');
        return;
      }

      updateTask(currentTask.id, {
        status: 'completed',
        workflowPhase: 'publish_ready',
        workflowStage: 'publish_ready',
        retryableStage: undefined,
        error: undefined,
        updatedAt: Date.now(),
      });
      setProcessingStatus('completed');
      setMusicUrl(currentTask.audioUrl || null);
      setMusicCoverUrl(currentTask.coverUrl || null);
      toast.success('Release check passed. The existing audio was preserved.');
    } catch (retryError) {
      const message = getErrorMessage(retryError, 'Release check failed');
      updateTask(currentTask.id, {
        status: 'failed',
        workflowPhase: 'product_check',
        workflowStage: 'checking_product',
        retryableStage: 'checking_product',
        error: message,
        updatedAt: Date.now(),
      });
      setProcessingStatus('failed');
      setMusicError(message);
      toast.error(message);
    } finally {
      setMusicLoading(false);
    }
  };

  /**
   * Phase 1: Full Workflow
   */
  const handleGenerate = async () => {
    if (!isWorkspaceReady || isGenerating || workflowSubmissionRef.current) return;
    if (!newsContent && !newsLink) {
      toast.error('Give us some tea to spill first!');
      return;
    }
    if (!isAdmin && !isBalanceLoading && !balanceError && currentBalance < MUSIC_CREDIT_COST) {
      const insufficientCreditsMessage = 'Insufficient credits (Code: 1010)';
      setMusicError(insufficientCreditsMessage);
      toast.error('Insufficient credits. You need more juice to drop this track.');
      return;
    }

    const resumableWorkflowRunId = error && workflowRunId ? workflowRunId : null;
    workflowSubmissionRef.current = true;
    setIsGenerating(true);
    setError(null);
    setMusicError(null);

    try {
      // 2. Generate Lyrics (Blocking UI - Fast)
      const sourceMode = newsLink.trim() ? (newsContent.trim() ? 'mixed' : 'link') : 'story';
      const clientWorkflowRunId = resumableWorkflowRunId || createClientSongId();
      // 在调用模型前保存运行 ID；即使响应中断，刷新后也能从服务端恢复歌词草稿。
      setWorkflowRunId(clientWorkflowRunId);
      const lyricsResponse = await fetch('/api/generate/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowRunId: clientWorkflowRunId,
          prompt: newsContent,
          newsUrl: newsLink,
          sourceMode,
          directionPrompt: musicPrompt,
          // 兼容尚未升级的旧接口；新接口以 directionPrompt 为准。
          style: musicPrompt,
          productionVariantId: productionVariantId || undefined,
        }),
      });

      const lyricsData = (await lyricsResponse.json().catch(() => ({
        success: false,
        error: 'Failed to generate lyrics',
      }))) as LyricsGenerationResponse;
      if (!lyricsResponse.ok || !lyricsData.success || !lyricsData.lyrics) {
        throw new Error(lyricsData.error || 'Failed to generate lyrics');
      }

      const formattedLyrics = normalizeStructuredLyrics(lyricsData.lyrics);
      const generatedTitle = lyricsData.title || 'Breaking News Track';
      const sourceSnapshot = lyricsData.source || lyricsData.sourceSnapshot;
      const extractedSourceText =
        lyricsData.extractedSourceText || lyricsData.sourceText || sourceSnapshot?.text || newsContent;
      const extractedSourceUrl = lyricsData.sourceUrl || sourceSnapshot?.url || newsLink;

      setLyrics(formattedLyrics);
      setWorkflowRunId(lyricsData.workflowRunId || null);
      setLyricWorkshop(lyricsData.workshop || null);
      setMusicLyricsSnapshot(formattedLyrics);
      setHasUnsavedLyricsChanges(false);
      setMusicTitle(generatedTitle);
      if (extractedSourceText) setNewsContent(extractedSourceText);
      if (extractedSourceUrl) setNewsLink(extractedSourceUrl);

      const finalSummary = lyricsData.summary || extractedSourceText || extractedSourceUrl || 'New Creation';
      setNewsSummary(finalSummary);

      setMusicId(null);
      setMusicUrl(null);
      setMusicCoverUrl(null);
      setProcessingStatus(null);
      setIsEditing(false);

      toast.success('Lyrics are ready. Music production has started.', {
        description: 'Audio and cover production will continue automatically in the background.',
      });

      await handleGenerateMusic(formattedLyrics, generatedTitle, {
        newsSummary: finalSummary,
        newsContent: extractedSourceText || '',
        newsLink: extractedSourceUrl || '',
        style: musicPrompt,
        productionVariantId,
        workflowRunId: lyricsData.workflowRunId || clientWorkflowRunId,
      });
    } catch (workflowError) {
      const message = getErrorMessage(workflowError, 'Workflow failed');
      setError(message);
      toast.error(message);
    } finally {
      workflowSubmissionRef.current = false;
      setIsGenerating(false);
    }
  };

  // 刷新或歌词接口响应中断后，从持久化工作流恢复，并自动接续音乐生成。
  // 旧数据中的 awaiting_lyrics_approval 仅用于向后兼容，不再代表需要人工批准。
  useEffect(() => {
    if (!isWorkspaceReady || !workflowRunId || workflowRecoveryRef.current === workflowRunId) return;

    workflowRecoveryRef.current = workflowRunId;
    let cancelled = false;

    const resumeWorkflow = async () => {
      try {
        const response = await fetch(`/api/generate/workflows/${workflowRunId}`, { cache: 'no-store' });
        if (!response.ok) {
          workflowRecoveryRef.current = null;
          return;
        }

        const payload = (await response.json()) as WorkflowRunResponse;
        const run = payload.run;
        const hasRecoverableLyrics =
          run?.currentStage === 'lyrics_ready' ||
          run?.currentStage === 'lyrics_review' ||
          run?.currentStage === 'awaiting_lyrics_approval';

        if (cancelled || !payload.success || !run?.lyrics || !hasRecoverableLyrics) return;

        const recoveredLyrics = normalizeStructuredLyrics(run.lyrics);
        const recoveredTitle = run.title?.trim() || 'Breaking News Track';
        const recoveredSummary = run.summary || run.sourceText || run.sourceUrl || 'Recovered Creation';

        setLyrics(recoveredLyrics);
        setMusicLyricsSnapshot(recoveredLyrics);
        setLyricWorkshop(run.lyricWorkshop || null);
        setMusicTitle(recoveredTitle);
        setNewsSummary(recoveredSummary);
        if (run.sourceText) setNewsContent(run.sourceText);
        if (run.sourceUrl) setNewsLink(run.sourceUrl);
        setHasUnsavedLyricsChanges(false);

        if (run.lyricWorkshop?.safety.decision === 'review' || run.lyricWorkshop?.safety.decision === 'block') {
          toast.warning('This story is outside the editorial safety boundary. Revise the source before production.');
          return;
        }

        if (musicSubmissionRef.current) return;

        toast.success('Recovered the lyrics. Music production is resuming automatically.');
        await handleGenerateMusic(recoveredLyrics, recoveredTitle, {
          newsSummary: recoveredSummary,
          newsContent: run.sourceText || '',
          newsLink: run.sourceUrl || '',
          style: musicPrompt,
          productionVariantId,
          workflowRunId,
        });
      } catch {
        workflowRecoveryRef.current = null;
      }
    };

    void resumeWorkflow();
    return () => {
      cancelled = true;
    };
  }, [
    isWorkspaceReady,
    musicPrompt,
    productionVariantId,
    setHasUnsavedLyricsChanges,
    setLyricWorkshop,
    setLyrics,
    setMusicLyricsSnapshot,
    setMusicTitle,
    setNewsContent,
    setNewsLink,
    setNewsSummary,
    workflowRunId,
  ]);

  const handleRewriteLyrics = async () => {
    // ... same logic ...
    if (!selectionRange || !lyrics) return;
    setIsRewriting(true);
    try {
      const { start, end } = selectionRange;
      const selectedText = lyrics.substring(start, end);
      const res = await fetch('/api/generate/lyrics/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedText, context: lyrics, style: musicPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        const newLyrics = lyrics.substring(0, start) + data.rewrittenText + lyrics.substring(end);
        setLyrics(normalizeStructuredLyrics(newLyrics));
        setSelectionRange(null);
        toast.success('Rewritten!');
      }
    } catch (e) {
      toast.error('Rewrite failed');
    } finally {
      setIsRewriting(false);
    }
  };

  if (isSessionPending || !isWorkspaceReady) {
    return null;
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-slate-100 transition-colors duration-500 dark:bg-zinc-950">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-linear-to-r from-indigo-500/15 via-purple-500/15 to-blue-500/15 blur-[120px] rounded-full pointer-events-none -z-10 opacity-60" />

      <main className="mx-auto grid min-h-0 w-full max-w-[2480px] flex-1 items-stretch gap-5 px-2 pb-5 pt-3 md:grid-cols-[minmax(440px,0.9fr)_minmax(520px,1.1fr)] md:gap-6 md:px-3 lg:grid-cols-[minmax(560px,0.9fr)_minmax(680px,1.2fr)] xl:grid-cols-[minmax(640px,0.85fr)_minmax(820px,1.35fr)] 2xl:gap-8 2xl:px-4">
        {/* Left: Input (Scrollable) */}
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
          <CreateMusicForm
            newsLink={newsLink}
            setNewsLink={setNewsLink}
            newsContent={newsContent}
            setNewsContent={setNewsContent}
            musicPrompt={musicPrompt}
            setMusicPrompt={setMusicPrompt}
            newsSummary={newsSummary}
            lyrics={lyrics}
            productionVariantId={productionVariantId}
            setProductionVariantId={setProductionVariantId}
            isProductionVariantLocked={isProductionVariantLocked}
            setIsProductionVariantLocked={setIsProductionVariantLocked}
            handleGenerate={handleGenerate}
            canGenerate={canGenerate}
            isGenerating={isGenerating || musicLoading}
            error={error}
            musicError={musicError}
            onClearError={() => {
              setError(null);
              setMusicError(null);
            }}
            hasJustQueued={hasJustQueued}
            onReset={() => {
              setNewsLink('');
              setNewsContent('');
              setLyrics('');
              setLyricWorkshop(null);
              setMusicTitle('');
              setMusicPrompt(DEFAULT_CUSTOM_VIBE_PROMPT);
              setProductionVariantId(null);
              setIsProductionVariantLocked(false);
              setHasJustQueued(false);
              // Clear URL params if any
              window.history.replaceState(null, '', pathname);
            }}
          />
        </div>

        {/* Right: Stage & Queue (Fixed Full Height) */}
        <div className="flex-1 w-full min-h-0">
          {/* Derive Stage Data from Active Task (Persistence) OR Store (Drafting) */}
          {(() => {
            const activeTask = tasks.find((t) => t.id === musicId);
            const displayNewsSummary = activeTask?.newsSummary || newsSummary;
            const displayNewsContent = activeTask?.newsContent || newsContent;
            const displayNewsLink = activeTask?.newsLink || newsLink;
            const stageMusicLoading =
              musicLoading ||
              activeTask?.status === 'queued' ||
              activeTask?.status === 'processing' ||
              activeTask?.status === 'generating_cover';

            return (
              <CreationStage
                lyrics={lyrics}
                lyricWorkshop={lyricWorkshop}
                onUseDraft={(draftLyrics) => {
                  setLyrics(normalizeStructuredLyrics(draftLyrics));
                  setHasUnsavedLyricsChanges(true);
                  setIsEditing(false);
                }}
                setLyrics={setLyrics}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                musicLyricsSnapshot={musicLyricsSnapshot}
                hasUnsavedLyricsChanges={hasUnsavedLyricsChanges}
                setHasUnsavedLyricsChanges={setHasUnsavedLyricsChanges}
                processingStatus={activeTask?.status || processingStatus}
                handleRegenerateAudio={handleRetryCurrentTask}
                musicLoading={stageMusicLoading}
                handleRewriteLyrics={handleRewriteLyrics}
                isRewriting={isRewriting}
                setSelectionRange={setSelectionRange}
                selectionRange={selectionRange}
                newsSummary={displayNewsSummary}
                newsContent={displayNewsContent}
                newsLink={displayNewsLink}
                musicUrl={musicUrl}
                songTitle={musicTitle}
                songId={musicId}
                coverImageUrl={musicCoverUrl}
                onPrevious={() => {
                  const currentIndex = tasks.findIndex((t) => t.id === musicId);
                  if (currentIndex > 0) {
                    const prevTask = tasks[currentIndex - 1];
                    loadTaskIntoStage(prevTask, { autoplay: true });
                  }
                }}
                onNext={() => {
                  const currentIndex = tasks.findIndex((t) => t.id === musicId);
                  if (currentIndex < tasks.length - 1 && currentIndex !== -1) {
                    const nextTask = tasks[currentIndex + 1];
                    loadTaskIntoStage(nextTask, { autoplay: true });
                  }
                }}
                hasPrevious={tasks.findIndex((t) => t.id === musicId) > 0}
                hasNext={
                  tasks.findIndex((t) => t.id === musicId) < tasks.length - 1 &&
                  tasks.findIndex((t) => t.id === musicId) !== -1
                }
              />
            );
          })()}
        </div>
      </main>
    </div>
  );
}
