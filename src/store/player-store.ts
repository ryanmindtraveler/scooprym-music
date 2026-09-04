import { create } from 'zustand';

export interface Song {
  id: string;
  title: string;
  artist?: string;
  audioUrl: string;
  coverImageUrl?: string | null;
  newsSummary?: string;
  newsContent?: string;
  newsLink?: string;
}

interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentSong: Song | null;
  currentTime: number;
  duration: number;
  volume: number;
  isExpanded: boolean; // For the bottom player bar UI if we implement it later
  isGenerating: boolean; // Tracking if a new song is being generated
  queue: Song[];
  queueIndex: number;

  // Actions
  play: (song?: Song, queue?: Song[]) => void;
  pause: () => void;
  stop: () => void;
  togglePlay: () => void;
  setSong: (song: Song) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  setCoverImage: (url: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setQueue: (queue: Song[], startSongId?: string) => void;
  playNext: () => void;
  playPrevious: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  isLoading: false,
  currentSong: null,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isExpanded: true,
  isGenerating: false,
  queue: [],
  queueIndex: -1,

  play: (song, queue) => {
    const { currentSong } = get();
    if (song) {
      const nextQueue = queue?.filter((item) => Boolean(item.audioUrl)) ?? get().queue;
      const nextQueueIndex = nextQueue.findIndex((item) => item.id === song.id);
      if (currentSong?.id !== song.id) {
        set({
          currentSong: song,
          isPlaying: true,
          isLoading: true,
          currentTime: 0,
          queue: nextQueue,
          queueIndex: nextQueueIndex,
        });
      } else {
        set({ isPlaying: true, queue: nextQueue, queueIndex: nextQueueIndex });
      }
    } else if (currentSong) {
      set({ isPlaying: true });
    }
  },

  pause: () => {
    set({ isPlaying: false });
  },

  stop: () => {
    set({ currentSong: null, isPlaying: false, currentTime: 0, queue: [], queueIndex: -1 });
  },

  togglePlay: () => {
    const { isPlaying, currentSong } = get();
    if (currentSong) {
      set({ isPlaying: !isPlaying });
    }
  },

  setSong: (song) => {
    const { currentSong } = get();
    if (currentSong?.id !== song.id) {
      set({ currentSong: song, isPlaying: true, isLoading: true, currentTime: 0 });
    }
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  setDuration: (duration) => {
    set({ duration });
  },

  setVolume: (volume) => {
    set({ volume });
  },

  toggleExpanded: () => {
    set({ isExpanded: !get().isExpanded });
  },

  setExpanded: (isExpanded: boolean) => {
    set({ isExpanded });
  },

  setCoverImage: (url: string) => {
    const { currentSong } = get();
    if (currentSong) {
      set({ currentSong: { ...currentSong, coverImageUrl: url } });
    }
  },

  setIsLoading: (isLoading) => {
    set({ isLoading });
  },

  setIsGenerating: (isGenerating) => {
    set({ isGenerating });
  },

  setQueue: (queue, startSongId) => {
    const playableQueue = queue.filter((item) => Boolean(item.audioUrl));
    const queueIndex = startSongId ? playableQueue.findIndex((item) => item.id === startSongId) : -1;
    set({ queue: playableQueue, queueIndex });
  },

  playNext: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) {
      set({ isPlaying: false, currentTime: 0 });
      return;
    }
    const nextIndex = queueIndex >= 0 && queueIndex < queue.length - 1 ? queueIndex + 1 : 0;
    set({ currentSong: queue[nextIndex], queueIndex: nextIndex, isPlaying: true, isLoading: true, currentTime: 0 });
  },

  playPrevious: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) return;
    const previousIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    set({
      currentSong: queue[previousIndex],
      queueIndex: previousIndex,
      isPlaying: true,
      isLoading: true,
      currentTime: 0,
    });
  },
}));
