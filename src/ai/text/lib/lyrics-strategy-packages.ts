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
 * 为单稿选择可追溯的“策略 + Hook”；旧记录的第二套策略仅作为可选备选。
 * 规划模型返回无效 ID 时，按策略评分和合法 Hook 自动回退。
 */
export function resolveCompetingStrategyPackages(
  strategies: MemeStrategyCandidate[],
  hooks: MemeHookCandidate[],
  requestedIds: { A?: string; B?: string }
): { A: MemeStrategyPackage; B?: MemeStrategyPackage } {
  const valid = [...strategies]
    .sort((left, right) => right.score - left.score)
    .map((strategy) => ({ strategy, hook: resolveHook(strategy, hooks) }))
    .filter((item): item is MemeStrategyPackage => !!item.hook);

  const requestedA = valid.find((item) => item.strategy.id === requestedIds.A);
  const packageA = requestedA || valid[0];
  const requestedB = valid.find((item) => item.strategy.id === requestedIds.B);
  const packageB =
    (requestedB?.strategy.id !== packageA?.strategy.id ? requestedB : undefined) ||
    valid.find((item) => item.strategy.id !== packageA?.strategy.id && item.hook.id !== packageA?.hook.id) ||
    valid.find((item) => item.strategy.id !== packageA?.strategy.id);

  if (!packageA) {
    throw new Error('The lyric workshop did not produce a valid strategy linked to a hook');
  }

  return { A: packageA, B: packageB };
}
