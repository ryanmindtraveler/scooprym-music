import { describe, expect, it } from 'vitest';
import { preferEditedLyrics, prepareDeliverableLyrics } from './lyrics-completion';

describe('歌词自动收束', () => {
  it('超长草稿只删完整行，保留结尾，不截断词和名字', () => {
    const lines = Array.from(
      { length: 30 },
      (_, i) => `HeidiFest ${i} keeps the whole sentence intact beside the empty chair`
    );
    const result = prepareDeliverableLyrics(
      `[Verse 1]\n${lines.join('\n')}\n[Outro]\nThe chair gets the last word\nWe all go home together\nLeave the light on`
    )!;
    expect(result.length).toBeLessThanOrEqual(1200);
    expect(result).toContain('The chair gets the last word');
    expect(
      result
        .split('\n')
        .every(
          (line) =>
            line.startsWith('[') ||
            lines.includes(line) ||
            ['The chair gets the last word', 'We all go home together', 'Leave the light on'].includes(line)
        )
    ).toBe(true);
  });
  it('不会把空输出或元数据当成成功歌词', () => {
    expect(prepareDeliverableLyrics('')).toBeNull();
    expect(prepareDeliverableLyrics('{"factAudit": "pass"}')).toBeNull();
  });
  it('修改增加客观问题时自动择稿，不设置拒绝出口', () => {
    expect(preferEditedLyrics([], ['too long'])).toBe(false);
    expect(preferEditedLyrics(['too long'], [])).toBe(true);
  });
});
