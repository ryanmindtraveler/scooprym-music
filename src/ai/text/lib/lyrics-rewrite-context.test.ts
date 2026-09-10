import { useCreateStore } from '@/store/create-store';
import type { LyricWorkshop } from '@/types/lyric-workshop';
import { describe, expect, it } from 'vitest';
import { buildLyricsRewriteContext, preservesRewriteAnchor } from './lyrics-rewrite-context';

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
  hookCandidates: [{ id: 'h1', phrase: 'Chair wins', mode: 'reveal', whyItWorks: 'Concrete', score: 90 }],
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
    ending: 'Chair wins',
  },
  drafts: [
    { id: 'A', label: 'Single draft', focus: 'Setup', hook: 'Chair wins', lyrics: 'Original', qualityIssues: [] },
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

describe('局部修改继承创作约束', () => {
  it('提供事实、视角和结尾规则，不传无关草稿候选', () => {
    const result = buildLyricsRewriteContext(workshop, 'The original article');
    expect(result.factLedger).toEqual(workshop.factLedger);
    expect(result.blueprint?.pointOfView).toBe('First person chair');
    expect(result.executionRule).toContain('single-use final punchline');
    expect(result.lockedHook).toBe('Chair wins');
    expect(result).not.toHaveProperty('drafts');
  });
  it('没有工作坊时仍可提供素材', () => {
    expect(buildLyricsRewriteContext(null, 'Source').sourceText).toBe('Source');
  });
  it('锚句不能被删除或添加，标点变化不误报', () => {
    expect(preservesRewriteAnchor('Chair wins!', 'Chair loses', 'Chair wins')).toBe(false);
    expect(preservesRewriteAnchor('The room waits', 'Chair wins', 'Chair wins')).toBe(false);
    expect(preservesRewriteAnchor('Chair wins!', 'Chair, wins.', 'Chair wins')).toBe(true);
    expect(preservesRewriteAnchor('The art', 'The party', 'art')).toBe(false);
  });
  it('全局编辑入口刷新本地建议并使旧模型审查失效', () => {
    useCreateStore.setState({ lyrics: 'Original', lyricWorkshop: workshop, musicLyricsSnapshot: 'Original' });
    useCreateStore.getState().setLyrics('[Verse 1]\nNew words');
    const state = useCreateStore.getState();
    expect(state.hasUnsavedLyricsChanges).toBe(true);
    expect(state.lyricWorkshop?.qualityGate).toMatchObject({ passed: false, reviewStatus: 'stale', factualIssues: [] });
    expect(state.lyricWorkshop?.qualityGate?.deterministicIssues.length).toBeGreaterThan(0);
    expect(workshop.qualityGate?.passed).toBe(true);
    useCreateStore.setState({
      lyrics: '',
      lyricWorkshop: null,
      musicLyricsSnapshot: null,
      hasUnsavedLyricsChanges: false,
    });
  });
  it('相同歌词不使有效审查失效', () => {
    useCreateStore.setState({ lyrics: 'Original', lyricWorkshop: workshop });
    useCreateStore.getState().setLyrics('Original');
    expect(useCreateStore.getState().lyricWorkshop?.qualityGate?.reviewStatus).toBe('current');
    useCreateStore.setState({ lyrics: '', lyricWorkshop: null });
  });
});
