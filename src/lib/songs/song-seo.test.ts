import { describe, expect, it } from 'vitest';
import { getIdFromSlug } from '../utils';
import {
  decodeSongSlug,
  getSongCanonicalSlug,
  getSongPublicDate,
  getSongSearchHeadline,
  getSongSeoDescription,
  getSongSeoSlugBase,
  getSongSeoTitle,
  getSongSeoTopic,
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
    expect(first).not.toContain('…');
  });
  it('缺失摘要显示真实歌名但不迁移历史规范地址', () => {
    const item = { ...song, title: 'Billionaire Buffet', newsSummary: null };
    expect(getSongSearchHeadline(item)).toBe('Billionaire Buffet');
    expect(getSongSeoTitle(item)).toBe('Funny Song — Billionaire Buffet');
    expect(getSongCanonicalSlug(item)).toBe(item.id);
    expect(getSongSeoDescription(item)).not.toContain('inspired by this story');
  });

  it('以新闻八卦标题承接搜索意图', () => {
    expect(getSongSearchHeadline(song)).toBe("Antonio Banderas pivots from swashbuckling to sci-fi in 'Automata'.");
  });

  it('已分配的纯文字 slug 不随摘要改变，旧数据仍能使用 UUID', () => {
    const persisted = { ...song, seoSlug: 'antonio-banderas-automata-funny-song' };
    expect(getSongCanonicalSlug(persisted)).toBe('antonio-banderas-automata-funny-song');
    expect(getSongCanonicalSlug({ ...persisted, newsSummary: 'Updated summary' })).toBe(persisted.seoSlug);
    expect(getSongCanonicalSlug({ id: song.id })).toBe(song.id);
  });

  it('事件先于自造歌名，slug 不包含省略号', () => {
    const item = {
      ...song,
      title: 'Naomi Said Yes (HeidiFest)',
      newsSummary: "Heidi Klum hosted her own pre-Oktoberfest bash, HeidiFest, at Munich's Hofbräuhaus.",
    };
    expect(getSongSeoTopic(item)).toBe('Heidi Klum hosted her own pre-Oktoberfest bash');
    expect(getSongSeoSlugBase(item)).toBe('heidi-klum-hosted-her-own-pre-oktoberfest-bash-funny-song');
    expect(getSongSeoTitle(item)).toBe(
      'Heidi Klum hosted her own pre-Oktoberfest bash Song — Naomi Said Yes (HeidiFest)'
    );
    expect(getSongSeoTitle(item)).not.toContain('…');
  });

  it('迁移和任务恢复的 updatedAt 不会伪装成公开内容更新', () => {
    expect(
      getSongPublicDate({
        createdAt: '2025-12-24T01:00:00.000Z',
        publishedAt: '2026-01-02T02:00:00.000Z',
      }).toISOString()
    ).toBe('2026-01-02T02:00:00.000Z');
    expect(getSongPublicDate({ createdAt: '2025-12-24T01:00:00.000Z', publishedAt: null }).toISOString()).toBe(
      '2025-12-24T01:00:00.000Z'
    );
  });

  it('同一新闻下的不同录音使用曲风和歌词开场区分搜索摘要', () => {
    const acoustic = {
      ...song,
      prompt: 'acoustic trap, pizzicato strings',
      lyrics: '[Intro]\nYo, Drake bought the Bentley back',
    };
    const boomBap = {
      ...song,
      prompt: 'old school hip hop, boom bap',
      lyrics: '[Intro]\nBlue Bentley back on the block',
    };

    expect(getSongSeoTitle(acoustic)).toBe(getSongSeoTitle(boomBap));
    expect(getSongSeoDescription(acoustic)).toContain('acoustic trap');
    expect(getSongSeoDescription(acoustic)).toContain('Yo, Drake bought the Bentley back');
    expect(getSongSeoDescription(acoustic)).not.toBe(getSongSeoDescription(boomBap));
    expect(getSongSeoDescription(acoustic).length).toBeLessThanOrEqual(159);
  });

  it('同名录音的页面标题遵循固定公式，描述保留版本号', () => {
    const item = {
      ...song,
      title: 'Prison Blues',
      prompt: 'hip-hop',
      lyrics: '[Intro]\nYo, yo, check it, we in the cell block',
    };
    const first = { number: 1, total: 2 };
    const second = { number: 2, total: 2 };

    expect(getSongSeoTitle(item)).toBe(
      "Antonio Banderas pivots from swashbuckling to sci-fi in 'Automata' Song — Prison Blues"
    );
    expect(getSongSeoDescription(item, first)).toContain('recording 1 of 2');
    expect(getSongSeoDescription(item, first)).not.toBe(getSongSeoDescription(item, second));
    expect(getSongSeoDescription(item, first).length).toBeLessThanOrEqual(159);
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
