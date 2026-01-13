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
  currentSong: Song | null;
  currentTime: number;
  duration: number;
  volume: number;
  isExpanded: boolean; // For the bottom player bar UI if we implement it later
  isGenerating: boolean; // Tracking if a new song is being generated

  // Actions
  play: (song?: Song) => void;
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
  setIsGenerating: (isGenerating: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentSong: null,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isExpanded: true,
  isGenerating: false,

  play: (song) => {
    const { currentSong } = get();
    if (song) {
      if (currentSong?.id !== song.id) {
        set({ currentSong: song, isPlaying: true, currentTime: 0 });
      } else {
        set({ isPlaying: true });
      }
    } else if (currentSong) {
      set({ isPlaying: true });
    }
  },

  pause: () => {
    set({ isPlaying: false });
  },

  stop: () => {
    set({ currentSong: null, isPlaying: false, currentTime: 0 });
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
      set({ currentSong: song, isPlaying: true, currentTime: 0 });
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

  setIsGenerating: (isGenerating) => {
    set({ isGenerating });
  },
}));
