import type { MemePropagationAction, MemeStrategyCandidate } from '@/types/lyric-workshop';

export function resolveMemeStrategy(candidates: MemeStrategyCandidate[], selectedId?: string) {
  const selected = candidates.find((candidate) => candidate.id === selectedId);
  const fallback = [...candidates].sort((left, right) => right.score - left.score)[0];
  const strategy = selected || fallback;
  if (!strategy) throw new Error('The lyric workshop did not produce a valid meme strategy');
  return strategy;
}

/** 提示词与本地检查共享边界，语义判断交给现有定稿模型。 */
export const MEME_EXECUTION_POLICIES: Record<
  MemePropagationAction,
  {
    exactOccurrences?: { min: number; max?: number };
    opening?: boolean;
    ending?: boolean;
    instruction: string;
  }
> = {
  exact_repeat: {
    exactOccurrences: { min: 2 },
    opening: true,
    instruction:
      'Repeat the anchor at least twice, first within the opening four sung lines. Change the surrounding setup, not the anchor. No repeated section label is required.',
  },
  mutating_repeat: {
    instruction:
      'Return to a recognizable core expression while changing its response or consequence. Judge semantic continuity and escalation; do not demand verbatim copies or repeated chorus labels.',
  },
  call_response: {
    instruction:
      'Build at least two intelligible call-and-response exchanges, with the later exchange advancing the joke. Replies may vary; judge dialogue, not exact phrase counts or chorus labels.',
  },
  escalating_list: {
    instruction:
      'Build a recognizably escalating sequence around the anchor. Each return adds a more surprising source-grounded detail; judge progression, not verbatim repetition.',
  },
  delayed_reveal: {
    exactOccurrences: { min: 1, max: 1 },
    ending: true,
    instruction:
      'Do not reveal the anchor early. Set up the misunderstanding and land the phrase once within the final four sung lines. Check semantic spoilers as well as literal repetition.',
  },
  callback: {
    instruction:
      'Establish the image or phrase near the opening and return near the ending with changed meaning. Semantic echoes are valid; do not require two choruses or verbatim phrases.',
  },
  one_shot: {
    exactOccurrences: { min: 1, max: 1 },
    ending: true,
    instruction:
      'Protect the anchor as a single-use final punchline within the final four sung lines. Never preview or repeat it earlier; verify that the setup earns the payoff.',
  },
  none: {
    instruction:
      'Do not force a repeated catchphrase. Carry the thematic anchor through image, cadence or structure; judge coherence and payoff without exact phrase counting.',
  },
};

export function buildMemeExecutionRules(action: MemePropagationAction, memoryAnchor: string) {
  return `Memory anchor: “${memoryAnchor}”. ${MEME_EXECUTION_POLICIES[action].instruction}`;
}

/** 忽略标点和大小写，按词边界统计，避免短词误命中长词。 */
export function countAnchorOccurrences(text: string, anchor: string) {
  const words = (value: string) => value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const haystack = words(text);
  const needle = words(anchor);
  if (!needle.length) return 0;
  let count = 0;
  for (let index = 0; index <= haystack.length - needle.length; index++) {
    if (needle.every((word, offset) => word === haystack[index + offset])) {
      count++;
      index += needle.length - 1;
    }
  }
  return count;
}
