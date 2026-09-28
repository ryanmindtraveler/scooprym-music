import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { materializeLyrics, parseLyricPerformance, renderLyricSections } from './lyrics-performance';

describe('逐行歌词传输', () => {
  it('组装后的校验错误使用现有可恢复错误类别', () => {
    expect(() =>
      parseLyricPerformance(z.object({ lyrics: z.string().max(10) }), {
        sections: [{ section: 'Verse 1', lines: ['A complete phrase exceeds this small test limit'] }],
      })
    ).toThrow('Invalid lyric finalization: lyrics:');
  });
  it('保持行边界、专名和真实演唱呼应，兼容既有字符串契约', () => {
    expect(
      materializeLyrics({
        songTitle: 'Party First',
        sections: [
          { section: 'Hook' as const, lines: ['HeidiFest starts before the fair', 'Who came first? (We were there!)'] },
        ],
      })
    ).toEqual({
      songTitle: 'Party First',
      lyrics: '[Hook]\nHeidiFest starts before the fair\nWho came first? (We were there!)',
    });
  });

  it.each(['First line\nSecond line', 'Sing [Beat drop] now', 'No ink, no case! }'])(
    '拒绝混入断行或结构标记：%s',
    (line) => {
      expect(() => renderLyricSections([{ section: 'Verse 1', lines: [line] }])).toThrow('Invalid lyric finalization');
    }
  );
});
