import { getEditorialStyleProfileById } from '@/lib/music/editorial-styles';
import { describe, expect, it } from 'vitest';
import { buildFallbackMusicProductionPrompt, finalizeMusicProductionPrompt } from './prompt';

describe('音乐制作提示词', () => {
  it('在 AI 增强不可用时保留风格并补齐短篇编曲信息', () => {
    const prompt = buildFallbackMusicProductionPrompt({
      direction: 'Jersey Club, Female Vocals, Funny',
      production: '',
      lyrics: '[Verse 1]\nA line\n[Chorus]\nThe hook\n[Bridge]\nA turn\n[Chorus]\nThe hook',
    });

    expect(prompt).toContain('Jersey Club');
    expect(prompt).toContain('compact 45-65 second viral meme-song arrangement');
    expect(prompt).toContain('perform every supplied lyric line');
    expect(prompt).toContain('without cutting or adding lyrics');
    expect(prompt).toContain('no extended instrumental intro');
    expect(prompt).toContain('Hook-First Mix');
    expect(prompt).toContain('final hook');
  });

  it('压缩换行并遵守 MiniMax 官方音乐模型的 2000 字符限制', () => {
    const prompt = finalizeMusicProductionPrompt(`Pop\n\n${'bright texture '.repeat(100)}`);
    expect(prompt.length).toBeLessThanOrEqual(2000);
    expect(prompt).not.toContain('\n');
    expect(prompt).toContain('compact 45-65 second viral meme-song arrangement');
  });

  it('预设标签在兜底路径中仍保留 ScoopRYM 编辑意图', () => {
    const profile = getEditorialStyleProfileById('velvet_rope_whisper');
    const prompt = buildFallbackMusicProductionPrompt({
      direction: profile.tags.join(', '),
      production: '',
      storyContext: 'A celebrity relationship confession turns tense during a private interview.',
      lyrics: '[Verse 1]\nFlashbulbs freeze the room\n[Chorus]\nVelvet rope whisper',
    });

    expect(prompt).toContain('Velvet-Rope Whisper');
    expect(prompt).toContain('Production variant: Flashbulb R&B');
    expect(prompt).toContain('Foundation: sparse contemporary R&B');
    expect(prompt).toContain('Sonic colors: pizzicato string punctuation + breathy vocal doubles');
    expect(prompt).toContain('Avoid: melismatic over-singing');
  });
});
