import { describe, expect, it } from 'vitest';
import { getSongCanonicalSlug, getSongSearchHeadline, getSongSeoDescription, getSongSeoTitle } from './song-seo';

const song = {
  id: '8155fdcb-1ef0-456e-9a9b-a7b4c7a52d68',
  title: 'Bond’s Bold Blonde',
  newsSummary: "Antonio Banderas pivots from swashbuckling to sci-fi in 'Automata'. Robots find their feelings.",
  sourceText: null,
};

describe('歌曲详情 SEO', () => {
  it('以新闻八卦标题承接搜索意图', () => {
    expect(getSongSearchHeadline(song)).toBe("Antonio Banderas pivots from swashbuckling to sci-fi in 'Automata'.");
  });

  it('URL 使用新闻标题并保留歌曲唯一标识', () => {
    expect(getSongCanonicalSlug(song)).toBe(
      'antonio-banderas-pivots-from-swashbuckling-to-sci-fi-in-automata-8155fdcb-1ef0-456e-9a9b-a7b4c7a52d68'
    );
  });

  it('标题和摘要同时保留新闻主题与歌曲身份', () => {
    expect(getSongSeoTitle(song)).toContain('Antonio Banderas');
    expect(getSongSeoTitle(song)).toContain('Bond’s Bold Blonde');
    expect(getSongSeoDescription(song)).toContain('Bond’s Bold Blonde');
    expect(getSongSeoDescription(song).length).toBeLessThanOrEqual(159);
  });
});
