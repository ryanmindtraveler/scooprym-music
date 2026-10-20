import type { SongItem } from '@/app/[locale]/(protected)/dashboard/mysongs/types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SongsTable } from './songs-table';

const mockRetryCover = vi.fn();
const mockTogglePublish = vi.fn();
const mockSchedulePublish = vi.fn();

vi.mock('@/hooks/admin/use-admin-songs', () => ({
  useTogglePublish: () => ({ mutate: mockTogglePublish }),
  useSaveSongPlacement: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSchedulePublish: () => ({ mutate: mockSchedulePublish, isPending: false }),
  useRetrySongCover: () => ({ mutate: mockRetryCover }),
}));

vi.mock('@/store', () => ({
  usePlayerStore: () => ({
    currentSong: null,
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
  }),
}));

vi.mock('@/lib/urls/urls', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/urls/urls')>();
  return {
    ...actual,
    getCanonicalBaseUrl: () => 'https://scooprym.app',
    getBaseUrl: () => 'https://scooprym.app',
  };
});

vi.mock('@/lib/songs/song-seo', () => ({
  getSongCanonicalSlug: () => 'test-song-slug',
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockSongWithCover: SongItem = {
  id: 'song-1',
  title: 'Song With Cover',
  audioUrl: 'https://example.com/audio1.mp3',
  coverImageUrl: 'https://example.com/cover1.webp',
  isPublished: false,
  createdAt: new Date().toISOString(),
  prompt: 'test prompt',
  lyrics: 'test lyrics',
  processingStatus: 'completed',
};

const mockSongWithoutCover: SongItem = {
  id: 'song-2',
  title: 'Song Without Cover',
  audioUrl: 'https://example.com/audio2.mp3',
  coverImageUrl: null,
  isPublished: false,
  createdAt: new Date().toISOString(),
  prompt: 'test prompt',
  lyrics: 'test lyrics',
  processingStatus: 'failed_cover',
};

describe('SongsTable Cover Actions', () => {
  it('有封面的歌曲显示 Regen Cover 按钮，点击触发重试封面', () => {
    render(
      <SongsTable
        data={[mockSongWithCover]}
        total={1}
        pageIndex={0}
        pageSize={10}
        search=""
        status="all"
        sorting={[]}
        loading={false}
        onSearch={vi.fn()}
        onStatusChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    );

    const regenBtn = screen.getByRole('button', { name: /Regen Cover/i });
    expect(regenBtn).toBeDefined();

    fireEvent.click(regenBtn);
    expect(mockRetryCover).toHaveBeenCalledWith('song-1', expect.any(Object));
  });

  it('缺图或失败的歌曲显示 Retry Cover 按钮，点击触发重试封面', () => {
    render(
      <SongsTable
        data={[mockSongWithoutCover]}
        total={1}
        pageIndex={0}
        pageSize={10}
        search=""
        status="all"
        sorting={[]}
        loading={false}
        onSearch={vi.fn()}
        onStatusChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    );

    const retryBtn = screen.getByRole('button', { name: /Retry Cover/i });
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(mockRetryCover).toHaveBeenCalledWith('song-2', expect.any(Object));
  });

  it('生成失败的歌曲禁用发布 Switch 和排期按钮，避免触发门禁错误', () => {
    render(
      <SongsTable
        data={[mockSongWithoutCover]}
        total={1}
        pageIndex={0}
        pageSize={10}
        search=""
        status="all"
        sorting={[]}
        loading={false}
        onSearch={vi.fn()}
        onStatusChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    );

    const publishSwitch = screen.getByRole('switch', { name: /Hidden/i });
    expect(publishSwitch.hasAttribute('disabled')).toBe(true);

    const scheduleBtn = screen.getByRole('button', { name: /Schedule/i });
    expect(scheduleBtn.hasAttribute('disabled')).toBe(true);
  });

  it('已完成的歌曲发布 Switch 处于可用状态，点击触发切换发布', () => {
    render(
      <SongsTable
        data={[mockSongWithCover]}
        total={1}
        pageIndex={0}
        pageSize={10}
        search=""
        status="all"
        sorting={[]}
        loading={false}
        onSearch={vi.fn()}
        onStatusChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    );

    const publishSwitch = screen.getByRole('switch', { name: /Hidden/i });
    expect(publishSwitch.hasAttribute('disabled')).toBe(false);

    fireEvent.click(publishSwitch);
    expect(mockTogglePublish).toHaveBeenCalledWith({ songId: 'song-1', isPublished: true }, expect.any(Object));
  });
});
