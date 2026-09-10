import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ generateObject: vi.fn() }));
vi.mock('ai', () => ({ generateObject: mocks.generateObject }));
vi.mock('./provider-fallback', () => ({
  runWithTextProviderFallback: ({ execute }: { execute: (provider: string) => unknown }) => execute('openrouter'),
  getStructuredOutputSettings: () => ({}),
  getStructuredOutputSettingsWithReasoning: () => ({}),
}));
import type { LyricWorkshop } from '@/types/lyric-workshop';
import { rewriteLyrics } from './generation';

const workshop: LyricWorkshop = {
  contentCategory: 'internet_weirdness',
  categoryLabel: 'Internet',
  factLedger: {
    verifiedFacts: ['The post was deleted'],
    attributedClaims: ['The author called it a joke'],
    forbiddenInferences: ['Do not invent a motive'],
  },
  artisticLens: {
    symbolicImage: 'An empty chair',
    humanTension: 'Saving face',
    culturalMirror: 'Public performance',
    shareableLineIntent: 'The chair wins',
  },
  safety: { decision: 'allow', reason: 'Public event', riskFlags: ['Preserve attribution'] },
  satireTarget: 'The contradiction',
  toneCeiling: 'playful',
  comicPremises: [],
  selectedPremiseId: 'p1',
  hookCandidates: [{ id: 'h1', phrase: 'chair wins', mode: 'reveal', whyItWorks: 'Concrete', score: 90 }],
  selectedHookId: 'h1',
  memeStrategyCandidates: [
    {
      id: 's1',
      hookId: 'h1',
      narrativeForm: 'single_punchline',
      propagationAction: 'one_shot',
      sourceTrigger: 'The chair',
      whyNative: 'Public detail',
      executionRule: 'End once',
      score: 90,
    },
  ],
  selectedMemeStrategyId: 's1',
  blueprint: {
    structure: 'Setup then reveal',
    pointOfView: 'First person chair',
    cadence: 'Short lines',
    openingMove: 'Empty room',
    turn: 'Post deleted',
    ending: 'chair wins',
  },
  drafts: [
    { id: 'A', label: 'Single draft', focus: 'Setup', hook: 'chair wins', lyrics: 'Original', qualityIssues: [] },
  ],
  editorialNotes: ['Original review'],
  qualityGate: {
    passed: true,
    reviewedLyrics: 'Original',
    reviewStatus: 'current',
    deterministicIssues: [],
    factualIssues: ['Old finding'],
    estimatedDurationSeconds: 50,
    repairAttempts: 0,
  },
};

describe('重写模型调用', () => {
  beforeEach(() => vi.clearAllMocks());
  it('一次调用携带事实和策略，同时保留选区以外内容', async () => {
    mocks.generateObject.mockResolvedValue({ object: { rewrittenText: 'Empty room' } });
    const result = await rewriteLyrics({
      selectedText: 'Quiet room',
      context: 'Quiet room\nchair wins',
      selectionStart: 0,
      workshop,
    });
    expect(result).toBe('Empty room');
    expect(mocks.generateObject).toHaveBeenCalledTimes(1);
    const request = mocks.generateObject.mock.calls[0][0];
    const prompt = JSON.parse(request.prompt);
    expect(prompt.creativeContext.factLedger).toEqual(workshop.factLedger);
    expect(prompt.creativeContext.executionRule).toContain('single-use final punchline');
    expect(request.system).toContain('Infer the selected passage');
  });
  it('局部选中锚句的一部分时也不能破坏完整锚句，不自动重试', async () => {
    mocks.generateObject.mockResolvedValue({ object: { rewrittenText: 'loses' } });
    await expect(
      rewriteLyrics({ selectedText: 'wins', context: 'chair wins', selectionStart: 6, workshop })
    ).rejects.toThrow('locked hook');
    expect(mocks.generateObject).toHaveBeenCalledTimes(1);
  });
});
