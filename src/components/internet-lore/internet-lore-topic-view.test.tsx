import { internetLoreEntries } from '@/lib/internet-lore/content';
import { internetLoreTopics } from '@/lib/internet-lore/topics';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InternetLoreTopicView } from './internet-lore-topic-view';

vi.mock('./lore-stories', () => ({
  LoreStories: () => <section aria-label="案例歌曲">Public case soundtrack</section>,
}));
vi.mock('./lore-song-player', () => ({ LoreSongPlayer: () => <button type="button">Play track</button> }));

afterEach(cleanup);

describe('专题介绍、作品边界与相互导航', () => {
  it('每个专题有独立标题、介绍、返回入口及其他五专题链接', () => {
    const topic = internetLoreTopics[4];
    const { container } = render(<InternetLoreTopicView topic={topic} entries={[]} songs={[]} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Meme Culture' })).toBeTruthy();
    expect(screen.getByText(topic.introduction[0])).toBeTruthy();
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' }))
        .getByRole('link')
        .getAttribute('href')
    ).toBe('/internet-lore');
    const related = screen.getByRole('region', { name: 'Other Internet Lore Topics' });
    expect(within(related).getAllByRole('link')).toHaveLength(5);
    expect(related.querySelector('a[href="/internet-lore/meme-culture"]')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('a[href^="/songs/"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Browse all songs' }).getAttribute('href')).toBe('/songs');
  });

  it('完整歌曲列表位于介绍与案例之前，空曲库提示与实际公开状态一致', () => {
    render(
      <InternetLoreTopicView
        topic={internetLoreTopics[0]}
        entries={[{ ...internetLoreEntries[0], song: null }]}
        songs={[]}
      />
    );
    expect(screen.getByRole('region', { name: '案例歌曲' })).toBeTruthy();
    const songs = screen.getByRole('region', { name: 'Original Archive' });
    const background = screen.getByRole('region', { name: 'Topic Background' });
    expect(songs.compareDocumentPosition(background) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(songs).getByText(/9 original tracks are listed below/)).toBeTruthy();
    expect(within(songs).getAllByText('Archived · Currently unavailable')).toHaveLength(9);
  });
});
