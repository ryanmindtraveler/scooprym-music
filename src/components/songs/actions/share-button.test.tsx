import { recordSongEngagement } from '@/lib/songs/song-engagement-client';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, expect, it, vi } from 'vitest';
import { ShareButton } from './share-button';

vi.mock('@/lib/urls/urls', () => ({ getCanonicalBaseUrl: () => 'https://scooprym.app' }));
vi.mock('@/lib/songs/song-engagement-client', () => ({
  createEngagementSessionId: () => 'test',
  recordSongEngagement: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('复制失败不记录分享，不显示成功提示', async () => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
  });
  render(<ShareButton songId="song" songTitle="Song" />);
  fireEvent.click(screen.getByRole('button', { name: 'Share song' }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(recordSongEngagement).not.toHaveBeenCalled();
  expect(toast.success).not.toHaveBeenCalled();
});

it('分享新闻规范地址，不再生成旧歌曲标题地址或语言前缀', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  window.history.replaceState(null, '', '/zh/songs');
  render(
    <ShareButton
      songId="d6b130d8-47ad-4076-8712-d302b2de7125"
      songTitle="Urban Legends Nashville Lies"
      newsSummary="Karley Scott Collins shuts down the Keith Urban dating rumors"
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Share song' }));
  expect(writeText).toHaveBeenCalledWith(
    'https://scooprym.app/songs/karley-scott-collins-shuts-down-the-keith-urban-dating-rumors-d6b130d8-47ad-4076-8712-d302b2de7125'
  );
  window.history.replaceState(null, '', '/');
});
