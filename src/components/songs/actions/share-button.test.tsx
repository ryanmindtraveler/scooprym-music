import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ShareButton } from './share-button';

vi.mock('@/lib/urls/urls', () => ({ getCanonicalBaseUrl: () => 'https://scooprym.app' }));
vi.mock('@/lib/songs/song-engagement-client', () => ({
  createEngagementSessionId: () => 'test',
  recordSongEngagement: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
