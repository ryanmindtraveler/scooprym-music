import type { MemeHookCandidate } from '@/types/lyric-workshop';

/**
 * 规划模型偶尔会返回不存在或重复的 ID；在进入昂贵双稿阶段前确定两个不同且可追溯的 Hook。
 */
export function resolveCompetingHooks(hookCandidates: MemeHookCandidate[], draftHookIds: { A?: string; B?: string }) {
  const ranked = [...hookCandidates].sort((left, right) => right.score - left.score);
  const artisticHook = hookCandidates.find((item) => item.id === draftHookIds.A) || ranked[0];
  const requestedMemeHook = hookCandidates.find((item) => item.id === draftHookIds.B);
  const memeHook =
    (requestedMemeHook?.id !== artisticHook?.id ? requestedMemeHook : undefined) ||
    ranked.find((item) => item.id !== artisticHook?.id) ||
    artisticHook;

  if (!artisticHook || !memeHook) {
    throw new Error('The lyric workshop did not produce enough valid hook candidates');
  }

  return { artisticHook, memeHook };
}
