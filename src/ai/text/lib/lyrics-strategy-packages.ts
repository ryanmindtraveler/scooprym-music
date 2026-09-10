import type { MemeHookCandidate, MemeStrategyCandidate } from '@/types/lyric-workshop';

export interface MemeStrategyPackage {
  strategy: MemeStrategyCandidate;
  hook: MemeHookCandidate;
}

function resolveHook(strategy: MemeStrategyCandidate, hooks: MemeHookCandidate[]) {
  const requested = strategy.hookId || '';
  return hooks.find((hook) => hook.id === requested);
}

/**
 * 为单稿选择唯一且可追溯的“策略 + Hook”。
 * 规划模型返回无效 ID 时，按策略评分和合法 Hook 自动回退。
 */
export function resolveStrategyPackage(
  strategies: MemeStrategyCandidate[],
  hooks: MemeHookCandidate[],
  selectedStrategyId?: string
): MemeStrategyPackage {
  const valid = [...strategies]
    .sort((left, right) => right.score - left.score)
    .map((strategy) => ({ strategy, hook: resolveHook(strategy, hooks) }))
    .filter((item): item is MemeStrategyPackage => !!item.hook);

  const selected = valid.find((item) => item.strategy.id === selectedStrategyId);
  const selectedPackage = selected || valid[0];
  if (!selectedPackage) {
    throw new Error('The lyric workshop did not produce a valid strategy linked to a hook');
  }

  return selectedPackage;
}
