import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MEME_CREATIVE_STANDARD } from './meme-creative-standard';

describe('Meme 创作标准', () => {
  it('每首突出一部分特点，而不是全部堆砌', () => {
    expect(MEME_CREATIVE_STANDARD).toContain('never require all of them in one song');
    expect(MEME_CREATIVE_STANDARD).toContain('not a numerical validation gate');
    expect(MEME_CREATIVE_STANDARD).toContain('When rhyme-driven rap is a selected trait');
    expect(MEME_CREATIVE_STANDARD).toContain('no-explicit-repetition');
  });
  it('策划、写作和音乐提示词复用同一标准，审校按所选特点检查', () => {
    const source = readFileSync('src/ai/text/lib/generation.ts', 'utf8');
    // 局部歌词重写也必须使用同一创作标准。
    expect(source.split('${MEME_CREATIVE_STANDARD}')).toHaveLength(6);
    expect(source).toContain('Review whether the chosen subset');
    expect(source).not.toContain('Use rhyme as texture rather than');
    expect(source).not.toContain('and restrained backing vocals');
  });
});
