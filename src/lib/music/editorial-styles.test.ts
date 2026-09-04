import { DEFAULT_CUSTOM_VIBE_TAGS, MUSIC_STYLE_CATEGORIES } from '@/components/create/form/create-music-data';
import { describe, expect, it } from 'vitest';
import { EDITORIAL_STYLE_PROFILES, buildEditorialStyleBrief, resolveEditorialStyleProfile } from './editorial-styles';

describe('ScoopRYM 编辑风格', () => {
  it('能从底层标签识别对应的编辑风格', () => {
    const profile = EDITORIAL_STYLE_PROFILES.find((item) => item.id === 'velvet_rope_whisper');
    expect(profile).toBeDefined();

    const resolved = resolveEditorialStyleProfile(profile?.tags.join(', ') ?? '');
    expect(resolved?.label).toBe('Velvet-Rope Whisper');
  });

  it('编辑简报同时包含叙事、歌词和制作意图', () => {
    const profile = EDITORIAL_STYLE_PROFILES[0];
    const brief = buildEditorialStyleBrief(profile.tags.join(', '));

    expect(brief).toContain('Story lens:');
    expect(brief).toContain('Lyric craft:');
    expect(brief).toContain('Production signature:');
    expect(brief).toContain('Vocal direction:');
    expect(brief).toContain('Arrangement arc:');
    expect(brief).toContain('Avoid:');
  });

  it('自由组合标签不会被错误套用编辑模板', () => {
    expect(buildEditorialStyleBrief('Modern Pop, Female Vocals, 100 BPM')).toBe('');
  });

  it('每套预设都是覆盖五层架构的紧凑标签组合', () => {
    const presets = [...EDITORIAL_STYLE_PROFILES.map((profile) => profile.tags), DEFAULT_CUSTOM_VIBE_TAGS];
    const allLockedTags = new Set(MUSIC_STYLE_CATEGORIES.flatMap((category) => category.tags.map((tag) => tag.label)));

    for (const tags of presets) {
      expect(tags.length).toBeGreaterThanOrEqual(7);
      expect(tags.length).toBeLessThanOrEqual(8);
      expect(tags.every((tag) => allLockedTags.has(tag))).toBe(true);

      for (const category of MUSIC_STYLE_CATEGORIES) {
        const categoryTags = new Set(category.tags.map((tag) => tag.label));
        expect(tags.some((tag) => categoryTags.has(tag))).toBe(true);
      }
    }
  });

  it('不使用全局已保证的 Hook 标签占用风格差异位', () => {
    for (const profile of EDITORIAL_STYLE_PROFILES) {
      expect(profile.tags).not.toContain('Catchy Hook');
    }
  });
});
