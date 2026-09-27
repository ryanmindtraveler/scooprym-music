import { describe, expect, it } from 'vitest';
import { getIdFromSlug } from '../utils';
import shortenedSongSlugs from './shortened-song-slugs.json';
import {
  allocateSongSeoSlug,
  buildSongSeoTopic,
  decodeSongSlug,
  getShortenedSongSlugId,
  getSongCanonicalSlug,
  getSongPublicDate,
  getSongSearchHeadline,
  getSongSeoDescription,
  getSongSeoSlugBase,
  getSongSeoTitle,
  getSongSeoTopic,
  getSongStoredSlug,
} from './song-seo';

const song = {
  id: '8155fdcb-1ef0-456e-9a9b-a7b4c7a52d68',
  title: 'Banderas & Robot Soul',
  newsSummary: "Antonio Banderas pivots from swashbuckling to sci-fi in 'Automata'. Robots find their feelings.",
  sourceText: null,
};

describe('歌曲详情 SEO', () => {
  it('仅迁移明确核对的长地址，旧地址仍能定位原歌曲', () => {
    expect(shortenedSongSlugs).toHaveLength(17);
    expect(new Set(shortenedSongSlugs.map(({ slug }) => slug)).size).toBe(shortenedSongSlugs.length);
    for (const { id, old, slug } of shortenedSongSlugs) {
      expect(old.length).toBeGreaterThanOrEqual(95);
      expect(slug.length).toBeLessThan(old.length);
      expect(getShortenedSongSlugId(old)).toBe(id);
      expect(getShortenedSongSlugId(slug)).toBeUndefined();
    }
  });

  it('创作时固定模型提供的短事件主题，标题与 slug 使用同一主题', () => {
    const draft = {
      ...song,
      id: 'new-song-id',
      title: 'The Dairy Interrogation',
      seoTopic: 'Server roasts late diners over vegetarian ice cream',
      newsSummary:
        "A server's viral TikTok roasts diners who arrived 20 minutes before closing and asked if the ice cream was vegetarian. The sarcastic reply went viral.",
    };
    const seoTopic = buildSongSeoTopic(draft);
    const created = { ...draft, seoTopic };
    expect(seoTopic).toBe(draft.seoTopic);
    expect(seoTopic).toContain('Server');
    expect(seoTopic).not.toContain('…');
    expect(getSongSeoTitle(created)).toBe(`${seoTopic} Song — The Dairy Interrogation`);
    expect(getSongSeoSlugBase(created)).toContain('server');
  });

  it('旧工作流缺少短主题时保留完整否认事实', () => {
    const draft = {
      ...song,
      seoTopic: undefined,
      newsSummary:
        'Dillon Danis says viral photos showing him snorting a white substance are fake. Fans debate the claim.',
    };
    const seoTopic = buildSongSeoTopic(draft);
    expect(seoTopic).toContain('are fake');
    expect(getSongSeoSlugBase({ ...draft, seoTopic })).toContain('are-fake');
  });

  it('创作时固定的事件主题不随摘要编辑变化', () => {
    const created = { ...song, seoTopic: 'Antonio Banderas robot movie' };
    expect(getSongSeoTitle({ ...created, newsSummary: 'Updated editorial summary.' })).toBe(
      'Antonio Banderas robot movie Song — Banderas & Robot Soul'
    );
    expect(getSongSeoSlugBase({ ...created, newsSummary: 'Updated editorial summary.' })).toBe(
      'antonio-banderas-robot-movie-scooprym'
    );
  });

  it('无事件摘要时不把自造歌名伪装为新闻主题', () => {
    const original = { ...song, newsSummary: null, sourceText: null };
    expect(buildSongSeoTopic(original)).toBe('');
    expect(getSongSeoTitle(original)).toBe('Funny Song — Banderas & Robot Soul');
  });

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
    expect(getSongCanonicalSlug(persisted)).toBe('antonio-banderas-automata-scooprym');
    expect(getSongCanonicalSlug({ ...persisted, newsSummary: 'Updated summary' })).toBe(
      'antonio-banderas-automata-scooprym'
    );
    expect(getSongCanonicalSlug({ id: song.id })).toBe(song.id);
  });

  it('事件先于自造歌名，slug 不包含省略号', () => {
    const item = {
      ...song,
      title: 'Naomi Said Yes (HeidiFest)',
      newsSummary: "Heidi Klum hosted her own pre-Oktoberfest bash, HeidiFest, at Munich's Hofbräuhaus.",
    };
    expect(getSongSeoTopic(item)).toBe('Heidi Klum hosted her own pre-Oktoberfest bash');
    expect(getSongSeoSlugBase(item)).toBe('heidi-klum-hosted-her-own-pre-oktoberfest-bash-scooprym');
    expect(getSongSeoTitle(item)).toBe(
      'Heidi Klum hosted her own pre-Oktoberfest bash Song — Naomi Said Yes (HeidiFest)'
    );
    expect(getSongSeoTitle(item)).not.toContain('…');
  });

  it('事件词最多十五个，历史后缀和录音序号都映射到新网址', () => {
    const item = {
      ...song,
      seoTopic: 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen',
    };
    const base = getSongSeoSlugBase(item);
    expect(base).toBe(
      'one-two-three-four-five-six-seven-eight-nine-ten-eleven-twelve-thirteen-fourteen-fifteen-scooprym'
    );
    expect(getSongCanonicalSlug({ id: song.id, seoSlug: 'heidi-klum-funny-song-2' })).toBe('heidi-klum-scooprym-2');
    expect(getSongStoredSlug('heidi-klum-scooprym-2')).toBe('heidi-klum-funny-song-2');
  });

  it('同一新闻从第二首起编号，跳过已占用的地址', () => {
    const base = 'heidi-klum-heidifest-scooprym';
    expect(allocateSongSeoSlug(base, [], new Set())).toBe(base);
    expect(allocateSongSeoSlug(base, [base], new Set([base]))).toBe(`${base}-2`);
    expect(allocateSongSeoSlug(base, [base, `${base}-2`], new Set([base, `${base}-2`, `${base}-3`]))).toBe(`${base}-4`);
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
    expect(getSongSeoDescription(acoustic).length).toBeLessThanOrEqual(170);
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
    expect(getSongSeoDescription(item, first).length).toBeLessThanOrEqual(170);
  });

  it('标题和摘要同时保留新闻主题与歌曲身份', () => {
    expect(getSongSeoTitle(song)).toContain('Antonio Banderas');
    expect(getSongSeoTitle(song)).toContain('Banderas & Robot Soul');
    expect(getSongSeoDescription(song)).toContain('Banderas & Robot Soul');
    expect(getSongSeoDescription(song).length).toBeLessThanOrEqual(170);
  });

  it('长事件描述只取完整句子，不在事实或否认语句中间截断', () => {
    const item = {
      ...song,
      title: 'The Viral Denial',
      newsSummary:
        'Dillon Danis says viral photos showing him snorting a white substance are fake. The online argument continued after his denial.',
    };
    const description = getSongSeoDescription(item);
    expect(description).toContain('The Viral Denial');
    expect(description).not.toContain('…');
    expect(description).not.toMatch(/are(?=\.|$)/);
    if (description.includes('Dillon Danis')) expect(description).toContain('are fake.');
    expect(description).toMatch(/\.$/);
  });

  it('HeidiFest 等较短事件能完整出现在描述里', () => {
    const description = getSongSeoDescription({
      ...song,
      title: 'Naomi Said Yes (HeidiFest)',
      newsSummary: "Heidi Klum hosted her own pre-Oktoberfest bash, HeidiFest, at Munich's Hofbräuhaus.",
    });
    expect(description).toContain("at Munich's Hofbräuhaus.");
    expect(description).not.toContain('…');
  });

  it('缺少新闻摘要时仍生成自然收尾的独立描述', () => {
    const description = getSongSeoDescription({ ...song, newsSummary: null, lyrics: null, prompt: null });
    expect(description).toContain('Banderas & Robot Soul');
    expect(description).toContain('read the lyrics.');
    expect(description).not.toContain('…');
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
