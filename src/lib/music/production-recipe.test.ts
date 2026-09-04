import { describe, expect, it } from 'vitest';
import { getEditorialStyleProfileById } from './editorial-styles';
import {
  buildDynamicProductionRecipe,
  detectStorySignals,
  formatDynamicProductionRecipe,
  getProductionVariantsForStyle,
  recommendEditorialStyleId,
  validateProductionRecipe,
} from './production-recipe';

describe('动态音乐制作配方', () => {
  it('根据新闻内容自动推荐编辑风格', () => {
    expect(
      recommendEditorialStyleId(
        'At a celebrity premiere, a host calls out her neighbor during an intimate red-carpet interview.'
      )
    ).toBe('velvet_rope_whisper');
    expect(recommendEditorialStyleId('A bizarre AI trend turns the whole internet timeline into chaos.')).toBe(
      'algorithm_circus'
    );
    expect(recommendEditorialStyleId('A public apology follows a sad breakup and private family message.')).toBe(
      'apology_after_midnight'
    );
  });

  it('每套编辑人格至少提供两个可替换制作变体', () => {
    const styleIds = [
      'custom_vibe',
      'newsroom_noir',
      'public_receipts',
      'algorithm_circus',
      'velvet_rope_whisper',
      'receipts_on_wax',
      'apology_after_midnight',
      'main_character_emergency',
      'timeline_fever',
      'internet_folklore',
      'group_chat_static',
      'public_meltdown',
    ];

    for (const styleId of styleIds) {
      expect(getProductionVariantsForStyle(styleId).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('同一新闻输入始终得到同一配方', () => {
    const direction = getEditorialStyleProfileById('velvet_rope_whisper').tags.join(', ');
    const input = {
      direction,
      storyContext: 'A celebrity responds to a private relationship rumor after a tense red-carpet interview.',
      lyrics: '[Verse 1]\nFlashbulbs hold their breath',
    };

    expect(buildDynamicProductionRecipe(input)).toEqual(buildDynamicProductionRecipe(input));
  });

  it('利用新闻信号在同一编辑人格内选择更合适的变体', () => {
    const direction = getEditorialStyleProfileById('velvet_rope_whisper').tags.join(', ');
    const intimate = buildDynamicProductionRecipe({
      direction,
      storyContext: 'A private relationship confession becomes a tense celebrity interview.',
    });
    const celebratory = buildDynamicProductionRecipe({
      direction,
      storyContext: 'A celebrity wins an award at a glamorous premiere party and breaks a record.',
    });

    expect(intimate?.variantId).toBe('flashbulb_rnb');
    expect(celebratory?.variantId).toBe('afterparty_garage');
  });

  it('允许管理员指定兼容变体，同时不接受跨人格变体', () => {
    const direction = getEditorialStyleProfileById('velvet_rope_whisper').tags.join(', ');
    const locked = buildDynamicProductionRecipe({
      direction,
      storyContext: 'A private relationship confession becomes a tense celebrity interview.',
      variantId: 'afterparty_garage',
    });
    const incompatible = buildDynamicProductionRecipe({
      direction,
      storyContext: 'A private relationship confession becomes a tense celebrity interview.',
      variantId: 'controlled_rage',
    });

    expect(locked?.variantId).toBe('afterparty_garage');
    expect(incompatible?.variantId).not.toBe('controlled_rage');
  });

  it('输出有明确主类型、节奏、人声、两项音色、结构和禁用项', () => {
    const direction = getEditorialStyleProfileById('public_receipts').tags.join(', ');
    const recipe = buildDynamicProductionRecipe({
      direction,
      storyContext: 'A public claim clashes with leaked screenshots and sparks backlash online.',
    });

    expect(recipe).not.toBeNull();
    expect(recipe && validateProductionRecipe(recipe)).toEqual([]);
    expect(recipe?.colors).toHaveLength(2);

    const prompt = formatDynamicProductionRecipe(recipe!);
    expect(prompt).toContain('Foundation:');
    expect(prompt).toContain('Groove:');
    expect(prompt).toContain('Vocal:');
    expect(prompt).toContain('Sonic colors:');
    expect(prompt).toContain('Arc:');
    expect(prompt).toContain('Avoid:');
  });

  it('能识别中英文新闻语义信号，并为普通自定义标签生成独立配方', () => {
    expect(detectStorySignals('神秘传闻在互联网平台迅速走红')).toEqual(
      expect.arrayContaining(['absurd', 'mysterious', 'tech'])
    );
    const customRecipe = buildDynamicProductionRecipe({
      direction: 'Modern Pop, warm piano, intimate vocal',
      storyContext: 'A private message goes viral.',
    });

    expect(customRecipe?.editorialStyleId).toBe('custom_vibe');
    expect(customRecipe?.variantId).toBe('custom_tag_focus');
    expect(validateProductionRecipe(customRecipe!)).toEqual([]);
  });
});
