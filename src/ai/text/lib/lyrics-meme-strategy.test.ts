import type { MemeStrategyCandidate } from '@/types/lyric-workshop';
import { describe, expect, it } from 'vitest';
import { buildMemeExecutionRules, resolveMemeStrategy } from './lyrics-meme-strategy';

const strategies: MemeStrategyCandidate[] = [
  {
    id: 'dialogue',
    narrativeForm: 'character_dialogue',
    propagationAction: 'call_response',
    sourceTrigger: 'The public exchange is already a two-person scene.',
    whyNative: 'The event supplies both voices.',
    memoryAnchor: 'You live here?',
    executionRule: 'Let the answer become stranger on its return.',
    score: 92,
  },
  {
    id: 'punchline',
    narrativeForm: 'single_punchline',
    propagationAction: 'one_shot',
    sourceTrigger: 'One verified detail reinterprets the setup.',
    whyNative: 'The story already contains a reveal.',
    memoryAnchor: 'Five years on my couch',
    executionRule: 'Reveal it only in the outro.',
    score: 88,
  },
];

describe('事件原生 Meme 策略', () => {
  it('优先使用规划模型选择的有效策略，否则按分数回退', () => {
    expect(resolveMemeStrategy(strategies, 'punchline').id).toBe('punchline');
    expect(resolveMemeStrategy(strategies, 'missing').id).toBe('dialogue');
  });

  it('无显式机制不会强迫歌词重复 Hook', () => {
    expect(buildMemeExecutionRules('none', 'the open door')).toContain('Do not force a repeated catchphrase');
  });

  it('单句击穿会保护结尾 Punchline', () => {
    expect(buildMemeExecutionRules('one_shot', 'Five years on my couch')).toContain('single-use final punchline');
  });
});
