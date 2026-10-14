import { getLoreTopicArchiveSongs } from '@/lib/internet-lore/song-catalog';
import type { Song } from '@/types/song';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InternetLoreSongList } from './internet-lore-song-list';

const player = vi.hoisted(() => vi.fn());
vi.mock('./lore-song-player', () => ({
  LoreSongPlayer: (props: { song: Song; queue: Song[] }) => {
    player(props);
    return (
      <button type="button" aria-label={`Play ${props.song.title}`}>
        Play
      </button>
    );
  },
}));

afterEach(() => {
  cleanup();
  player.mockClear();
});
const songs: Song[] = Array.from({ length: 15 }, (_, i) => ({
  id: `song-${i}`,
  title: `Track ${i}`,
  seoSlug: `track-${i}`,
  createdAt: '2026-10-13',
  durationSec: 120,
  plays: 0,
  audioUrl: `https://example.com/track-${i}.mp3`,
  coverImageUrl: null,
  newsSummary: `Story ${i} became a public conversation.`,
}));

describe('专题完整歌曲列表', () => {
  it('不截断曲目，并让每个试听按钮使用完整分类队列', () => {
    render(<InternetLoreSongList songs={songs} />);
    const catalog = screen.getByRole('region', { name: 'Topic Songs' });
    expect(within(catalog).getAllByRole('article')).toHaveLength(15);
    expect(within(catalog).getByText('15 songs')).toBeTruthy();
    expect(within(catalog).getByRole('button', { name: 'Play Track 14' })).toBeTruthy();
    expect(within(catalog).getByRole('link', { name: 'Lyrics & story: Track 14' }).getAttribute('href')).toBe(
      '/songs/track-14'
    );
    expect(player.mock.calls.every(([props]) => props.queue === songs)).toBe(true);
  });

  it('空曲库不生成假曲目、试听按钮或歌词地址', () => {
    render(<InternetLoreSongList songs={[]} />);
    const catalog = screen.getByRole('region', { name: 'Topic Songs' });
    expect(within(catalog).queryByRole('article')).toBeNull();
    expect(within(catalog).queryByRole('button')).toBeNull();
    expect(
      within(catalog)
        .getByRole('link', { name: /Browse all published songs/ })
        .getAttribute('href')
    ).toBe('/songs');
  });

  it('下架原歌保留旧顺序与名称，不用当前歌曲补位或暴露试听链接', () => {
    const archive = getLoreTopicArchiveSongs({ slug: 'absurd-social-phenomena' });
    render(<InternetLoreSongList songs={songs} archive={archive} />);
    const catalog = screen.getByRole('region', { name: 'Topic Songs' });
    const articles = within(catalog).getAllByRole('article');
    expect(articles.map((article) => article.getAttribute('aria-label'))).toEqual(archive.map((track) => track.title));
    expect(within(catalog).getByText('9 original tracks · 0 available')).toBeTruthy();
    expect(within(catalog).queryByRole('button')).toBeNull();
    expect(catalog.querySelector('a[href^="/songs/"]')).toBeNull();
    expect(within(catalog).queryByText('Track 0')).toBeNull();
    expect(player).not.toHaveBeenCalled();
  });
});
