import { internetLoreTopics } from '@/lib/internet-lore/topics';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { InternetLoreView } from './internet-lore-view';

afterEach(cleanup);

describe('Internet Lore 六专题入口', () => {
  it('按用户指定的六个分类展示真实专题链接，不用具体事件替代分类', () => {
    const { container } = render(<InternetLoreView topics={internetLoreTopics} />);
    const section = screen.getByRole('region', { name: 'Internet Lore Topics' });
    const expected = [
      ['Absurd Social Phenomena', 'absurd-social-phenomena'],
      ['Entertainment Topics', 'entertainment-topics'],
      ['Gossip & Drama', 'gossip-roast'],
      ['News Parody', 'news-parody'],
      ['Meme Culture', 'meme-culture'],
      ['Everyday Contrast Comedy', 'comedy-drill'],
    ];
    const cards = within(section).getAllByRole('article');
    expect(cards).toHaveLength(6);
    expected.forEach(([title, slug], index) => {
      expect(within(cards[index]).getByRole('heading', { name: title })).toBeTruthy();
      expect(
        within(cards[index])
          .getByRole('link', { name: `Explore ${title}` })
          .getAttribute('href')
      ).toBe(`/internet-lore/${slug}`);
    });
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('a[href="#drunk-raccoon"]')).toBeNull();
    expect(container.querySelector('a[href^="/features/"]')).toBeNull();
  });

  it('封面取自对应公开作品；缺少预览时仍保留六个专题入口', () => {
    render(
      <InternetLoreView
        topics={internetLoreTopics}
        previews={{
          'meme-culture': {
            title: 'Haywire',
            coverImageUrl: 'https://public-covers.r2.dev/haywire.webp',
            songCount: 32,
          },
        }}
      />
    );
    const topics = screen.getByRole('region', { name: 'Internet Lore Topics' });
    const memeLink = within(topics).getByRole('link', { name: 'Explore Meme Culture' });
    expect(within(memeLink).getByRole('img', { name: 'Haywire — original song artwork' }).getAttribute('src')).toBe(
      'https://public-covers.r2.dev/haywire.webp'
    );
    expect(within(topics).getAllByRole('article')).toHaveLength(6);
    expect(within(topics).getAllByText('Original song artwork')).toHaveLength(1);
    expect(within(memeLink).getByText('32 songs')).toBeTruthy();
    expect(within(topics).getByRole('link', { name: 'Explore Gossip & Drama' }).getAttribute('href')).toBe(
      '/internet-lore/gossip-roast'
    );
  });
});
