import type { MemeHookCandidate, MemeStrategyCandidate } from '@/types/lyric-workshop';
import { describe, expect, it } from 'vitest';
import { resolveCompetingStrategyPackages } from './lyrics-strategy-packages';

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

describe('resolveCompetingStrategyPackages', () => {
  it('保留两组不同策略和 Hook', () => {
    const result = resolveCompetingStrategyPackages(strategies, hooks, { A: 'dialogue', B: 'reveal' });
    expect(result.A.strategy.id).toBe('dialogue');
    expect(result.B?.strategy.id).toBe('reveal');
    expect(result.A.hook.id).not.toBe(result.B?.hook.id);
  });

  it('无效或重复选择会回退到另一组合法策略', () => {
    const result = resolveCompetingStrategyPackages(strategies, hooks, { A: 'missing', B: 'dialogue' });
    expect(result.A.strategy.id).toBe('dialogue');
    expect(result.B?.strategy.id).toBe('reveal');
  });

  it('只有一套有效策略也能进入单稿写作', () => {
    const result = resolveCompetingStrategyPackages([strategies[0]], hooks, { A: 'dialogue' });
    expect(result.A.strategy.id).toBe('dialogue');
    expect(result.B).toBeUndefined();
  });

  it('旧检查点的第二套策略引用不存在的 Hook 不阻断单稿', () => {
    const result = resolveCompetingStrategyPackages(
      [strategies[0], { ...strategies[1], hookId: 'missing' }], hooks,
      { A: 'dialogue', B: 'reveal' }
    );
    expect(result.A.strategy.id).toBe('dialogue');
    expect(result.B).toBeUndefined();
  });

  it('首选无效时使用唯一有效的备选', () => {
    const result = resolveCompetingStrategyPackages(
      [{ ...strategies[0], hookId: 'missing' }, strategies[1]], hooks,
      { A: 'dialogue', B: 'reveal' }
    );
    expect(result.A.strategy.id).toBe('reveal');
  });

  it('没有任何有效策略时仍拒绝写作，不伪造策略和 Hook', () => {
    expect(() => resolveCompetingStrategyPackages(strategies, [], {})).toThrow(
      'The lyric workshop did not produce a valid strategy linked to a hook'
    );
  });
});
