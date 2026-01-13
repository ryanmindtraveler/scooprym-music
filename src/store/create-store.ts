import { DEFAULT_CUSTOM_VIBE_PROMPT } from '@/components/create/form/create-music-data';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Task Interface for Queue
export interface CreationTask {
  id: string;
  status: 'processing' | 'generating_cover' | 'completed' | 'failed' | 'completed_without_cover';
  title: string;
  coverUrl?: string;
  audioUrl?: string;
  lyrics?: string; // Snapshot of lyrics used
  style?: string;
  newsSummary?: string; // Backstory context
  newsContent?: string; // Original User Input
  newsLink?: string; // Original URL
  createdAt: number;
}

interface CreateState {
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
  musicTitle: string;
  setMusicTitle: (title: string) => void;

  // Lyrics State
  lyrics: string;
  setLyrics: (lyrics: string) => void;
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

  // Task Queue (Background)
  tasks: CreationTask[];
  addTask: (task: CreationTask) => void;
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
      newsLink: '',
      setNewsLink: (newsLink) => set({ newsLink }),
      newsContent: '',
      setNewsContent: (newsContent) => set({ newsContent }),
      newsSummary: '',
      setNewsSummary: (newsSummary) => set({ newsSummary }),

      // Default Prompt set to 'Viral Pop' (Custom Vibe)
      musicPrompt: DEFAULT_CUSTOM_VIBE_PROMPT,
      setMusicPrompt: (musicPrompt) => set({ musicPrompt }),

      musicTitle: '',
      setMusicTitle: (musicTitle) => set({ musicTitle }),

      lyrics: '',
      setLyrics: (lyrics) => set({ lyrics }),
      musicLyricsSnapshot: null,
      setMusicLyricsSnapshot: (musicLyricsSnapshot) => set({ musicLyricsSnapshot }),
      hasUnsavedLyricsChanges: false,
      setHasUnsavedLyricsChanges: (hasUnsavedLyricsChanges) => set({ hasUnsavedLyricsChanges }),

      musicUrl: null,
      setMusicUrl: (musicUrl) => set({ musicUrl }),
      musicCoverUrl: null,
      setMusicCoverUrl: (musicCoverUrl) => set({ musicCoverUrl }),
      musicId: null,
      setMusicId: (musicId) => set({ musicId }),

      // Task Queue Actions
      tasks: [],
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks].slice(0, 10) })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
      clearCompletedTasks: () =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.status === 'processing' || t.status === 'generating_cover'),
        })),

      processingTaskId: null,
      setProcessingTaskId: (processingTaskId) => set({ processingTaskId }),

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
          musicLyricsSnapshot: null,
          hasUnsavedLyricsChanges: false,
          musicUrl: null,
          musicCoverUrl: null,
          musicId: null,
          processingTaskId: null,
          musicPrompt: DEFAULT_CUSTOM_VIBE_PROMPT, // Reset to 'Viral Pop' default
          shouldAutoGenerate: false,
          // Note: We deliberately do NOT reset 'tasks' here so history persists
        }),
    }),
    {
      name: 'create-page-storage', // key in localStorage
    }
  )
);
