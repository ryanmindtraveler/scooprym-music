import { getLoreTopicArchiveCases } from '@/lib/internet-lore/archive-cases';
import { getLoreTopicArchiveSongs } from '@/lib/internet-lore/song-catalog';
import { internetLoreTopics } from '@/lib/internet-lore/topics';
import type { Song } from '@/types/song';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InternetLoreArchive } from './internet-lore-archive';

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

describe('原专题主题与未发布作品的展示边界', () => {
  it('原九首保持可读但不可播放，九个索引都指向本页实际条目', () => {
    const topic = internetLoreTopics[0];
    const cases = getLoreTopicArchiveCases(topic);
    const archive = getLoreTopicArchiveSongs(topic);
    const { container } = render(<InternetLoreArchive topic={topic} cases={cases} archive={archive} songs={[]} />);
    const region = screen.getByRole('region', { name: 'Original Archive' });
    expect(within(region).getAllByRole('article')).toHaveLength(9);
    expect(within(region).getAllByText('Archived · Currently unavailable')).toHaveLength(9);
    expect(within(region).getByText('The Bardstown Bender')).toBeTruthy();
    expect(within(region).queryByRole('button')).toBeNull();
    expect(container.querySelector('audio')).toBeNull();
    expect(container.querySelector('a[href^="/songs/"]')).toBeNull();
    fireEvent.click(screen.getByText('Jump to a theme'));
    expect(container.querySelector('details')?.open).toBe(true);
    for (const link of within(screen.getByRole('navigation', { name: 'Collection index' })).getAllByRole('link')) {
      const target = container.querySelector(link.getAttribute('href')!);
      expect(target?.tagName).toBe('ARTICLE');
    }
  });

  it('其余专题展示原主题，不把九个主题算作九首歌', () => {
    const topic = internetLoreTopics[1];
    render(<InternetLoreArchive topic={topic} cases={getLoreTopicArchiveCases(topic)} archive={[]} songs={[]} />);
    const region = screen.getByRole('region', { name: 'Original Archive' });
    expect(within(region).getAllByRole('article')).toHaveLength(9);
    expect(within(region).getByText('9 themes')).toBeTruthy();
    expect(
      within(region).getByText('The original song links for this collection are currently unavailable.')
    ).toBeTruthy();
    expect(within(region).queryByText('Original track')).toBeNull();
    expect(within(region).queryByRole('button')).toBeNull();
    expect(player).not.toHaveBeenCalled();
  });

  it('公开原作使用原 ID 队列，当前同主题歌曲即使传入也被排除', () => {
    const topic = internetLoreTopics[0];
    const archive = getLoreTopicArchiveSongs(topic);
    const original: Song = {
      id: archive[0].id,
      title: archive[0].title,
      seoSlug: 'original-raccoon',
      createdAt: '2026-03-24',
      plays: 0,
      durationSec: 60,
      audioUrl: 'https://example.com/original.mp3',
      coverImageUrl: 'https://original.r2.dev/cover.jpg',
      publicationChannel: 'internet_lore',
      loreTopicSlug: topic.slug,
    };
    const current: Song = {
      ...original,
      publicationChannel: 'gallery',
      loreTopicSlug: null,
      id: '5ccdaff4-3a70-46cb-a4a8-4f52d96939e4',
      title: 'Raccoon on the Run',
    };
    render(
      <InternetLoreArchive
        topic={topic}
        cases={getLoreTopicArchiveCases(topic)}
        archive={archive}
        songs={[original, current]}
      />
    );
    expect(screen.getByRole('button', { name: 'Play The Bardstown Bender' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Play Raccoon on the Run' })).toBeNull();
    expect(player.mock.calls[0][0].queue).toEqual([original]);
    const card = screen.getByRole('article', { name: original.title });
    expect(
      within(card)
        .getByRole('img', { name: `${original.title} cover art` })
        .getAttribute('src')
    ).toBe(original.coverImageUrl);
    for (const name of [original.title, `View ${original.title} details`, `Song details: ${original.title}`]) {
      const link = within(card).getByRole('link', { name });
      expect(link.getAttribute('href')).toBe('/songs/original-raccoon');
      expect(link.tagName).toBe('A');
    }
  });
});
