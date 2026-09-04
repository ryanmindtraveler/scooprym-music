import type { MemePropagationAction, MemeStrategyCandidate } from '@/types/lyric-workshop';

export function resolveMemeStrategy(candidates: MemeStrategyCandidate[], selectedId?: string) {
  const selected = candidates.find((candidate) => candidate.id === selectedId);
  const fallback = [...candidates].sort((left, right) => right.score - left.score)[0];
  const strategy = selected || fallback;
  if (!strategy) throw new Error('The lyric workshop did not produce a valid meme strategy');
  return strategy;
}

export function buildMemeExecutionRules(action: MemePropagationAction, memoryAnchor: string) {
  switch (action) {
    case 'exact_repeat':
      return `Use “${memoryAnchor}” as an exact compact refrain at least twice; change the surrounding setup, not the anchor.`;
    case 'mutating_repeat':
      return `Return to “${memoryAnchor}” at least twice, preserving its core words while the response or consequence mutates.`;
    case 'call_response':
      return `Use “${memoryAnchor}” as the stable call or response in at least two exchanges; make the second exchange escalate.`;
    case 'escalating_list':
      return `Build a recognizably escalating sequence around “${memoryAnchor}”; each return must add a stranger but factual consequence.`;
    case 'delayed_reveal':
      return `Do not reveal “${memoryAnchor}” early. Set up the misunderstanding and land the phrase once near the ending.`;
    case 'callback':
      return `Place “${memoryAnchor}” near the opening and return to it near the ending with a changed meaning.`;
    case 'one_shot':
      return `Protect “${memoryAnchor}” as a single-use final punchline. Never preview or repeat it earlier.`;
    case 'none':
      return `Do not force a repeated catchphrase. Treat “${memoryAnchor}” as a thematic memory anchor carried by image, cadence, or structure rather than exact lyrical repetition.`;
  }
}
