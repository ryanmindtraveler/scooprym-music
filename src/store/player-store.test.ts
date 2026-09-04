import { beforeEach, describe, expect, it } from 'vitest';
import { type Song, usePlayerStore } from './player-store';

const songs: Song[] = [
  { id: 'one', title: 'One', audioUrl: 'https://audio.example.com/one.mp3' },
  { id: 'two', title: 'Two', audioUrl: 'https://audio.example.com/two.mp3' },
  { id: 'missing', title: 'Missing', audioUrl: '' },
];

describe('player queue', () => {
  beforeEach(() => {
    usePlayerStore.getState().stop();
  });

  it('filters unplayable songs and advances to the next track', () => {
    usePlayerStore.getState().play(songs[0], songs);
    expect(usePlayerStore.getState().queue.map((song) => song.id)).toEqual(['one', 'two']);

    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentSong?.id).toBe('two');
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('loops at the end of a queue', () => {
    usePlayerStore.getState().play(songs[1], songs);
    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentSong?.id).toBe('one');
  });

  it('stops cleanly when no queue exists', () => {
    usePlayerStore.getState().play(songs[0]);
    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });
});
