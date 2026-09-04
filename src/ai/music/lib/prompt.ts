import { buildEditorialProductionBrief } from '@/lib/music/editorial-styles';
import {
  type DynamicProductionRecipe,
  buildDynamicProductionRecipe,
  formatDynamicProductionRecipe,
} from '@/lib/music/production-recipe';

const MAX_MINIMAX_PROMPT_LENGTH = 2000;
export const SHORT_FORM_DURATION_DIRECTIVE =
  'compact 45-65 second viral meme-song arrangement, perform every supplied lyric line without cutting or adding lyrics, repeat sections only where the lyric explicitly repeats them, immediate vocal entry, no extended instrumental intro, solo, breakdown, repeated outro, or fade-out, concise transitions, abrupt replay-friendly ending';

function compact(value: string) {
  return value
    .replace(/[\r\n]+/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/(?:,\s*){2,}/g, ', ')
    .trim()
    .replace(/^,+|,+$/g, '');
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const key = part.toLowerCase();
    if (!part || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function finalizeMusicProductionPrompt(prompt: string) {
  const compactPrompt = compact(prompt);
  const compactDirective = compact(SHORT_FORM_DURATION_DIRECTIVE);
  const availablePromptLength = MAX_MINIMAX_PROMPT_LENGTH - compactDirective.length - 2;
  const guardedPrompt = [compactPrompt.slice(0, availablePromptLength).trim().replace(/,+$/g, ''), compactDirective]
    .filter(Boolean)
    .join(', ');
  return guardedPrompt
    .slice(0, MAX_MINIMAX_PROMPT_LENGTH)
    .trim()
    .replace(/^,+|,+$/g, '');
}

/**
 * 文本模型超时或不可用时仍生成可直接用于 MiniMax 官方音乐模型的可靠制作提示词。
 */
export function buildFallbackMusicProductionPrompt({
  direction,
  production,
  lyrics,
  storyContext = '',
  dynamicRecipe,
}: {
  direction: string;
  production: string;
  lyrics: string;
  storyContext?: string;
  dynamicRecipe?: DynamicProductionRecipe | null;
}) {
  const recipe =
    dynamicRecipe === undefined ? buildDynamicProductionRecipe({ direction, storyContext, lyrics }) : dynamicRecipe;
  const compactDirection = compact(direction);
  const compactProduction = compact(production);
  const requested =
    compactProduction && compactProduction.toLowerCase() !== compactDirection.toLowerCase()
      ? compactProduction
      : recipe && recipe.editorialStyleId !== 'custom_vibe'
        ? ''
        : compactProduction || compactDirection || 'contemporary viral pop';
  const editorialStyleBrief = recipe ? formatDynamicProductionRecipe(recipe) : buildEditorialProductionBrief(direction);
  const hasBridge = /^\[Bridge\]$/im.test(lyrics);
  const hasRepeatedChorus = (lyrics.match(/^\[Chorus\]$/gim) || []).length >= 2;
  const arrangement = [
    'immediate vocal entry',
    'clear expressive lead vocal with intelligible diction',
    'tight verse groove',
    hasRepeatedChorus ? 'repeatable hook-forward chorus with a stronger final return' : 'hook-forward chorus payoff',
    hasBridge ? 'brief stripped bridge before the final lift' : '',
    'clean low end',
    'punchy transients',
    'polished streaming-ready master',
  ];

  return finalizeMusicProductionPrompt(uniqueParts([editorialStyleBrief, requested, ...arrangement]).join(', '));
}
