import {
  type EditorialStyleProfile,
  getEditorialStyleProfileById,
  resolveEditorialStyleProfile,
} from './editorial-styles';
import { ADAPTIVE_ARRANGEMENT_RULE, LEGACY_PRODUCTION } from './legacy-production';
import { LEGACY_VIBE_PERSONAS } from './legacy-vibes';

export type StorySignal =
  | 'absurd'
  | 'celebratory'
  | 'confrontational'
  | 'high-energy'
  | 'intimate'
  | 'melancholic'
  | 'mysterious'
  | 'tech';

export interface ProductionVariant {
  id: string;
  label: string;
  foundation: string;
  groove: string;
  colors: readonly [string, string];
  preferredSignals: readonly StorySignal[];
  arrangementArc?: string;
  vocalDirection?: string;
  avoid?: string;
}

export interface DynamicProductionRecipe {
  editorialStyleId: string;
  editorialStyleLabel: string;
  variantId: string;
  variantLabel: string;
  foundation: string;
  groove: string;
  vocal: string;
  colors: readonly [string, string];
  arrangementArc: string;
  avoid: string;
  detectedSignals: readonly StorySignal[];
  matchedSignals: readonly StorySignal[];
}

interface BuildDynamicProductionRecipeInput {
  direction: string;
  storyContext?: string;
  lyrics?: string;
  variantId?: string | null;
}

const SIGNAL_PATTERNS: Readonly<Record<StorySignal, readonly RegExp[]>> = {
  absurd: [
    /absurd|bizarre|weird|ridiculous|chaos|meme|viral|unexpected|unhinged/i,
    /荒诞|离谱|奇怪|混乱|梗|走红|意外/i,
  ],
  celebratory: [
    /celebrat|award|win(?:s|ner)?|victory|premiere|debut|record[- ]breaking|fashion|party/i,
    /庆祝|获奖|胜利|首映|首次亮相|破纪录|时尚|派对/i,
  ],
  confrontational: [
    /feud|clash|slam|call(?:s|ed)? out|accus|den(?:y|ies)|response|backlash|fight|roast|diss/i,
    /争执|冲突|抨击|指控|否认|回应|反弹|争吵|吐槽/i,
  ],
  'high-energy': [
    /blowup|meltdown|erupts?|explod|shout|stunt|chase|launch|live|crowd|dance/i,
    /爆发|失控|大喊|特技|追逐|发布会|直播|人群|舞蹈/i,
  ],
  intimate: [
    /relationship|breakup|private|confess|interview|family|friend|neighbor|message|apolog/i,
    /恋情|分手|私人|坦白|采访|家庭|朋友|邻居|消息|道歉/i,
  ],
  melancholic: [
    /regret|grief|loss|farewell|exit|death|sad|lonely|heartbreak|tear/i,
    /遗憾|悲伤|失去|告别|离开|死亡|孤独|心碎|眼泪/i,
  ],
  mysterious: [
    /myster|unknown|unexplained|vanish|strange sight|rumou?r|secret|cryptic|coincidence/i,
    /神秘|未知|无法解释|消失|目击|传闻|秘密|隐晦|巧合/i,
  ],
  tech: [
    /algorithm|app|platform|ai\b|robot|crypto|stream|online|internet|tiktok|twitter|discord/i,
    /算法|应用|平台|人工智能|机器人|加密|直播|在线|互联网/i,
  ],
};

const CUSTOM_PRODUCTION_PROFILE: EditorialStyleProfile = {
  id: 'custom_vibe',
  label: 'Custom Vibe',
  deck: 'Your tags, shaped into a coherent record',
  icon: '✨',
  tags: [],
  bestFor: 'original tag combinations and one-off production experiments',
  editorialLens: 'Preserve the verified story while letting the selected tags define the musical point of view.',
  lyricCraft:
    'Keep the headline legible, build one repeatable hook, and let the custom sound support rather than bury it.',
  productionSignature:
    'Treat the selected tags as a hierarchy: one foundation, one groove, and no more than two signature colors.',
  vocalDirection:
    'Clear, characterful lead delivery shaped by the selected tags, with intelligibility ahead of effects.',
  arrangementArc:
    'Immediate sonic signature -> spacious story verse -> hook-focused lift -> concise contrast section -> decisive final hook.',
  avoid: 'stacking every selected tag at once, genre soup, constant ear candy, and effects that obscure the lyric',
};

const VARIANTS: Readonly<Record<string, readonly ProductionVariant[]>> = {
  ...Object.fromEntries(
    LEGACY_VIBE_PERSONAS.map((preset) => [
      preset.id,
      [
        {
          id: `${preset.id}_original`,
          label: `${preset.label} · Original`,
          foundation: LEGACY_PRODUCTION[preset.id].foundation,
          groove: `Preserve the original rhythm, bass and energy: ${preset.tags.join(', ')}`,
          colors: LEGACY_PRODUCTION[preset.id].colors,
          vocalDirection: `${LEGACY_PRODUCTION[preset.id].vocal} ${LEGACY_PRODUCTION[preset.id].guard}`,
          preferredSignals: [],
        } satisfies ProductionVariant,
      ],
    ])
  ),
  custom_vibe: [
    {
      id: 'custom_tag_focus',
      label: 'Tag-Led Focus',
      foundation: 'coherent hybrid led by the strongest selected genre tag',
      groove: 'one consistent pocket derived from the selected rhythm tags',
      colors: ['one signature texture from the selected palette', 'punchline-timed accent from the selected palette'],
      preferredSignals: ['intimate', 'melancholic', 'mysterious'],
    },
    {
      id: 'custom_hook_first',
      label: 'Hook-First Mix',
      foundation: 'hook-forward contemporary hybrid shaped by the selected tags',
      groove: 'direct repeatable pulse with a single contrast before the final hook',
      colors: ['short vocal motif', 'one story-specific accent texture'],
      preferredSignals: ['absurd', 'celebratory', 'confrontational', 'high-energy', 'tech'],
      arrangementArc:
        'Cold-open hook fragment -> lean story verse -> full hook -> short contrasting bridge -> final hook with one earned lift.',
    },
  ],
  newsroom_noir: [
    {
      id: 'drill_bulletin',
      label: 'Drill Bulletin',
      foundation: 'hard-hitting cinematic UK drill',
      groove: 'punchy syncopated drill kicks, cracking snares and sliding sub-bass with short punchline stops',
      colors: ['short bulletin sting', 'low cinematic string stabs'],
      preferredSignals: ['confrontational', 'high-energy'],
    },
    {
      id: 'noir_dispatch',
      label: 'Noir Dispatch',
      foundation: 'bass-heavy nocturnal drill noir',
      groove: 'weighty half-time drill drums with rolling sub-bass and suspenseful syncopation',
      colors: ['dark electric-piano stab', 'short broadcast sting'],
      preferredSignals: ['mysterious', 'intimate'],
      arrangementArc:
        'Short bulletin sting -> hard-kicking investigative verse -> sliding bass pressure -> headline hook hits -> brief exposed line -> final dispatch.',
    },
  ],
  public_receipts: [
    {
      id: 'industrial_evidence',
      label: 'Industrial Evidence',
      foundation: 'hard-hitting industrial trap',
      groove: 'heavy mechanical kick, metallic snare and distorted bass with a decisive verdict beat switch',
      colors: ['gated metal percussion', 'single record-stop accent'],
      preferredSignals: ['confrontational', 'tech'],
    },
    {
      id: 'cross_exam_breaks',
      label: 'Cross-Exam Breaks',
      foundation: 'industrial breakbeat noir',
      groove: 'hard head-nod drums and a grinding bass riff with evidence-shaped stop-start accents',
      colors: ['dusty piano stab', 'paper-dry snare'],
      preferredSignals: ['intimate', 'mysterious'],
      vocalDirection:
        'Close-mic, percussive spoken-rhythmic lead over hard drums; clipped delivery and projected verdict responses.',
    },
  ],
  algorithm_circus: [
    {
      id: 'circus_trap_loop',
      label: 'Circus Trap Loop',
      foundation: 'tightly arranged circus trap',
      groove: 'spring-loaded half-time kicks, snapping snares and a bouncing bass pocket with comic rests',
      colors: ['booming elastic tuba bass', 'one recurring cartoon-boing motif'],
      preferredSignals: ['absurd', 'high-energy'],
    },
    {
      id: 'electro_sideshow',
      label: 'Electro Sideshow',
      foundation: 'glitchy electro-swing pop',
      groove: 'rubber-band swing with hard electronic kicks and a rubbery bass bounce',
      colors: ['detuned calliope fragment', 'chopped crowd answer'],
      preferredSignals: ['tech', 'celebratory'],
      avoid: 'full-band swing pastiche, random soundboard collage, novelty voices, and continuous glitch fills',
    },
  ],
  velvet_rope_whisper: [
    {
      id: 'flashbulb_rnb',
      label: 'Flashbulb R&B',
      foundation: 'bass-forward rhythmic R&B',
      groove: 'crisp snaps, syncopated kicks and a bouncy bassline that carries the vocal attitude',
      colors: ['pizzicato string punctuation', 'breathy vocal doubles'],
      preferredSignals: ['intimate', 'confrontational'],
    },
    {
      id: 'afterparty_garage',
      label: 'Afterparty Garage',
      foundation: 'bass-driven late-night UK garage',
      groove: 'punchy two-step shuffle with elastic sub-bass and sharp snare accents',
      colors: ['glassy electric piano', 'single flashbulb crowd inhale'],
      preferredSignals: ['celebratory', 'tech'],
      arrangementArc:
        'Vocal pickup over two-step drums -> bass-bouncing close-up verse -> short suspense cut -> full garage hook -> whispered beat-stop -> final bass lift.',
    },
  ],
  receipts_on_wax: [
    {
      id: 'verdict_boom_bap',
      label: 'Verdict Boom Bap',
      foundation: 'dusty 90s boom-bap',
      groove: 'hard-hitting kick and snare with chunky bass and swaggering pocketed swing',
      colors: ['chopped soul punctuation', 'selective vinyl scratch'],
      preferredSignals: ['confrontational', 'intimate'],
    },
    {
      id: 'press_room_funk',
      label: 'Press-Room Funk',
      foundation: 'punchy funk-rap breakbeat',
      groove: 'hard syncopated live drums with thick, clipped funk-bass answers',
      colors: ['muted wah-guitar', 'dry room-clap verdict'],
      preferredSignals: ['celebratory', 'absurd'],
      avoid: 'jam-band solos, slap-bass excess, novelty scratches, and punchlines without factual setup',
    },
  ],
  apology_after_midnight: [
    {
      id: 'rainlit_emo_rap',
      label: 'Rainlit Emo Rap',
      foundation: 'melodic half-time emo rap',
      groove: 'slow half-time trap drums from the opening phrase, deep 808 heartbeat and crisp snare',
      colors: ['close sad-guitar figure', 'brief telephone-filtered opening'],
      preferredSignals: ['melancholic', 'intimate'],
    },
    {
      id: 'notes_app_alt_pop',
      label: 'Notes-App Alt-Pop',
      foundation: 'hook-led nocturnal alt-pop',
      groove: 'slow but weighty electronic heartbeat, syncopated bass and an ear-catching melodic chorus lift',
      colors: ['felt piano motif', 'distant granular vocal haze'],
      preferredSignals: ['tech', 'mysterious'],
      avoid: 'power-ballad belting, cinematic rain beds, oversized drums, and declaring whether the apology is sincere',
    },
  ],
  main_character_emergency: [
    {
      id: 'jersey_replay',
      label: 'Jersey Replay',
      foundation: 'hard-kicking short-form Jersey club',
      groove: 'fast triplet kick pattern, heavy sub-bass and a recognizable footwork pocket',
      colors: ['tight vocal chop', 'single crowd-response lift'],
      preferredSignals: ['high-energy', 'celebratory'],
    },
    {
      id: 'camera_ready_pop',
      label: 'Camera-Ready Pop',
      foundation: 'bright rhythmic dance-pop',
      groove: 'hard stomping syncopated dance drums and a thick bass hook with a brief cut-to-silence setup',
      colors: ['rubbery synth-bass hook', 'layered group answer'],
      preferredSignals: ['intimate', 'absurd'],
      avoid: 'festival EDM build-ups, constant bass drops, long sustained vocal lines, and generic motivational uplift',
    },
  ],
  timeline_fever: [
    {
      id: 'notification_hyperpop',
      label: 'Notification Hyperpop',
      foundation: 'high-impact melodic hyperpop',
      groove: 'hard fast digital kicks, elastic distorted bass and short rhythmic dropouts',
      colors: ['rhythmic notification motif', 'clean robotic vocal double'],
      preferredSignals: ['tech', 'high-energy'],
    },
    {
      id: 'scroll_glitch_garage',
      label: 'Scroll Glitch Garage',
      foundation: 'glitchy future garage pop',
      groove: 'punchy skipping two-step drums with heavy elastic sub movement',
      colors: ['pixelated synth pluck', 'micro-stutter transition'],
      preferredSignals: ['mysterious', 'intimate'],
      avoid:
        'constant bitcrushing, competing app sounds, unintelligible speed, and synthetic processing on every vocal line',
    },
  ],
  internet_folklore: [
    {
      id: 'tape_worn_phonk',
      label: 'Tape-Worn Phonk',
      foundation: 'bass-heavy hypnotic dark phonk',
      groove: 'hypnotic low-tempo loop with a weighty kick, rolling sub-bass and syncopated cowbell accents',
      colors: ['tape-worn synth shadow', 'single distant gong'],
      preferredSignals: ['mysterious', 'tech'],
    },
    {
      id: 'archive_trip_hop',
      label: 'Archive Trip-Hop',
      foundation: 'bass-driven archival trip-hop',
      groove: 'slow head-nod breakbeat with a weighty kick and unresolved rolling bass tension',
      colors: ['warped cassette piano', 'distant room-tone swell'],
      preferredSignals: ['intimate', 'melancholic'],
      avoid: 'jump scares, horror narration, supernatural conclusions, and continuous lo-fi degradation',
    },
  ],
  group_chat_static: [
    {
      id: 'glitch_hop_thread',
      label: 'Glitch-Hop Thread',
      foundation: 'punchy conversational glitch hop',
      groove: 'hard syncopated kicks, crunchy bass and reply-shaped beat stops with a revealing switch',
      colors: ['short layered reply vocals', 'muted notification cut'],
      preferredSignals: ['tech', 'confrontational'],
    },
    {
      id: 'cross_talk_breaks',
      label: 'Cross-Talk Breaks',
      foundation: 'bass-heavy alternative rap breaks',
      groove: 'hard off-kilter drums and thick bass with rhythmically timed spoken interruptions',
      colors: ['filtered backing-voice fragments', 'dry bass-stop punctuation'],
      preferredSignals: ['absurd', 'intimate'],
      avoid: 'equal-volume lead voices, constant ad-libs, muddy low end, and dialogue that obscures the central hook',
    },
  ],
  public_meltdown: [
    {
      id: 'controlled_rage',
      label: 'Controlled Rage',
      foundation: 'high-impact rage rap',
      groove: 'hard kicks and aggressive 808 pressure from the opening, with explosive hook accents',
      colors: ['buzzing synth tension', 'single metal-impact payoff'],
      preferredSignals: ['high-energy', 'confrontational'],
    },
    {
      id: 'industrial_comedown',
      label: 'Industrial Comedown',
      foundation: 'industrial punk-rap',
      groove: 'heavy stomping half-time drums and grinding bass, with brief stops that amplify the next impact',
      colors: ['distorted mono synth', 'empty-room final decay'],
      preferredSignals: ['absurd', 'melancholic'],
      vocalDirection:
        'Tense, assertive rhythmic lead with shouted refrain accents over hard drums; keep the hook intelligible through the distortion.',
      avoid:
        'clipping that buries words, nonstop shouting, repeated impact effects, and a final section with no comedown',
    },
  ],
};

const INCOMPATIBLE_PAIRS: readonly (readonly [string, string])[] = [
  ['slow tempo', 'sturdy dance'],
  ['whisper rap', 'screaming vocals'],
  ['hushed', 'shouted'],
  ['sparse', 'wall of sound'],
  ['minimal', 'maximalist'],
];

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function detectStorySignals(value: string) {
  const normalized = value.trim();
  if (!normalized) return [];

  return (Object.entries(SIGNAL_PATTERNS) as [StorySignal, readonly RegExp[]][])
    .filter(([, patterns]) => patterns.some((pattern) => pattern.test(normalized)))
    .map(([signal]) => signal);
}

/** 根据新闻信号选择编辑风格；返回值只决定英文底层标签组合，不参与界面翻译。 */
export function recommendEditorialStyleId(value: string) {
  const signals = new Set(detectStorySignals(value));
  const has = (...items: StorySignal[]) => items.every((item) => signals.has(item));

  if (has('intimate', 'melancholic')) return 'apology_after_midnight';
  if (has('intimate', 'confrontational') || has('intimate', 'celebratory')) return 'velvet_rope_whisper';
  if (has('absurd', 'tech')) return 'algorithm_circus';
  if (has('mysterious', 'tech')) return 'internet_folklore';
  if (has('celebratory', 'high-energy')) return 'main_character_emergency';
  if (has('confrontational', 'tech')) return 'group_chat_static';
  if (has('tech', 'high-energy')) return 'timeline_fever';
  if (signals.has('confrontational')) return 'receipts_on_wax';
  if (signals.has('mysterious')) return 'newsroom_noir';
  if (signals.has('melancholic')) return 'apology_after_midnight';
  if (signals.has('celebratory')) return 'main_character_emergency';
  if (signals.has('absurd')) return 'algorithm_circus';
  if (signals.has('tech')) return 'timeline_fever';
  return 'newsroom_noir';
}

function selectVariant(
  profile: EditorialStyleProfile,
  variants: readonly ProductionVariant[],
  context: string,
  variantId?: string | null
) {
  const detectedSignals = detectStorySignals(context);
  const requestedVariant = variantId ? variants.find((variant) => variant.id === variantId) : undefined;
  if (requestedVariant) {
    return { detectedSignals, selected: requestedVariant };
  }

  const scored = variants.map((variant) => ({
    variant,
    score: variant.preferredSignals.filter((signal) => detectedSignals.includes(signal)).length,
  }));
  const bestScore = Math.max(...scored.map(({ score }) => score));
  const finalists = scored.filter(({ score }) => score === bestScore).map(({ variant }) => variant);
  const selected = finalists[stableHash(`${profile.id}:${context}`) % finalists.length] ?? variants[0];

  return { detectedSignals, selected };
}

export function validateProductionRecipe(recipe: DynamicProductionRecipe) {
  const issues: string[] = [];
  const fields = [recipe.foundation, recipe.groove, recipe.vocal, ...recipe.colors].join(' ').toLowerCase();

  if (!recipe.foundation.trim()) issues.push('Production recipe requires exactly one foundation.');
  if (!recipe.groove.trim()) issues.push('Production recipe requires exactly one groove.');
  if (recipe.colors.length !== 2 || recipe.colors.some((color) => !color.trim())) {
    issues.push('Production recipe requires exactly two sonic colors.');
  }
  if (new Set(recipe.colors.map((color) => color.toLowerCase())).size !== recipe.colors.length) {
    issues.push('Production recipe sonic colors must be unique.');
  }

  for (const [left, right] of INCOMPATIBLE_PAIRS) {
    if (fields.includes(left) && fields.includes(right)) {
      issues.push(`Incompatible production directions: ${left} + ${right}.`);
    }
  }

  return issues;
}

export function buildDynamicProductionRecipe({
  direction,
  storyContext = '',
  lyrics = '',
  variantId,
}: BuildDynamicProductionRecipeInput): DynamicProductionRecipe | null {
  const profile = resolveEditorialStyleProfile(direction) ?? CUSTOM_PRODUCTION_PROFILE;

  const variants = VARIANTS[profile.id];
  if (!variants || variants.length === 0) return null;

  const context = `${storyContext}\n${lyrics}`.trim();
  const { detectedSignals, selected } = selectVariant(profile, variants, context || profile.id, variantId);
  const recipe: DynamicProductionRecipe = {
    editorialStyleId: profile.id,
    editorialStyleLabel: profile.label,
    variantId: selected.id,
    variantLabel: selected.label,
    foundation: selected.foundation,
    groove: selected.groove,
    vocal: selected.vocalDirection || profile.vocalDirection,
    colors: selected.colors,
    arrangementArc: selected.arrangementArc || profile.arrangementArc,
    avoid: selected.avoid || profile.avoid,
    detectedSignals,
    matchedSignals: selected.preferredSignals.filter((signal) => detectedSignals.includes(signal)),
  };

  const issues = validateProductionRecipe(recipe);
  if (issues.length > 0) {
    throw new Error(`Invalid ScoopRYM production recipe (${profile.id}/${selected.id}): ${issues.join(' ')}`);
  }

  return recipe;
}

export function formatDynamicProductionRecipe(recipe: DynamicProductionRecipe) {
  return [
    `Editorial identity: ${recipe.editorialStyleLabel}.`,
    `Production variant: ${recipe.variantLabel}.`,
    `Foundation: ${recipe.foundation}.`,
    `Groove: ${recipe.groove}.`,
    `Vocal: ${recipe.vocal}.`,
    `Sonic colors: ${recipe.colors.join(' + ')}.`,
    `Arc: ${recipe.arrangementArc} ${ADAPTIVE_ARRANGEMENT_RULE}`,
    `Avoid: ${recipe.avoid}.`,
  ].join(' ');
}

export function getProductionVariantsForStyle(styleId: string) {
  if (styleId !== CUSTOM_PRODUCTION_PROFILE.id) getEditorialStyleProfileById(styleId);
  return VARIANTS[styleId] ?? [];
}

export function explainProductionRecipeSelection(recipe: DynamicProductionRecipe) {
  if (recipe.matchedSignals.length === 0) {
    return `A balanced ${recipe.editorialStyleLabel} treatment for this story.`;
  }

  const signals = recipe.matchedSignals
    .slice(0, 3)
    .map((signal) => signal.replace('-', ' '))
    .join(', ');
  return `Recommended for the story's ${signals} energy.`;
}
