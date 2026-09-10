import type { LyricWorkshop } from '@/types/lyric-workshop';
import { buildMemeExecutionRules, countAnchorOccurrences } from './lyrics-meme-strategy';

/** 只携带本次局部修改需要的创作约束，不重复候选和历史草稿。 */
export function buildLyricsRewriteContext(workshop?: LyricWorkshop | null, sourceText?: string | null) {
  const hook = workshop?.hookCandidates?.find((item) => item.id === workshop.selectedHookId);
  const strategy = workshop?.memeStrategyCandidates?.find((item) => item.id === workshop.selectedMemeStrategyId);
  return {
    sourceText: sourceText?.slice(0, 10000),
    factLedger: workshop?.factLedger,
    satireTarget: workshop?.satireTarget,
    artisticLens: workshop?.artisticLens,
    blueprint: workshop?.blueprint,
    writingConstraints: workshop?.safety.riskFlags,
    lockedHook: hook?.phrase,
    narrativeForm: strategy?.narrativeForm,
    executionRule: strategy && hook ? buildMemeExecutionRules(strategy.propagationAction, hook.phrase) : undefined,
  };
}

/** 局部重写不增加、移除或改写已选锚句；不额外调用模型返修。 */
export function preservesRewriteAnchor(original: string, rewritten: string, anchor?: string) {
  return !anchor || countAnchorOccurrences(original, anchor) === countAnchorOccurrences(rewritten, anchor);
}
