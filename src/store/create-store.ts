import { refreshEditedLyricsReview } from '@/ai/text/lib/lyrics-review-state';
import { DEFAULT_CUSTOM_VIBE_PROMPT } from '@/components/create/form/create-music-data';
import type { LyricWorkshop } from '@/types/lyric-workshop';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Task Interface for Queue
export interface CreationTask {
  id: string;
  status: 'queued' | 'processing' | 'generating_cover' | 'completed' | 'failed' | 'completed_without_cover';
  title: string;
  coverUrl?: string;
  audioUrl?: string;
  lyrics?: string; // Snapshot of lyrics used
  style?: string;
  newsSummary?: string; // Backstory context
  newsContent?: string; // Original User Input
  newsLink?: string; // Original URL
  productionVariantId?: string;
  workflowRunId?: string;
  workflowPhase?:
    | 'source_preparation'
    | 'lyrics_studio'
    | 'music_production'
    | 'cover_production'
    | 'product_check'
    | 'publish_ready';
  workflowStage?: string;
  retryableStage?: string;
  createdAt: number;
  updatedAt?: number;
  error?: string;
}

const MAX_COMPLETED_TASKS = 10;

const TASK_STATUSES = new Set<CreationTask['status']>([
  'queued',
  'processing',
  'generating_cover',
  'completed',
  'failed',
  'completed_without_cover',
]);

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function safeNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function safeOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Zustand 的类型只在编译期生效，React 事件仍可能在运行时误入 setter。
 * 任务进入持久化状态前按业务字段重建，DOM、Window、事件对象不会被保留。
 */
function sanitizeTask(value: unknown): CreationTask | null {
  if (!value || typeof value !== 'object') return null;

  const task = value as Partial<Record<keyof CreationTask, unknown>>;
  const id = safeString(task.id);
  if (!id) return null;

  const status = TASK_STATUSES.has(task.status as CreationTask['status'])
    ? (task.status as CreationTask['status'])
    : 'failed';
  const createdAt = typeof task.createdAt === 'number' && Number.isFinite(task.createdAt) ? task.createdAt : Date.now();
  const updatedAt = typeof task.updatedAt === 'number' && Number.isFinite(task.updatedAt) ? task.updatedAt : undefined;

  return {
    id,
    status,
    title: safeString(task.title, 'Untitled Track'),
    coverUrl: safeOptionalString(task.coverUrl),
    audioUrl: safeOptionalString(task.audioUrl),
    lyrics: safeOptionalString(task.lyrics),
    style: safeOptionalString(task.style),
    newsSummary: safeOptionalString(task.newsSummary),
    newsContent: safeOptionalString(task.newsContent),
    newsLink: safeOptionalString(task.newsLink),
    productionVariantId: safeOptionalString(task.productionVariantId),
    workflowRunId: safeOptionalString(task.workflowRunId),
    workflowPhase: safeOptionalString(task.workflowPhase) as CreationTask['workflowPhase'],
    workflowStage: safeOptionalString(task.workflowStage),
    retryableStage: safeOptionalString(task.retryableStage),
    createdAt,
    updatedAt,
    error: safeOptionalString(task.error),
  };
}

function isActiveTask(task: CreationTask) {
  return task.status === 'queued' || task.status === 'processing' || task.status === 'generating_cover';
}

/**
 * 活跃任务绝不能因为展示上限被丢弃；仅限制已经结束的历史任务数量。
 */
function retainTasks(tasks: unknown[]) {
  const seenTaskIds = new Set<string>();
  const deduplicated = tasks
    .map(sanitizeTask)
    .filter((task): task is CreationTask => task !== null)
    .filter((task) => {
      if (seenTaskIds.has(task.id)) return false;
      seenTaskIds.add(task.id);
      return true;
    })
    .sort((left, right) => right.createdAt - left.createdAt);
  const activeTasks = deduplicated.filter(isActiveTask);
  const finishedTasks = deduplicated.filter((task) => !isActiveTask(task)).slice(0, MAX_COMPLETED_TASKS);

  return [...activeTasks, ...finishedTasks].sort((left, right) => right.createdAt - left.createdAt);
}

const EMPTY_USER_STATE = {
  newsLink: '',
  newsContent: '',
  newsSummary: '',
  musicPrompt: DEFAULT_CUSTOM_VIBE_PROMPT,
  productionVariantId: null,
  isProductionVariantLocked: false,
  musicTitle: '',
  lyrics: '',
  lyricWorkshop: null as LyricWorkshop | null,
  musicLyricsSnapshot: null,
  hasUnsavedLyricsChanges: false,
  musicUrl: null,
  musicCoverUrl: null,
  musicId: null,
  workflowRunId: null,
  tasks: [] as CreationTask[],
  processingTaskId: null,
  shouldAutoGenerate: false,
} as const;

interface CreateState {
  // 缓存归属；切换账号时必须清空，避免同一浏览器跨账号泄露创作内容。
  ownerUserId: string | null;
  initializeForUser: (userId: string) => void;

  // Inputs
  newsLink: string;
  setNewsLink: (link: string) => void;
  newsContent: string;
  setNewsContent: (content: string) => void;
  newsSummary: string;
  setNewsSummary: (summary: string) => void;

  // Music Config
  musicPrompt: string;
  setMusicPrompt: (prompt: string) => void;
  productionVariantId: string | null;
  setProductionVariantId: (variantId: string | null) => void;
  isProductionVariantLocked: boolean;
  setIsProductionVariantLocked: (locked: boolean) => void;
  musicTitle: string;
  setMusicTitle: (title: string) => void;

  // Lyrics State
  lyrics: string;
  setLyrics: (lyrics: string) => void;
  lyricWorkshop: LyricWorkshop | null;
  setLyricWorkshop: (workshop: LyricWorkshop | null) => void;
  musicLyricsSnapshot: string | null;
  setMusicLyricsSnapshot: (snapshot: string | null) => void;
  hasUnsavedLyricsChanges: boolean;
  setHasUnsavedLyricsChanges: (hasChanges: boolean) => void;

  // Music Result (Stage / Current View)
  musicUrl: string | null;
  setMusicUrl: (url: string | null) => void;
  musicCoverUrl: string | null;
  setMusicCoverUrl: (url: string | null) => void;
  musicId: string | null; // The ID of the successfully generated song (Current Stage)
  setMusicId: (id: string | null) => void;
  workflowRunId: string | null;
  setWorkflowRunId: (id: string | null) => void;

  // Task Queue (Background)
  tasks: CreationTask[];
  addTask: (task: CreationTask) => void;
  mergeTasks: (tasks: CreationTask[]) => void;
  replaceTaskId: (currentId: string, nextId: string, updates?: Partial<CreationTask>) => void;
  updateTask: (id: string, updates: Partial<CreationTask>) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;

  // Legacy / Polling (Can be used to track which task is "hot" if needed, but Queue is primary)
  processingTaskId: string | null;
  setProcessingTaskId: (id: string | null) => void;

  // Auto-start generation signal
  shouldAutoGenerate: boolean;
  setShouldAutoGenerate: (flag: boolean) => void;

  // Actions
  reset: () => void;
}

export const useCreateStore = create<CreateState>()(
  persist(
    (set, get) => ({
      // Defaults
      ownerUserId: null,
      initializeForUser: (userId) => {
        if (get().ownerUserId === userId) return;

        set({
          ...EMPTY_USER_STATE,
          ownerUserId: userId,
        });
      },

      newsLink: '',
      setNewsLink: (newsLink) => set({ newsLink: safeString(newsLink) }),
      newsContent: '',
      setNewsContent: (newsContent) => set({ newsContent: safeString(newsContent) }),
      newsSummary: '',
      setNewsSummary: (newsSummary) => set({ newsSummary: safeString(newsSummary) }),

      // Default Prompt set to 'Viral Pop' (Custom Vibe)
      musicPrompt: DEFAULT_CUSTOM_VIBE_PROMPT,
      setMusicPrompt: (musicPrompt) => set({ musicPrompt: safeString(musicPrompt, DEFAULT_CUSTOM_VIBE_PROMPT) }),
      productionVariantId: null,
      setProductionVariantId: (productionVariantId) =>
        set({ productionVariantId: safeNullableString(productionVariantId) }),
      isProductionVariantLocked: false,
      setIsProductionVariantLocked: (isProductionVariantLocked) => set({ isProductionVariantLocked }),

      musicTitle: '',
      setMusicTitle: (musicTitle) => set({ musicTitle: safeString(musicTitle) }),

      lyrics: '',
      setLyrics: (lyrics) =>
        set((state) => {
          const nextLyrics = safeString(lyrics);
          if (nextLyrics === state.lyrics) return {};
          return {
            lyrics: nextLyrics,
            lyricWorkshop: refreshEditedLyricsReview(state.lyricWorkshop, nextLyrics),
            hasUnsavedLyricsChanges:
              !!state.musicLyricsSnapshot && nextLyrics.trim() !== state.musicLyricsSnapshot.trim(),
          };
        }),
      lyricWorkshop: null,
      setLyricWorkshop: (lyricWorkshop) =>
        set((state) => ({
          lyricWorkshop:
            lyricWorkshop?.qualityGate?.reviewedLyrics !== undefined &&
            lyricWorkshop.qualityGate.reviewedLyrics !== state.lyrics
              ? refreshEditedLyricsReview(lyricWorkshop, state.lyrics)
              : lyricWorkshop,
        })),
      musicLyricsSnapshot: null,
      setMusicLyricsSnapshot: (musicLyricsSnapshot) =>
        set({ musicLyricsSnapshot: safeNullableString(musicLyricsSnapshot) }),
      hasUnsavedLyricsChanges: false,
      setHasUnsavedLyricsChanges: (hasUnsavedLyricsChanges) => set({ hasUnsavedLyricsChanges }),

      musicUrl: null,
      setMusicUrl: (musicUrl) => set({ musicUrl: safeNullableString(musicUrl) }),
      musicCoverUrl: null,
      setMusicCoverUrl: (musicCoverUrl) => set({ musicCoverUrl: safeNullableString(musicCoverUrl) }),
      musicId: null,
      setMusicId: (musicId) =>
        set((state) => ({ musicId: safeNullableString(musicId), tasks: retainTasks(state.tasks) })),
      workflowRunId: null,
      setWorkflowRunId: (workflowRunId) => set({ workflowRunId: safeNullableString(workflowRunId) }),

      // Task Queue Actions
      tasks: [],
      addTask: (task) => set((state) => ({ tasks: retainTasks([task, ...state.tasks]) })),
      mergeTasks: (incomingTasks) =>
        set((state) => {
          const safeLocalTasks = retainTasks(state.tasks);
          const safeIncomingTasks = retainTasks(incomingTasks);
          const localTasksById = new Map(safeLocalTasks.map((task) => [task.id, task]));
          const mergedIncoming = safeIncomingTasks.map((task) => {
            const localTask = localTasksById.get(task.id);
            if (!localTask) return task;

            localTasksById.delete(task.id);
            return {
              ...localTask,
              ...task,
              lyrics: task.lyrics || localTask.lyrics,
              style: task.style || localTask.style,
              newsSummary: task.newsSummary || localTask.newsSummary,
              newsContent: task.newsContent || localTask.newsContent,
              newsLink: task.newsLink || localTask.newsLink,
              productionVariantId: task.productionVariantId || localTask.productionVariantId,
            };
          });

          return { tasks: retainTasks([...mergedIncoming, ...localTasksById.values()]) };
        }),
      replaceTaskId: (currentId, nextId, updates = {}) =>
        set((state) => {
          const safeTasks = retainTasks(state.tasks);
          const currentTask = safeTasks.find((task) => task.id === safeString(currentId));
          if (!currentTask) return state;

          const taskWithServerId: CreationTask = {
            ...currentTask,
            ...updates,
            id: safeString(nextId),
          };
          if (!taskWithServerId.id) return { tasks: safeTasks };
          const remainingTasks = safeTasks.filter(
            (task) => task.id !== safeString(currentId) && task.id !== taskWithServerId.id
          );

          return {
            tasks: retainTasks([taskWithServerId, ...remainingTasks]),
            musicId: state.musicId === currentId ? nextId : state.musicId,
            processingTaskId: state.processingTaskId === currentId ? nextId : state.processingTaskId,
          };
        }),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: retainTasks(state.tasks.map((task) => (task.id === safeString(id) ? { ...task, ...updates } : task))),
        })),
      removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
      clearCompletedTasks: () =>
        set((state) => ({
          tasks: state.tasks.filter(isActiveTask),
        })),

      processingTaskId: null,
      setProcessingTaskId: (processingTaskId) => set({ processingTaskId: safeNullableString(processingTaskId) }),

      // Auto-start generation signal
      shouldAutoGenerate: false,
      setShouldAutoGenerate: (shouldAutoGenerate) => set({ shouldAutoGenerate }),

      reset: () =>
        set({
          newsLink: '',
          newsContent: '',
          newsSummary: '',
          musicTitle: '',
          lyrics: '',
          lyricWorkshop: null,
          musicLyricsSnapshot: null,
          hasUnsavedLyricsChanges: false,
          musicUrl: null,
          musicCoverUrl: null,
          musicId: null,
          workflowRunId: null,
          processingTaskId: null,
          musicPrompt: DEFAULT_CUSTOM_VIBE_PROMPT, // Reset to 'Viral Pop' default
          productionVariantId: null,
          isProductionVariantLocked: false,
          shouldAutoGenerate: false,
          // Note: We deliberately do NOT reset 'tasks' here so history persists
        }),
    }),
    {
      name: 'create-page-storage', // key in localStorage
      version: 2,
      migrate: () => ({
        // 旧缓存没有归属信息，不能猜测它属于当前账号，因此升级时不迁移创作正文。
        ownerUserId: null,
        newsLink: '',
        newsContent: '',
        newsSummary: '',
        musicPrompt: DEFAULT_CUSTOM_VIBE_PROMPT,
        productionVariantId: null,
        isProductionVariantLocked: false,
        musicTitle: '',
        lyrics: '',
        lyricWorkshop: null,
        musicLyricsSnapshot: null,
        hasUnsavedLyricsChanges: false,
        musicUrl: null,
        musicCoverUrl: null,
        musicId: null,
        workflowRunId: null,
        tasks: [],
        processingTaskId: null,
      }),
      partialize: (state) => ({
        ownerUserId: safeNullableString(state.ownerUserId),
        newsLink: safeString(state.newsLink),
        newsContent: safeString(state.newsContent),
        newsSummary: safeString(state.newsSummary),
        musicPrompt: safeString(state.musicPrompt, DEFAULT_CUSTOM_VIBE_PROMPT),
        productionVariantId: safeNullableString(state.productionVariantId),
        isProductionVariantLocked: state.isProductionVariantLocked,
        musicTitle: safeString(state.musicTitle),
        lyrics: safeString(state.lyrics),
        lyricWorkshop: state.lyricWorkshop,
        musicLyricsSnapshot: safeNullableString(state.musicLyricsSnapshot),
        hasUnsavedLyricsChanges: state.hasUnsavedLyricsChanges,
        musicUrl: safeNullableString(state.musicUrl),
        musicCoverUrl: safeNullableString(state.musicCoverUrl),
        musicId: safeNullableString(state.musicId),
        workflowRunId: safeNullableString(state.workflowRunId),
        tasks: retainTasks(state.tasks),
        processingTaskId: safeNullableString(state.processingTaskId),
      }),
    }
  )
);
