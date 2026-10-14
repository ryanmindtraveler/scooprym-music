'use client';

import { usePlayerStore } from '@/store';
import styles from '@/styles/internet-lore.module.css';
import type { Song } from '@/types/song';
import { Loader2, Pause, Play } from 'lucide-react';

function toPlayerSong(song: Song) {
  return {
    id: song.id,
    seoSlug: song.seoSlug,
    title: song.title,
    artist: 'ScoopRYM',
    audioUrl: song.audioUrl || '',
    coverImageUrl: song.coverImageUrl,
    newsSummary: song.newsSummary || undefined,
    newsLink: song.sourceUrl || undefined,
  };
}

/** 接入现有全站播放器，避免栏目另建音频实例。 */
export function LoreSongPlayer({
  song,
  queue = [],
  className,
  showTitle = true,
  iconOnly = false,
}: {
  song: Song;
  queue?: Song[];
  className?: string;
  showTitle?: boolean;
  iconOnly?: boolean;
}) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isLoading = usePlayerStore((state) => state.isLoading);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const isCurrent = currentSong?.id === song.id;
  const active = isCurrent && isPlaying;

  const handlePlay = () => {
    if (active) pause();
    else if (song.audioUrl) play(toPlayerSong(song), (queue.length ? queue : [song]).map(toPlayerSong));
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={!song.audioUrl}
      aria-label={`${active ? 'Pause' : 'Play'} ${song.title}`}
      aria-pressed={active}
      className={`${styles.playerButton} ${className || ''}`}
    >
      <span className={styles.playerIcon} aria-hidden="true">
        {isCurrent && isLoading ? <Loader2 className={styles.loadingIcon} /> : active ? <Pause /> : <Play />}
      </span>
      {!iconOnly && (
        <span className={styles.playerCopy}>
          <span className={styles.playerAction}>
            {isCurrent && isLoading ? 'Loading track' : active ? 'Pause track' : 'Play track'}
          </span>
          {showTitle && <span className={styles.playerTitle}>{song.title}</span>}
        </span>
      )}
    </button>
  );
}
