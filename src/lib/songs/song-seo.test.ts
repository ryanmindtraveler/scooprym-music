import { describe, expect, it } from 'vitest';
import { getIdFromSlug } from '../utils';
import {
  decodeSongSlug,
  getSongCanonicalSlug,
  getSongSearchHeadline,
  getSongSeoDescription,
  getSongSeoTitle,
} from './song-seo';

const song = {
  id: '8155fdcb-1ef0-456e-9a9b-a7b4c7a52d68',
  title: 'Banderas & Robot Soul',
  newsSummary: "Antonio Banderas pivots from swashbuckling to sci-fi in 'Automata'. Robots find their feelings.",
  sourceText: null,
};

describe('歌曲详情 SEO', () => {
  it('中文地址编码前后识别为同一个规范 slug', () => {
    const slug = getSongCanonicalSlug({ ...song, newsSummary: '音乐挑战来了' });
    expect(decodeSongSlug(encodeURIComponent(slug))).toBe(slug);
    expect(decodeSongSlug(slug)).toBe(slug);
    const location = new URL(`/songs/${slug}`, 'https://scooprym.app').href;
    expect([...location].every((character) => character.charCodeAt(0) < 128)).toBe(true);
    expect(decodeSongSlug(new URL(location).pathname.slice(7))).toBe(slug);
  });

  it('长新闻标题不会截掉不同作品的身份', () => {
    const newsSummary =
      'A long news headline about an anniversary premiere and a conversation that keeps circulating online.';
    const first = getSongSeoTitle({ ...song, title: 'Wig Off, Gloves On', newsSummary });
    const second = getSongSeoTitle({ ...song, title: 'Disney Legend Legacy', newsSummary });
    expect(first).toContain('Wig Off, Gloves On');
    expect(second).toContain('Disney Legend Legacy');
    expect(first).not.toBe(second);
    expect(first.length).toBeLessThanOrEqual(101);
  });
  it('缺失摘要显示真实歌名但不迁移历史规范地址', () => {
    const item = { ...song, title: 'Billionaire Buffet', newsSummary: null };
    expect(getSongSearchHeadline(item)).toBe('Billionaire Buffet');
    expect(getSongSeoTitle(item)).toBe('Billionaire Buffet — Listen & Lyrics');
    expect(getSongCanonicalSlug(item)).toBe(item.id);
    expect(getSongSeoDescription(item)).not.toContain('inspired by this story');
  });

  it('以新闻八卦标题承接搜索意图', () => {
    expect(getSongSearchHeadline(song)).toBe("Antonio Banderas pivots from swashbuckling to sci-fi in 'Automata'.");
  });

  it('URL 只使用不可变歌曲标识', () => {
    expect(getSongCanonicalSlug(song)).toBe(song.id);
    expect(getSongCanonicalSlug({ id: song.id })).toBe(song.id);
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
    expect(canonical).toBe(item.id);
    expect(getIdFromSlug(canonical)).toBe(item.id);
    expect(decodeURIComponent(encodeURIComponent(canonical))).toBe(canonical);
  });

  it.each(['60+ times', 'A + B = chaos', '音乐挑战来了', 'Beyoncé’s big moment', 'Wow 🚀 — what now'])(
    '编辑摘要不会迁移规范路径：%s',
    (newsSummary) => {
      const canonical = getSongCanonicalSlug({ ...song, newsSummary });
      expect(canonical).toBe(song.id);
      expect(getIdFromSlug(canonical)).toBe(song.id);
    }
  );
});
