import { internetLoreEntries } from '@/lib/internet-lore/content';
import type { Song } from '@/types/song';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoreStories } from './lore-stories';

vi.mock('@/components/songs/song-cover-image', () => ({
  SongCoverImage: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));
vi.mock('./lore-song-player', () => ({
  LoreSongPlayer: ({ song }: { song: Song }) => <button type="button">Play {song.title}</button>,
}));

afterEach(cleanup);

describe('Internet Lore 的事件正文与公开作品边界', () => {
  it('作品不可用时保留正文和来源，只提供真实曲库入口', () => {
    const entry = internetLoreEntries[0];
    const { container } = render(<LoreStories entries={[{ ...entry, song: null }]} />);

    expect(screen.getByRole('heading', { name: entry.title })).toBeTruthy();
    expect(screen.getByText(entry.paragraphs[0])).toBeTruthy();
    expect(screen.getByRole('link', { name: entry.sources[0].title }).getAttribute('href')).toBe(entry.sources[0].url);
    expect(screen.getByText('This track is currently unavailable. Explore more songs.')).toBeTruthy();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('a[href^="/songs/"]')).toBeNull();
    expect(screen.getByRole('link', { name: /Explore more songs/ }).getAttribute('href')).toBe('/songs');
  });

  it('公开歌曲使用现有规范地址，目次锚点都指向真实正文', () => {
    const entry = internetLoreEntries[0];
    const song: Song = {
      id: entry.songId,
      title: 'Raccoon on the Run',
      seoSlug: 'virginia-liquor-store-raccoon-scooprym',
      createdAt: '2026-01-01T00:00:00Z',
      durationSec: 90,
      plays: 0,
      audioUrl: 'https://audio.example.com/raccoon.mp3',
    };
    const { container } = render(<LoreStories entries={[{ ...entry, song }]} />);

    expect(screen.getByRole('link', { name: /Read lyrics & song story/ }).getAttribute('href')).toBe(
      '/songs/virginia-liquor-store-raccoon-funny-song'
    );
    expect(container.querySelector(`article[id="${entry.slug}"]`)).toBeTruthy();
    expect(container.querySelectorAll('h1')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Play Raccoon on the Run' })).toBeTruthy();
  });
});
