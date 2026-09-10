export type LyricContentCategory = 'news_absurdity' | 'celebrity_chaos' | 'internet_weirdness';

export type LyricSafetyDecision = 'allow' | 'review' | 'block';

export type MemeHookMode = 'caption' | 'chant' | 'punchline' | 'loop' | 'image' | 'callback' | 'reveal' | 'anchor';

export type MemeMechanicMode =
  | 'phonetic_loop'
  | 'call_response'
  | 'escalating_list'
  | 'deadpan_contrast'
  | 'misdirection'
  | 'micro_catchphrase';

export type MemeNarrativeForm =
  | 'magic_slogan'
  | 'character_dialogue'
  | 'absurd_escalation'
  | 'deadpan_narration'
  | 'dramatic_reversal'
  | 'fake_commercial'
  | 'fake_newscast'
  | 'group_chat_choir'
  | 'single_punchline'
  | 'organic_song';

export type MemePropagationAction =
  | 'exact_repeat'
  | 'mutating_repeat'
  | 'call_response'
  | 'escalating_list'
  | 'delayed_reveal'
  | 'callback'
  | 'one_shot'
  | 'none';

export interface MemeStrategyCandidate {
  id: string;
  narrativeForm: MemeNarrativeForm;
  propagationAction: MemePropagationAction;
  /** 新策略直接引用 Hook Lab 中的候选，避免策略锚点与最终 Hook 出现两套真相。 */
  hookId?: string;
  sourceTrigger: string;
  whyNative: string;
  /** 旧运行记录的自由文本锚点，仅用于兼容读取。 */
  memoryAnchor?: string;
  executionRule: string;
  score: number;
}

export interface LyricQualityGate {
  /** 模型审查对应的歌词快照；编辑后的本地检查不能冒充模型复核。 */
  reviewedLyrics?: string;
  reviewStatus?: 'current' | 'stale';
  passed: boolean;
  deterministicIssues: string[];
  factualIssues: string[];
  craftIssues?: string[];
  estimatedDurationSeconds: number;
  repairAttempts: number;
}

export interface LyricReviewOutcome {
  decision: 'approved' | 'rejected';
  reviewedAt: string;
  reviewerId?: string;
}

export interface MemeMechanic {
  mode: MemeMechanicMode;
  device: string;
  loopPhrase: string;
  escalationPattern: string;
  whyItSpreads: string;
}

export interface LyricFactLedger {
  verifiedFacts: string[];
  attributedClaims: string[];
  forbiddenInferences: string[];
}

/** 新闻事实转化为歌曲时使用的三层艺术视角，避免歌词退化为押韵摘要。 */
export interface LyricArtisticLens {
  symbolicImage: string;
  humanTension: string;
  culturalMirror: string;
  shareableLineIntent: string;
}

export interface ComicPremise {
  id: string;
  line: string;
  sourceDetail: string;
  score: number;
}

export interface MemeHookCandidate {
  id: string;
  phrase: string;
  mode: MemeHookMode;
  whyItWorks: string;
  score: number;
}

export interface LyricBlueprint {
  structure: string;
  pointOfView: string;
  cadence: string;
  openingMove: string;
  turn: string;
  ending: string;
}

export interface LyricDraftCandidate {
  id: 'A';
  label: string;
  focus: string;
  hook: string;
  lyrics: string;
  qualityIssues: string[];
}

export interface LyricWorkshop {
  contentCategory: LyricContentCategory;
  categoryLabel: string;
  factLedger: LyricFactLedger;
  artisticLens: LyricArtisticLens;
  safety: {
    decision: LyricSafetyDecision;
    reason: string;
    riskFlags: string[];
  };
  satireTarget: string;
  toneCeiling: 'playful' | 'sharp' | 'savage';
  comicPremises: ComicPremise[];
  selectedPremiseId: string;
  hookCandidates: MemeHookCandidate[];
  selectedHookId: string;
  /** 旧运行记录的固定机制结构，仅用于兼容读取。 */
  memeMechanic?: MemeMechanic;
  /** 新运行会先比较多种从事件自然生长出来的策略，再选择一项。 */
  memeStrategyCandidates?: MemeStrategyCandidate[];
  selectedMemeStrategyId?: string;
  blueprint: LyricBlueprint;
  productionRecipe?: string;
  drafts: [LyricDraftCandidate];
  editorialNotes: string[];
  qualityGate?: LyricQualityGate;
  reviewOutcome?: LyricReviewOutcome;
}
