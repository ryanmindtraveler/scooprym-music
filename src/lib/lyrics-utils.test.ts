import { describe, expect, it } from 'vitest';
import { buildDisplaySongTitle, cleanLyricsForDisplay, normalizeStructuredLyrics } from './lyrics-utils';

describe('歌曲标题展示', () => {
  it('保留符合规范的短歌名', () => {
    expect(buildDisplaySongTitle('Midnight Receipts', 'Receipts on the floor')).toBe('Midnight Receipts');
  });

  it('新闻式长标题会回退到去除伴唱标记后的短 Hook', () => {
    expect(
      buildDisplaySongTitle(
        'Miley Cyrus playfully roasts creepy superfan-neighbor Alex Cooper at Hannah Montana anniversary premiere',
        'You know damn well (damn well) She moved next door (next door)'
      )
    ).toBe('You Know Damn Well');
  });

  it('没有可用信息时返回稳定占位名', () => {
    expect(buildDisplaySongTitle('', '')).toBe('New Creation');
  });

  it('把模型返回的 HTML 换行恢复为真正的歌词换行', () => {
    expect(cleanLyricsForDisplay('[Hook]<br>Line one&lt;br&gt;Line two')).toBe('[Hook]\nLine one\nLine two');
  });

  it('拆开带普通短横线制作说明且与正文粘连的段落标签', () => {
    expect(
      normalizeStructuredLyrics(
        '[Intro - Neighbor voice, breathy]Oh my god, you live here?\n[Verse 1 - Miley, gossip tone]Superfan on my mic\n[Hook - Neighbor gasps, Miley answers]No other host'
      )
    ).toBe('[Intro]\nOh my god, you live here?\n\n[Verse 1]\nSuperfan on my mic\n\n[Hook]\nNo other host');
  });

  it('无损恢复被结构化输出压成段落字符串的歌词，并识别 Final Hook', () => {
    const source = `[Intro]
You know damn— (snap) ...shh, not yet.
[Verse 1]
Carpet glowing gold, twenty years of Hannah toldMiley on the mic, calling her superfan 'kinda creepy'Her words, her tone, her little roast, so sweetly
[Bridge]
But here's the detail the gasp can't hideFive years back, same driveway, mic insideShe sat her down and interviewed herAt that house — she knew the doorbell[Final Hook]So Miley leaned in, let the crowd erupt:'You know damn well where I live!'`;
    const result = normalizeStructuredLyrics(source);
    const sungLines = result.split('\n').filter((line) => line && !/^\[[^\]]+\]$/.test(line));

    expect(result).toContain('hide\nFive years back');
    expect(result).toContain('interviewed her\nAt that house');
    expect(result).toContain('[Hook]\nSo Miley leaned in, let the crowd erupt:');
    expect(result).not.toContain('toldMiley');
    expect(sungLines.length).toBeGreaterThanOrEqual(8);
  });

  it('旧任务没有工作坊数据时从歌词首个可唱 Hook 提炼歌名', () => {
    expect(
      buildDisplaySongTitle(
        '',
        '',
        '[Intro]\n(pizzicato stabs,\nvocal chops) You know damn well (damn well) She moved next door (next door)\n\n[Verse 1]\nSunset Gower, March lights'
      )
    ).toBe('You Know Damn Well');
  });
});
