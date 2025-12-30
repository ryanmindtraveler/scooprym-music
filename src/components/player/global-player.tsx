'use client';

import { usePlayerStore } from '@/store/player-store';
import { useEffect, useRef } from 'react';

export function GlobalPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const lastCountedSongId = useRef<string | null>(null);

  // Using selectors to prevent re-renders on every currentTime update
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const playTargetTime = usePlayerStore((state) => state.currentTime);

  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const pause = usePlayerStore((state) => state.pause);

  // Helper to safely play audio and handle interruptions
  const safePlay = async (audio: HTMLAudioElement) => {
    try {
      // If there's already a pending play, we can just wait for it or let the browser handle it
      // But usually we want to start a new play request
      playPromiseRef.current = audio.play();
      await playPromiseRef.current;
      playPromiseRef.current = null;
    } catch (error: unknown) {
      playPromiseRef.current = null;
      // AbortError is expected when pause() interrupts play()
      if (error instanceof Error && error.name === 'NotAllowedError') {
        // Autoplay blocked. We must pause the UI state to match the audio state (paused).
        // This lets the user click "Play" again, which counts as a valid interaction.
        console.warn('Global Player: Autoplay blocked by browser. Pausing UI to require user interaction.');
        pause();
      } else if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Global Player Play Error:', error);
        pause();
      } else {
        // Silently ignore AbortError as it's a normal consequence of rapid toggling
        console.warn('Global Player: Play request was interrupted (standard behavior).');
      }
    }
  };

  // Helper to safely pause audio
  const safePause = async (audio: HTMLAudioElement) => {
    // If a play promise is pending, we technically should wait for it,
    // but browsers allow calling pause() which interrupts the pending play.
    // The interruption is handled in safePlay's catch block.
    audio.pause();
  };

  // Initialize Audio & Event Listeners
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      pause();
      setCurrentTime(0);
    };

    const handlePlay = () => {
      // DEDUPLICATION: Only count if we haven't counted this specific song ID yet
      // This handles resume-from-pause without double counting
      const currentId = usePlayerStore.getState().currentSong?.id;
      if (currentId && lastCountedSongId.current !== currentId) {
        lastCountedSongId.current = currentId;
        fetch(`/api/songs/${currentId}/play`, { method: 'POST' }).catch((err) =>
          console.warn('Failed to track play:', err)
        );
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.src = '';
    };
  }, [setCurrentTime, setDuration, pause]);

  // Handle Play/Pause & Source Change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong) {
      // 1. New Song Loaded
      if (audio.src !== currentSong.audioUrl) {
        audio.src = currentSong.audioUrl;
        audio.load();
      }

      // 2. Play/Pause State Sync
      if (isPlaying) {
        if (audio.paused) {
          void safePlay(audio);
        }
      } else {
        void safePause(audio);
      }
    } else {
      // 3. No Song (Stop/Clear)
      void safePause(audio);
      if (audio.src) {
        audio.src = '';
        audio.currentTime = 0;
      }
    }
  }, [currentSong, isPlaying]);

  // Handle Seeking (Sync Store -> Audio)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (Math.abs(audio.currentTime - playTargetTime) > 1.5) {
      audio.currentTime = playTargetTime;
    }
  }, [playTargetTime]);

  // Handle Volume Change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return null;
}
