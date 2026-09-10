import type { MemeHookCandidate, MemeStrategyCandidate } from '@/types/lyric-workshop';
import { describe, expect, it } from 'vitest';
import { resolveStrategyPackage } from './lyrics-strategy-packages';

const hooks: MemeHookCandidate[] = [
  { id: 'hook-a', phrase: 'Open the group chat', mode: 'caption', whyItWorks: 'Fast setup', score: 90 },
  { id: 'hook-b', phrase: 'Five years on my couch', mode: 'reveal', whyItWorks: 'Late payoff', score: 88 },
];

const strategies: MemeStrategyCandidate[] = [
  {
    id: 'dialogue',
    narrativeForm: 'character_dialogue',
    propagationAction: 'call_response',
    hookId: 'hook-a',
    sourceTrigger: 'The public exchange already contains two speaking roles.',
    whyNative: 'The joke exists in the reply pattern.',
    memoryAnchor: 'Open the group chat',
    executionRule: 'Escalate the second response.',
    score: 92,
  },
  {
    id: 'reveal',
    narrativeForm: 'single_punchline',
    propagationAction: 'one_shot',
    hookId: 'hook-b',
    sourceTrigger: 'The old interview changes the meaning of the new remark.',
    whyNative: 'The factual timeline supplies a final reveal.',
    memoryAnchor: 'Five years on my couch',
    executionRule: 'Land once at the ending.',
    score: 89,
  },
];

describe('单稿策略选择', () => {
  it('保留指定策略及其绑定的 Hook，不返回第二套草稿策略', () => {
    const result = resolveStrategyPackage(strategies, hooks, 'reveal');
    expect(result.strategy.id).toBe('reveal');
    expect(result.hook.id).toBe('hook-b');
    expect(Object.keys(result).sort()).toEqual(['hook', 'strategy']);
  });
  it('无效选择回退到评分最高的合法策略', () => {
    expect(resolveStrategyPackage(strategies, hooks, 'missing').strategy.id).toBe('dialogue');
  });
  it('跳过引用不存在 Hook 的策略', () => {
    expect(
      resolveStrategyPackage([{ ...strategies[0], hookId: 'missing' }, strategies[1]], hooks, 'dialogue').strategy.id
    ).toBe('reveal');
  });
  it('只有一个合法策略时正常写作', () => {
    expect(resolveStrategyPackage([strategies[0]], hooks).strategy.id).toBe('dialogue');
  });
  it('没有合法策略时拒绝写作', () => {
    expect(() => resolveStrategyPackage(strategies, [])).toThrow(
      'The lyric workshop did not produce a valid strategy linked to a hook'
    );
  });
});
