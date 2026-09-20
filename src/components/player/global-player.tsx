'use client';

import { ListeningClock } from '@/lib/songs/listening-clock';
import { createEngagementSessionId, recordSongEngagement } from '@/lib/songs/song-engagement-client';
import { usePlayerStore } from '@/store';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function GlobalPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const lastCountedSongId = useRef<string | null>(null);
  const playSessionRef = useRef<string | null>(null);
  const qualifiedSessionRef = useRef<string | null>(null);
  const listeningClock = useRef(new ListeningClock());

  // Using selectors to prevent re-renders on every currentTime update
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const playTargetTime = usePlayerStore((state) => state.currentTime);

  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const pause = usePlayerStore((state) => state.pause);
  const setIsLoading = usePlayerStore((state) => state.setIsLoading);
  const playNext = usePlayerStore((state) => state.playNext);

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
      const currentId = usePlayerStore.getState().currentSong?.id;
      const sessionId = playSessionRef.current;
      const listened = listeningClock.current.update(audio.currentTime, performance.now());
      if (currentId && sessionId && listened >= 30 && qualifiedSessionRef.current !== sessionId) {
        qualifiedSessionRef.current = sessionId;
        void recordSongEngagement(currentId, 'play_qualified', sessionId).catch(() => {});
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      const currentId = usePlayerStore.getState().currentSong?.id;
      const listened = listeningClock.current.update(audio.currentTime, performance.now());
      if (currentId && playSessionRef.current && audio.duration > 0 && listened >= audio.duration * 0.9) {
        void recordSongEngagement(currentId, 'play_complete', playSessionRef.current).catch(() => {});
      }
      lastCountedSongId.current = null;
      listeningClock.current.stop();
      playNext();
    };

    const handleWaiting = () => {
      listeningClock.current.stop();
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handlePlayingEvent = () => {
      setIsLoading(false);
      handlePlay();
      listeningClock.current.start(audio.currentTime, performance.now());
    };

    const handlePause = () => {
      listeningClock.current.update(audio.currentTime, performance.now());
      listeningClock.current.stop();
    };
    const handleSeeking = () => listeningClock.current.stop();

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handlePlay = () => {
      // DEDUPLICATION: Only count if we haven't counted this specific song ID yet
      // This handles resume-from-pause without double counting
      const currentId = usePlayerStore.getState().currentSong?.id;
      if (currentId && lastCountedSongId.current !== currentId) {
        lastCountedSongId.current = currentId;
        playSessionRef.current = createEngagementSessionId('play');
        qualifiedSessionRef.current = null;
        listeningClock.current.reset();
        fetch(`/api/songs/${currentId}/play`, { method: 'POST' }).catch((err) =>
          console.warn('Failed to track play:', err)
        );
        void recordSongEngagement(currentId, 'play_start', playSessionRef.current).catch(() => {});
      }
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      console.error('Global Player Audio Error:', target.error, 'Src:', target.src, 'CurrentSrc:', target.currentSrc);

      let message = 'Playback error';
      if (target.error) {
        switch (target.error.code) {
          case target.error.MEDIA_ERR_ABORTED:
            message = 'Playback aborted';
            break;
          case target.error.MEDIA_ERR_NETWORK:
            message = 'Network error during playback';
            break;
          case target.error.MEDIA_ERR_DECODE:
            message = 'Audio decoding failed';
            break;
          case target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'Audio format not supported or file not found';
            // Specific user error match
            break;
          default:
            message = `Playback error: ${target.error.message}`;
        }
      }

      // Since this is a component, we can import { toast } from 'sonner'
      toast.error(message);
      setIsLoading(false);
      pause();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting); // Buffering...
    audio.addEventListener('canplay', handleCanPlay); // Ready
    audio.addEventListener('playing', handlePlayingEvent); // More reliable for "Actually Started"
    audio.addEventListener('loadeddata', handleLoadedData); // Early data availability

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlayingEvent);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.src = '';
    };
  }, [setCurrentTime, setDuration, pause, setIsLoading, playNext]);

  // Track the currently loaded URL to avoid infinite re-loading if `audio.src` (absolute) != `audioUrl` (relative)
  const currentUrlRef = useRef<string | null>(null);

  // Handle Play/Pause & Source Change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Check if we effectively have a song (must have a valid URL)
    const hasValidAudio = currentSong?.audioUrl && currentSong.audioUrl !== 'processing';

    if (hasValidAudio) {
      // 1. New Song Loaded
      if (currentUrlRef.current !== currentSong.audioUrl) {
        listeningClock.current.reset();
        lastCountedSongId.current = null;
        playSessionRef.current = null;
        currentUrlRef.current = currentSong.audioUrl;
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
      // 3. No Valid Song (Stop/Clear) because no URL or no song object
      void safePause(audio);
      if (audio.src) {
        // Only clear if not already cleared to avoid redundant events
        // And don't set to empty string if it causes issues, but usually removing attribute is hard in raw JS prop.
        // Setting to empty string is standard but we must ensure we don't 'load' it.
        audio.removeAttribute('src');
        audio.load(); // Needed to drop the previous buffer? Or just pause is enough?
        // Actually best to just pause and reset time. Setting src='' can trigger the error we saw if we call load().
        // So we just pause.
        currentUrlRef.current = null;
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
