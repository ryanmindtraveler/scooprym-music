import { describe, expect, it } from 'vitest';
import { LEGACY_VIBE_PERSONAS } from './legacy-vibes';
import { LEGACY_PRODUCTION } from './legacy-production';
import { buildEditorialStyleBrief, getEditorialStyleProfileById } from './editorial-styles';
import { buildDynamicProductionRecipe, formatDynamicProductionRecipe } from './production-recipe';

describe('风格审查修正', () => {
  it('旧版逐一使用明确的音乐角色，不再按数组位置猜测音色', () => {
    for (const preset of LEGACY_VIBE_PERSONAS) {
      const definition = LEGACY_PRODUCTION[preset.id];
      const recipe = buildDynamicProductionRecipe({ direction: preset.tags.join(', ') })!;
      expect(recipe.foundation).toBe(definition.foundation);
      expect(recipe.colors).toEqual(definition.colors);
      expect(recipe.vocal).toContain(definition.guard);
    }
    expect(LEGACY_PRODUCTION.satire.foundation).toBe('circus trap');
    expect(LEGACY_PRODUCTION.club.colors).not.toContain('Sturdy Dance');
  });
  it('结构示例不能要求模型添加未写出的反复与桥段', () => {
    const direction = getEditorialStyleProfileById('main_character_emergency').tags.join(', ');
    expect(buildEditorialStyleBrief(direction)).toContain('optional energy sketches');
    expect(formatDynamicProductionRecipe(buildDynamicProductionRecipe({ direction })!)).toContain(
      'Never add unwritten lyric loops'
    );
    expect(getEditorialStyleProfileById('main_character_emergency').arrangementArc).not.toContain('eight-bar reset');
  });
  it('八卦新版不带放松标签，旧版无额外唱词要求', () => {
    expect(getEditorialStyleProfileById('velvet_rope_whisper').tags).not.toContain('Chillwide');
    expect(LEGACY_PRODUCTION.gossip.guard).toContain('unless it is in the supplied lyrics');
  });
});
