import { usePlayerStore } from '@/store';
import type { Song } from '@/types/song';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoreSongPlayer } from './lore-song-player';

const songs: Song[] = [
  {
    id: 'one',
    title: 'First track',
    createdAt: '2026-01-01',
    durationSec: 90,
    plays: 0,
    audioUrl: 'https://audio.example.com/one.mp3',
  },
  {
    id: 'two',
    title: 'Second track',
    createdAt: '2026-01-02',
    durationSec: 95,
    plays: 0,
    audioUrl: 'https://audio.example.com/two.mp3',
  },
];

beforeEach(() => usePlayerStore.getState().stop());
afterEach(cleanup);

describe('栏目与全站播放器共用播放状态', () => {
  it('播放与暂停操作使用同一曲目和队列，不创建额外音频元素', () => {
    const { container } = render(<LoreSongPlayer song={songs[0]} queue={songs} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play First track' }));
    expect(usePlayerStore.getState().currentSong?.id).toBe('one');
    expect(usePlayerStore.getState().queue.map((song) => song.id)).toEqual(['one', 'two']);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Pause First track' }));
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().currentSong?.id).toBe('one');
    expect(container.querySelector('audio')).toBeNull();
  });

  it('没有有效音频时不能切换当前播放器', () => {
    render(<LoreSongPlayer song={{ ...songs[0], audioUrl: null }} />);
    const button = screen.getByRole('button', { name: 'Play First track' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(usePlayerStore.getState().currentSong).toBeNull();
  });
});
