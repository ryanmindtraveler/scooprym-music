import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PersistentPlayer } from './persistent-player';

const mock = vi.hoisted(() => ({ path: '/songs/example', stop: vi.fn(), toggle: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useLocalePathname: () => mock.path }));
vi.mock('@/store', () => ({
  usePlayerStore: (select: (state: any) => unknown) =>
    select({
      currentSong: { id: 'one', title: 'Test song' },
      isPlaying: true,
      currentTime: 2,
      duration: 60,
      queue: [],
      togglePlay: mock.toggle,
      stop: mock.stop,
    }),
}));
vi.mock('@/components/songs/actions/share-button', () => ({ ShareButton: () => null }));
vi.mock('@/components/ui/slider', () => ({ Slider: () => null }));
vi.mock('next/image', () => ({ default: () => null }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe('详情页不重复显示悬浮播放栏', () => {
  it('详情页隐藏但不停止播放', () => {
    mock.path = '/songs/example';
    render(<PersistentPlayer />);
    expect(screen.queryByLabelText('Now playing')).toBeNull();
    expect(mock.stop).not.toHaveBeenCalled();
    expect(mock.toggle).not.toHaveBeenCalled();
  });
  it('离开详情页后恢复播放栏', () => {
    mock.path = '/songs/example/';
    const view = render(<PersistentPlayer />);
    mock.path = '/';
    view.rerender(<PersistentPlayer />);
    expect(screen.getByLabelText('Now playing')).toBeTruthy();
  });
  it('不影响后台歌曲列表', () => {
    mock.path = '/admin/songs';
    render(<PersistentPlayer />);
    expect(screen.getByLabelText('Now playing')).toBeTruthy();
  });
});
