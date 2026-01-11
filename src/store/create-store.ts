import { DEFAULT_CUSTOM_VIBE_PROMPT } from '@/components/create/create-music-data';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // Music Result
  musicUrl: string | null;
  setMusicUrl: (url: string | null) => void;
  musicCoverUrl: string | null;
  setMusicCoverUrl: (url: string | null) => void;
  musicId: string | null; // The ID of the successfully generated song
  setMusicId: (id: string | null) => void;

  // Process State
  processingTaskId: string | null; // For resuming polling in the background
  setProcessingTaskId: (id: string | null) => void;

  // Auto-start generation signal
  shouldAutoGenerate: boolean;
  setShouldAutoGenerate: (flag: boolean) => void;

  // Actions
  reset: () => void;
}

export const useCreateStore = create<CreateState>()(
  persist(
    (set) => ({
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
        }),
    }),
    {
      name: 'create-page-storage', // key in localStorage
    }
  )
);
