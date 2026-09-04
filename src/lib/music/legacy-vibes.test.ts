import { describe, expect, it } from 'vitest';
import zhMessages from '../../../messages/zh.json';
import { VIBE_PERSONAS } from '@/components/create/form/create-music-data';
import { LEGACY_VIBE_PERSONAS } from './legacy-vibes';
import { EDITORIAL_STYLE_PROFILES, resolveEditorialStyleProfile } from './editorial-styles';
import { buildDynamicProductionRecipe, formatDynamicProductionRecipe } from './production-recipe';

describe('恢复主分支风格并合并', () => {
  it('旧风格的名称、说明和原版配方都有中文翻译', () => {
    const messages = zhMessages.Dashboard.admin.createStudio;
    for (const preset of LEGACY_VIBE_PERSONAS) {
      const direction = messages.directions[preset.id];
      expect(direction.label).toMatch(/[\u4e00-\u9fff]/);
      expect(direction.description).toMatch(/[\u4e00-\u9fff]/);
      expect(messages.productionVariants[`${preset.id}_original`]).toContain('原版');
    }
  });
  it('保留 22 种预设和唯一自定义入口', () => {
    expect(LEGACY_VIBE_PERSONAS).toHaveLength(11);
    expect(VIBE_PERSONAS).toHaveLength(23);
    expect(EDITORIAL_STYLE_PROFILES).toHaveLength(22);
    expect(new Set(VIBE_PERSONAS.map((preset) => preset.id)).size).toBe(23);
    expect(VIBE_PERSONAS[0].id).toBe('viral_pop');
  });
  it('每种风格在写作和制作管线中能精确识别', () => {
    for (const preset of EDITORIAL_STYLE_PROFILES) {
      expect(resolveEditorialStyleProfile(preset.tags.join(', '))?.id).toBe(preset.id);
    }
  });
  it('原版配方保留全部标签，不替换成克制变体', () => {
    for (const preset of LEGACY_VIBE_PERSONAS) {
      const recipe = buildDynamicProductionRecipe({
        direction: preset.tags.join(', '),
        storyContext: 'quiet private interview',
      });
      expect(recipe?.variantId).toBe(`${preset.id}_original`);
      const prompt = formatDynamicProductionRecipe(recipe!);
      for (const tag of preset.tags) expect(prompt).toContain(tag);
    }
  });
});
