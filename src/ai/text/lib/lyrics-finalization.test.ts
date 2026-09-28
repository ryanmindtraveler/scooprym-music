import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ generateObject: vi.fn() }));
vi.mock('ai', () => ({ generateObject: mocks.generateObject }));
vi.mock('./provider-fallback', () => ({
  runWithTextProviderFallback: ({ execute }: { execute: (provider: string) => unknown }) => execute('openrouter'),
  getStructuredOutputSettings: () => ({}),
  getStructuredOutputSettingsWithReasoning: () => ({}),
}));
import { generateLyrics } from './generation';
import { LYRIC_CRAFT_BRIEF, LYRIC_DIAGNOSTIC_BRIEF, LYRIC_EDITOR_CHECKLIST } from './lyrics-craft-prompts';

// 固定虚构素材，验证传输、检查点与后续编辑读取的锚点一致，不评判模型文采。
const plan = {
  sourceBrief: {
    isValid: true,
    validationError: null,
    title: 'The Empty Chair',
    summary: 'An empty chair wins the fictional office contest.',
    angle: 'The chair needs no speech to win.',
  },
  contentCategory: 'internet_weirdness',
  categoryLabel: 'Office comedy',
  factLedger: {
    verifiedFacts: ['A fictional chair won.'],
    attributedClaims: [],
    forbiddenInferences: ['Do not invent a real person.'],
  },
  artisticLens: {
    symbolicImage: 'An empty chair',
    humanTension: 'Wanting applause',
    culturalMirror: 'Office performance',
    shareableLineIntent: 'The chair wins without a speech',
  },
  safety: { decision: 'allow', reason: 'Fictional office comedy', riskFlags: [] },
  satireTarget: 'Empty performance',
  toneCeiling: 'playful',
  comicPremises: Array.from({ length: 3 }, (_, index) => ({
    id: `P${index}`,
    line: 'The chair wins without a speech',
    sourceDetail: 'The empty chair',
    score: 90 - index,
  })),
  selectedPremiseId: 'P0',
  hookCandidates: Array.from({ length: 6 }, (_, index) => ({
    id: `H${index}`,
    phrase: 'Chair takes crown',
    mode: 'chant',
    whyItWorks: 'A concrete winner',
    score: 90 - index,
  })),
  memeStrategyCandidates: [
    {
      id: 'S0',
      narrativeForm: 'character_dialogue',
      propagationAction: 'exact_repeat',
      hookId: 'H0',
      sourceTrigger: 'The empty chair wins',
      whyNative: 'Office competition',
      executionRule: 'Repeat the winner',
      score: 90,
    },
  ],
  selectedStrategyId: 'S0',
  blueprint: {
    structure: 'Verse then hook',
    pointOfView: 'Office worker',
    cadence: 'Natural speech',
    openingMove: 'Show the chair',
    turn: 'Chair wins',
    ending: 'Repeat winner',
  },
};
const sections = [
  {
    section: 'Verse 1',
    lines: [
      'HeidiFest is written on the wall',
      'The empty chair waits in the hall',
      'We all prepared a grand speech',
      'The prize was sitting within reach',
      'We polished every word all night',
      'The chair just sat beneath the light',
      'The judges asked us all to wait',
      'It had no speech to complicate',
    ],
  },
  {
    section: 'Hook',
    lines: [
      'The chair wins',
      'It never had to say a thing',
      'The chair wins',
      'We gave that empty seat a ring',
      'We take our speeches to the door',
      'The chair still owns the office floor',
    ],
  },
];
const draft = {
  songTitle: 'The Empty Chair',
  hook: 'Chair takes crown',
  prosodyPlan: 'Short natural phrases over a bouncy groove.',
  sections,
};
const final = {
  ...draft,
  hook: 'The chair wins',
  selectedHookId: 'H0',
  selectedStrategyId: 'S0',
  editorialNotes: ['Replaced the awkward anchor with The chair wins.'],
  factAudit: { decision: 'pass', unsupportedClaims: [], attributionIssues: [], revisionInstructions: [] },
  craftIssues: [],
  anchorRevision: { phrase: 'The chair wins', reason: 'The planned phrase was missing a natural article.' },
};

beforeEach(() => {
  mocks.generateObject.mockReset();
});
describe('真实管线的定稿契约', () => {
  it('旧版定稿重新审校，修订锚点同步候选和质量检查，原始草稿保留原锚点', async () => {
    mocks.generateObject
      .mockResolvedValueOnce({ object: draft })
      .mockResolvedValueOnce({ object: { issues: [] } })
      .mockResolvedValueOnce({ object: final });
    const checkpoints: Record<string, any> = {};
    const result = await generateLyrics({
      preparedSource: { text: 'A fictional empty chair wins an office contest. ORIGINAL_SOURCE_FOR_FACT_REVIEW' },
      directionPrompt: 'Playful pop',
      resumeCheckpoints: {
        planning_lyrics: {
          ...plan,
          blueprint: { ...plan.blueprint, ending: 'SPECULATIVE_BLUEPRINT_WORDING' },
          artisticLens: { ...plan.artisticLens, symbolicImage: 'SPECULATIVE_LENS_WORDING' },
        },
        editing_lyrics: { ...final, lyrics: '[Verse 1]\nOld text', finalizationVersion: 5 },
      },
      onCheckpoint: async (stage, value) => {
        checkpoints[stage] = value;
      },
    });
    expect(mocks.generateObject).toHaveBeenCalledTimes(3);
    expect(mocks.generateObject.mock.calls[0][0].system).toContain(LYRIC_CRAFT_BRIEF);
    expect(mocks.generateObject.mock.calls[1][0].system).toBe(LYRIC_DIAGNOSTIC_BRIEF);
    expect(mocks.generateObject.mock.calls[2][0].system).toContain(LYRIC_EDITOR_CHECKLIST);
    expect(mocks.generateObject.mock.calls[0][0].prompt).not.toContain('ORIGINAL_SOURCE_FOR_FACT_REVIEW');
    expect(mocks.generateObject.mock.calls[1][0].prompt).toContain('ORIGINAL_SOURCE_FOR_FACT_REVIEW');
    for (const [request] of mocks.generateObject.mock.calls) {
      expect(request.system).not.toContain('free parking');
      expect(request.system).not.toContain('robot vacuum');
      expect(request.prompt).not.toContain('SPECULATIVE_BLUEPRINT_WORDING');
      expect(request.prompt).not.toContain('SPECULATIVE_LENS_WORDING');
      expect(request.prompt).toContain('A fictional chair won.');
      expect(request.prompt).toContain('exact_repeat');
    }
    expect(result.lyrics).toContain('HeidiFest is written on the wall\n');
    expect(result.workshop.hookCandidates[0].phrase).toBe('The chair wins');
    expect(result.workshop.drafts[0].hook).toBe('Chair takes crown');
    expect(result.workshop.qualityGate.deterministicIssues.join(' ')).not.toContain('Repeat the locked hook');
    expect(checkpoints.editing_lyrics.finalizationVersion).toBe(10);
    expect(checkpoints.editing_lyrics.lyrics).toBe(result.lyrics);
    expect(checkpoints.editing_lyrics).not.toHaveProperty('sections');
  });

  it('坏修改稿不导致退回，自动使用可交付初稿且不伪造质量通过', async () => {
    mocks.generateObject
      .mockResolvedValueOnce({ object: draft })
      .mockResolvedValueOnce({ object: { issues: [] } })
      .mockResolvedValueOnce({
        object: {
          ...final,
          sections: [...sections, { section: 'Outro', lines: ['Production Notes: tuba bass, hard cut.'] }],
        },
      });
    const saved: string[] = [];
    const result = await generateLyrics({
      preparedSource: { text: 'A fictional empty chair wins an office contest.' },
      resumeCheckpoints: { planning_lyrics: plan },
      onCheckpoint: async (stage) => {
        saved.push(stage);
      },
    });
    expect(result.requiresReview).toBe(false);
    expect(result.lyrics).not.toContain('Production Notes');
    expect(result.workshop.qualityGate.passed).toBe(false);
    expect(result.workshop.qualityGate.reviewStatus).toBe('stale');
    expect(saved).toContain('editing_lyrics');
  });

  it('独立检查和修改均失败时仍完成，不无限重试', async () => {
    mocks.generateObject
      .mockResolvedValueOnce({ object: draft })
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'));
    const result = await generateLyrics({
      preparedSource: { text: 'A fictional chair won.' },
      resumeCheckpoints: { planning_lyrics: plan },
    });
    expect(mocks.generateObject).toHaveBeenCalledTimes(3);
    expect(result.requiresReview).toBe(false);
    expect(result.workshop.qualityGate.passed).toBe(false);
    expect(result.workshop.editorialNotes.join(' ')).toContain('unavailable');
  });

  it('初稿独立选择核心句，检查指出的问题传给修改环节', async () => {
    const diagnosis = {
      issues: [{ line: 'The empty chair waits in the hall', category: 'meaning', repair: 'REPAIR_THIS_SPECIFIC_LINE' }],
    };
    mocks.generateObject
      .mockResolvedValueOnce({ object: draft })
      .mockResolvedValueOnce({ object: diagnosis })
      .mockResolvedValueOnce({ object: final });
    await generateLyrics({
      preparedSource: { text: 'A fictional chair won.' },
      resumeCheckpoints: { planning_lyrics: plan },
    });
    expect(mocks.generateObject.mock.calls[0][0].prompt).not.toContain('Chair takes crown');
    expect(mocks.generateObject.mock.calls[2][0].prompt).toContain('REPAIR_THIS_SPECIFIC_LINE');
    expect(mocks.generateObject.mock.calls[2][0].prompt).toContain('repair these specific defects');
  });

  it('写词、检查和修改均不可用时，以已有事实简稿完成', async () => {
    mocks.generateObject.mockImplementation(async () => {
      throw new Error('service unavailable');
    });
    const checkpoints: Record<string, any> = { planning_lyrics: plan };
    const result = await generateLyrics({
      preparedSource: { text: 'A fictional chair won.' },
      resumeCheckpoints: { planning_lyrics: plan },
      onCheckpoint: async (stage, value) => {
        checkpoints[stage] = value;
      },
    });
    expect(result.requiresReview).toBe(false);
    expect(result.lyrics).toContain('A fictional chair won.');
    expect(result.workshop.qualityGate.passed).toBe(false);
    expect(result.workshop.editorialNotes.join(' ')).toContain('source-fact fallback');
    expect(mocks.generateObject).toHaveBeenCalledTimes(3);
    mocks.generateObject.mockClear();
    const resumed = await generateLyrics({
      preparedSource: { text: 'A fictional chair won.' },
      resumeCheckpoints: checkpoints,
    });
    expect(mocks.generateObject).not.toHaveBeenCalled();
    expect(resumed.lyrics).toBe(result.lyrics);
    expect(resumed.workshop.qualityGate.reviewStatus).toBe('stale');
    expect(resumed.workshop.editorialNotes.join(' ')).toContain('source-fact fallback');
  });

  it('初稿只有两行时改用事实保底，不把格式错误交给用户', async () => {
    mocks.generateObject
      .mockResolvedValueOnce({
        object: {
          ...draft,
          sections: [{ section: 'Verse 1', lines: ['A chair wins. '.repeat(8), 'The office waits. '.repeat(8)] }],
        },
      })
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'));
    const result = await generateLyrics({
      preparedSource: { text: 'A fictional chair won.' },
      resumeCheckpoints: { planning_lyrics: plan },
    });
    expect(result.requiresReview).toBe(false);
    expect(result.lyrics).toContain('A fictional chair won.');
    expect(result.workshop.editorialNotes.join(' ')).toContain('source-fact fallback');
  });
});
