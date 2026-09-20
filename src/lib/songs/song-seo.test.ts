import { describe, expect, it } from 'vitest';
import { getIdFromSlug } from '../utils';
import { getSongCanonicalSlug, getSongSearchHeadline, getSongSeoDescription, getSongSeoTitle } from './song-seo';

const song = {
  id: '8155fdcb-1ef0-456e-9a9b-a7b4c7a52d68',
  title: 'Banderas & Robot Soul',
  newsSummary: "Antonio Banderas pivots from swashbuckling to sci-fi in 'Automata'. Robots find their feelings.",
  sourceText: null,
};

describe('歌曲详情 SEO', () => {
  it('缺失摘要显示真实歌名但不迁移历史规范地址', () => {
    const item = { ...song, title: 'Billionaire Buffet', newsSummary: null };
    expect(getSongSearchHeadline(item)).toBe('Billionaire Buffet');
    expect(getSongSeoTitle(item)).toBe('Billionaire Buffet — Listen & Lyrics');
    expect(getSongCanonicalSlug(item)).toBe(`the-internet-did-what-${item.id}`);
    expect(getSongSeoDescription(item)).not.toContain('inspired by this story');
  });

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
    expect(getSongSeoTitle(song)).toContain('Banderas & Robot Soul');
    expect(getSongSeoDescription(song)).toContain('Banderas & Robot Soul');
    expect(getSongSeoDescription(song).length).toBeLessThanOrEqual(159);
  });

  it('含加号的旧网址仍能定位歌曲，新规范网址不再包含加号', () => {
    const item = { ...song, newsSummary: 'A woman kissed the male lead 60+ times.' };
    const oldSlug = `a-woman-kissed-the-male-lead-60+-times-${item.id}`;
    const canonical = getSongCanonicalSlug(item);
    expect(getIdFromSlug(oldSlug)).toBe(item.id);
    expect(canonical).toBe(`a-woman-kissed-the-male-lead-60-times-${item.id}`);
    expect(getIdFromSlug(canonical)).toBe(item.id);
    expect(decodeURIComponent(encodeURIComponent(canonical))).toBe(canonical);
  });

  it.each(['60+ times', 'A + B = chaos', '音乐挑战来了', 'Beyoncé’s big moment', 'Wow 🚀 — what now'])(
    '特殊字符标题生成稳定的规范路径：%s',
    (newsSummary) => {
      const canonical = getSongCanonicalSlug({ ...song, newsSummary });
      expect(canonical).toMatch(/^[\p{L}\p{N}-]+$/u);
      expect(getIdFromSlug(canonical)).toBe(song.id);
      expect(decodeURIComponent(encodeURIComponent(canonical))).toBe(canonical);
    }
  );
});
