import { recordSongEngagement } from '@/lib/songs/song-engagement-client';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GlobalPlayer } from './global-player';

const mock = vi.hoisted(() => ({
  state: {
    currentSong: { id: 'song', audioUrl: 'https://example.com/song.mp3' },
    isPlaying: false,
    volume: 1,
    currentTime: 0,
    setCurrentTime: vi.fn(),
    setDuration: vi.fn(),
    pause: vi.fn(),
    setIsLoading: vi.fn(),
    playNext: vi.fn(),
  },
}));
vi.mock('@/store', () => ({
  usePlayerStore: Object.assign((select: (state: typeof mock.state) => unknown) => select(mock.state), {
    getState: () => mock.state,
  }),
}));
vi.mock('@/lib/songs/song-engagement-client', () => ({
  createEngagementSessionId: () => 'session',
  recordSongEngagement: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

class FakeAudio extends EventTarget {
  currentTime = 0;
  duration = 60;
  volume = 1;
  src = '';
  paused = true;
  load() {}
  pause() {}
  removeAttribute() {
    this.src = '';
  }
}
let audio: FakeAudio;
let now = 0;
function emit(name: string, time: number, wall: number) {
  audio.currentTime = time;
  now = wall;
  audio.dispatchEvent(new Event(name));
}
beforeEach(() => {
  vi.clearAllMocks();
  now = 0;
  audio = new FakeAudio();
  vi.stubGlobal(
    'Audio',
    class extends FakeAudio {
      constructor() {
        super();
        audio = this;
      }
    }
  );
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('实际 playing 才记开始，暂停恢复不重复，累计30秒后合格', () => {
  render(<GlobalPlayer />);
  emit('play', 0, 0);
  expect(recordSongEngagement).not.toHaveBeenCalled();
  emit('playing', 0, 0);
  emit('timeupdate', 15, 15000);
  emit('pause', 15, 15000);
  emit('playing', 15, 60000);
  emit('timeupdate', 30, 75000);
  emit('timeupdate', 31, 76000);
  expect(recordSongEngagement).toHaveBeenCalledTimes(2);
  expect(recordSongEngagement).toHaveBeenNthCalledWith(1, 'song', 'play_start', 'session');
  expect(recordSongEngagement).toHaveBeenNthCalledWith(2, 'song', 'play_qualified', 'session');
});

it('拖动到结尾不记有效收听或听完', () => {
  render(<GlobalPlayer />);
  emit('playing', 0, 0);
  emit('seeking', 59, 1000);
  emit('playing', 59, 1000);
  emit('ended', 60, 2000);
  expect(recordSongEngagement).toHaveBeenCalledTimes(1);
});

it('正常收听到结束记录听完且继续下一首', () => {
  render(<GlobalPlayer />);
  emit('playing', 0, 0);
  emit('timeupdate', 30, 30000);
  emit('ended', 60, 60000);
  expect(recordSongEngagement).toHaveBeenCalledWith('song', 'play_complete', 'session');
  expect(mock.state.playNext).toHaveBeenCalledTimes(1);
});
