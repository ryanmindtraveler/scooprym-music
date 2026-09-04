import { describe, expect, it } from 'vitest';
import { getNewsCardSummary, getNewsDescription, getNewsTitle } from './song-editorial';
import { getSongStoryContext } from './song-seo';
import type { Song } from '@/types/song';

describe('新闻卡片短摘要', () => {
  it('保留既有短摘要全文', () => {
    const summary = 'Miley Cyrus playfully roasts her superfan neighbor Alex Cooper.';
    expect(getNewsCardSummary({ newsSummary: summary })).toBe(summary);
  });

  it('长摘要优先保留完整首句', () => {
    expect(getNewsCardSummary({ newsSummary: `Miley teases her neighbor. ${'Background detail '.repeat(30)}` })).toBe(
      'Miley teases her neighbor.'
    );
  });

  it('超长单句按单词边界截取且不修改原文', () => {
    const song = { newsSummary: 'A very long source summary '.repeat(30) };
    const original = song.newsSummary;
    const result = getNewsCardSummary(song);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.endsWith('…')).toBe(true);
    expect(song.newsSummary).toBe(original);
  });

  it('缺少摘要时不泄漏原始素材', () => {
    expect(getNewsCardSummary({ sourceText: 'A short story.' })).toContain('The internet');
    expect(getNewsCardSummary({})).toContain('The internet');
  });

  it('单句摘要不会追加抓取的导航和广告地址', () => {
    const song = {
      id: 'test',
      title: 'Haywire',
      newsSummary: 'Players hunt a needle in five million straws.',
      sourceText:
        'Title: News URL Source: https://example.com Markdown Content: ![](https://ads.example.com/video.mp4)',
    } as Song;
    expect(getNewsDescription(song)).toBe('');
    expect(getSongStoryContext(song)).toBe('');
    expect(getNewsTitle({ ...song, newsSummary: null })).not.toContain('https');
    expect(getNewsCardSummary(song)).toBe(song.newsSummary);
  });

  it('保留摘要的补充句并限制长度', () => {
    expect(getNewsDescription({ newsSummary: 'The game went viral. Players keep searching.' } as Song)).toBe(
      'Players keep searching.'
    );
    expect(
      getNewsDescription({ newsSummary: `The game went viral. ${'More background '.repeat(60)}` } as Song).length
    ).toBeLessThanOrEqual(200);
  });

  it('摘要中的Markdown和裸地址不会暴露媒体链接', () => {
    const result = getNewsCardSummary({
      newsSummary:
        'A [viral game](https://example.com) surprises players. ![](https://example.com/ad.jpg) https://example.com/video.mp4',
    });
    expect(result).toBe('A viral game surprises players.');
  });
});
