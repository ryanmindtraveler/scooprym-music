import { describe, expect, it } from 'vitest';
import { EDITORIAL_STYLE_PROFILES } from './editorial-styles';
import { LEGACY_VIBE_PERSONAS } from './legacy-vibes';
import {
  buildDynamicProductionRecipe,
  getProductionVariantsForStyle,
  validateProductionRecipe,
} from './production-recipe';

const legacyIds = new Set<string>(LEGACY_VIBE_PERSONAS.map((preset) => preset.id));
const profiles = EDITORIAL_STYLE_PROFILES.filter((profile) => !legacyIds.has(profile.id));

describe('新版配方节奏增强', () => {
  it('11 种新版的两个变体都有效，不再使用弱化节奏的配方', () => {
    expect(profiles).toHaveLength(11);
    for (const profile of profiles) {
      const variants = getProductionVariantsForStyle(profile.id);
      expect(variants).toHaveLength(2);
      for (const variant of variants) {
        const recipe = buildDynamicProductionRecipe({ direction: profile.tags.join(', '), variantId: variant.id });
        expect(recipe?.editorialStyleId).toBe(profile.id);
        expect(recipe?.variantId).toBe(variant.id);
        expect(validateProductionRecipe(recipe!)).toEqual([]);
        expect(`${recipe!.foundation} ${recipe!.groove}`).not.toMatch(
          /\b(sparse|minimal|subdued|restrained|soft|hushed)\b/i
        );
        expect(recipe!.groove).toMatch(/kick|drum|bass|snare/i);
      }
    }
  });
  it('情绪与悬疑仍保留慢速律动，不强行变成快歌', () => {
    for (const id of ['apology_after_midnight', 'internet_folklore']) {
      for (const variant of getProductionVariantsForStyle(id)) {
        expect(variant.groove).toMatch(/slow|low-tempo/i);
        expect(variant.groove).not.toMatch(/fast|high.bpm/i);
      }
    }
  });
  it('新版变体保留各自的节奏区别', () => {
    const grooves = profiles.flatMap((profile) =>
      getProductionVariantsForStyle(profile.id).map((variant) => variant.groove)
    );
    expect(new Set(grooves).size).toBe(22);
  });
});
