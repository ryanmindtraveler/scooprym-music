import { ADAPTIVE_ARRANGEMENT_RULE, LEGACY_PRODUCTION } from './legacy-production';
/**
 * ScoopRYM 编辑风格层。
 *
 * 底层音乐标签负责告诉模型“怎么响”，编辑风格负责告诉模型
 * “用什么新闻镜头写、笑点落在哪里、Hook 应该如何记住”。
 */
import { LEGACY_VIBE_PERSONAS } from './legacy-vibes';

export interface EditorialStyleProfile {
  id: string;
  label: string;
  deck: string;
  icon: string;
  tags: readonly string[];
  bestFor: string;
  editorialLens: string;
  lyricCraft: string;
  productionSignature: string;
  vocalDirection: string;
  arrangementArc: string;
  avoid: string;
}

export const EDITORIAL_STYLE_PROFILES: readonly EditorialStyleProfile[] = [
  ...LEGACY_VIBE_PERSONAS.map(
    (preset): EditorialStyleProfile => ({
      id: preset.id,
      label: preset.label,
      deck: preset.desc,
      icon: preset.icon,
      tags: preset.tags,
      bestFor: preset.tooltip,
      editorialLens:
        'Let the verified event supply the joke and point of view. Do not invent facts, quotes or motives.',
      lyricCraft:
        'Create an event-native meme song with memorable phrasing and rhythmic delivery. Choose repetition only when it serves the joke.',
      productionSignature: `${preset.tooltip} Preserve the original sonic palette exactly: ${preset.tags.join(', ')}. Do not soften the selected drums, bass, tempo or vocal energy into a sparse, restrained reinterpretation.`,
      vocalDirection: `${LEGACY_PRODUCTION[preset.id].vocal} ${LEGACY_PRODUCTION[preset.id].guard}`,
      arrangementArc:
        'Establish the selected groove immediately; develop the story over that groove, lift the hook, and finish with a deliberate ending.',
      avoid:
        'unrequested genre substitution, weakening the selected groove, invented allegations, and singing production instructions',
    })
  ),
  {
    id: 'newsroom_noir',
    label: 'Newsroom Noir',
    deck: 'Breaking news, after dark',
    icon: '🗞️',
    tags: ['UK Drill', 'News Anchor', 'Cinematic String Stabs', 'Syncopated', 'Dramatic Hits', 'Dark', 'Anthemic'],
    bestFor: 'breaking stories, public reversals, and headlines with real stakes',
    editorialLens:
      'Open on one verifiable detail like a cold news bulletin, then reveal the contradiction underneath it. The event is the target; identities are not.',
    lyricCraft:
      'Foreground urgent cadence and deadpan news absurdity: clipped headline bars, sharp internal echoes and a concrete reversal. Do not force a sentimental bridge.',
    productionSignature:
      'Hard-hitting syncopated drill drums, sliding sub-bass and urgent string stabs; a short bulletin sting sets up a punchline-led hook. Keep the beat forceful while spacing out sound effects.',
    vocalDirection:
      'Punchy, articulate news-anchor flow with percussive consonants and deadpan attitude; sharpen the delivery at the headline twist.',
    arrangementArc:
      'Bulletin sting over an immediate kick -> driving investigative verse -> brief tension cut -> bass-forward headline hook -> short contrasting bridge -> decisive final hit.',
    avoid: 'constant sirens, stacked orchestral impacts, buried words, and a long beatless news introduction',
  },
  {
    id: 'public_receipts',
    label: 'Public Receipts',
    deck: 'Screenshots meet consequences',
    icon: '🧾',
    tags: ['Industrial Trap', 'Whisper Rap', 'Distorted Bass', 'Beat Switch', 'Record Scratch', 'Roast', 'Cringe'],
    bestFor: 'callouts, contradictions, leaked posts, and spectacular self-owns',
    editorialLens:
      'Build the song around the gap between the public claim and the visible receipt. Never invent a receipt, quote, or motive.',
    lyricCraft:
      'Foreground petty confidence and stop-start punchlines: terse receipts, percussive consonants and a devastating verdict. Rhyme densely where it sharpens the cross-examination, not to fill space.',
    productionSignature:
      'Punchy industrial drums and distorted sub-bass drive the receipts forward; whisper delivery rides a hard beat, not a quiet backing track. Use a record-stop at the factual turn and slam back into the verdict.',
    vocalDirection:
      'Confidential close-mic delivery in the verses, turning into clipped, fully intelligible rhythmic lines at the hook.',
    arrangementArc:
      'Whispered receipt over a hard mechanical beat -> bass tension climbs with each contradiction -> record-stop -> forceful verdict beat switch -> abrupt stop.',
    avoid: 'screaming throughout, glass-breaking spam, novelty warning sounds, and distortion that hides the words',
  },
  {
    id: 'algorithm_circus',
    label: 'Algorithm Circus',
    deck: 'The timeline lost the plot',
    icon: '🎪',
    tags: ['Circus Trap', 'Tuba Bass', 'Bouncy Rhythm', 'Cartoon Boing', 'Vocal Chops', 'Funny', 'Chaotic'],
    bestFor: 'absurd viral trends, platform spectacles, and harmless internet chaos',
    editorialLens:
      'Treat the timeline as a surreal public square where one tiny detail becomes enormous. Preserve the true event while exaggerating only the theatrical framing.',
    lyricCraft:
      'Foreground absurd imagery and rubber-band mouth-feel. Choose a comic chant, escalating scene or sudden deadpan reversal according to the event; neither rule-of-three nor call-and-response is mandatory.',
    productionSignature:
      'Spring-loaded circus-trap drums, bouncing tuba bass and elastic vocal chops; let a cartoon motif answer the actual punchline while the groove stays physical and propulsive.',
    vocalDirection:
      'Agile talk-singing with precise comic timing, crisp consonants, and short crowd answers only at the hook.',
    arrangementArc:
      'Carnival motif with an immediate bouncing kick -> rubber-band verse -> bass-heavy comic hook -> brief fake ending -> bigger final replay.',
    avoid: 'random soundboard collage, nonstop kazoo, childish vocal caricature, and jokes that overpower the groove',
  },
  {
    id: 'velvet_rope_whisper',
    label: 'Velvet-Rope Whisper',
    deck: 'Celebrity drama in close-up',
    icon: '🥂',
    tags: ['Sassy R&B', 'Gossip Tone', 'Pizzicato Strings', 'Snap Beat', 'Crowd Gasp', 'Vocal Chops', 'Petty'],
    bestFor: 'celebrity feuds, red-carpet tension, relationship news, and polished shade',
    editorialLens:
      'Observe the public performance around the story: the pause, the pose, the statement, and the detail everyone noticed. Attribute claims and protect private uncertainty.',
    lyricCraft:
      'Foreground petty attitude and quotable gossip phrasing: cheeky double meanings, syncopated conversational lines and an ear-catching phrase. Avoid solemn romance or explanatory narration.',
    productionSignature:
      'Bass-forward sassy R&B with crisp snaps, a syncopated kick and plucked-string jabs; rhythmic vocal chops turn the sharpest gossip phrase into a memorable refrain.',
    vocalDirection:
      'Intimate, poised talk-singing with controlled attitude, clean diction, and breathy doubles reserved for the sharpest phrase.',
    arrangementArc:
      'Close-up vocal over an immediate snap-and-bass groove -> bouncing gossip verse -> pizzicato tension -> bass-lifted chorus -> whispered beat-stop -> final rhythmic payoff.',
    avoid:
      'melismatic over-singing, buried consonants, constant crowd effects, and a background beat too weak to carry the attitude',
  },
  {
    id: 'receipts_on_wax',
    label: 'Receipts on Wax',
    deck: 'A roast with a paper trail',
    icon: '🎙️',
    tags: [
      '90s Boom Bap',
      'Chipmunk Soul',
      'Lyrical',
      'Hard Hitting Drums',
      'Record Scratch',
      'Vinyl Crackle',
      'Roast',
      'Based',
    ],
    bestFor: 'public boasts, reversals, rivalries, and quotable factual contradictions',
    editorialLens:
      'Cross-examine the public narrative using only supported details. Roast the contradiction, decision, or performance—not immutable traits.',
    lyricCraft:
      'Foreground dense internal and multisyllabic rhyme with swaggering setup-and-payoff bars. Build a sharp verdict or knockout final line; never sacrifice facts or the joke for rhyme.',
    productionSignature:
      'Hard-hitting boom-bap kick and snare, chunky bass and chopped soul answers; scratches land between punchlines and a forceful verdict hook gives the room a line to repeat.',
    vocalDirection:
      'Highly articulate, assertive rhythmic lead with internal-rhyme precision and sharply timed sample responses; punch through the drums without obscuring the story.',
    arrangementArc:
      'Dusty sample cold open -> evidence-heavy verse -> scratch punctuation -> compact verdict chorus -> half-time bridge -> final ruling.',
    avoid:
      'air-horn clutter, clipping that hides words, modern trap hi-hat overload, and punchlines without factual setup',
  },
  {
    id: 'apology_after_midnight',
    label: 'Apology After Midnight',
    deck: 'Soft focus, hard questions',
    icon: '🌧️',
    tags: [
      'Emo Rap',
      'Sad Guitar',
      'Emotional Vocals',
      'Slow Tempo',
      'Rain Sounds',
      'Telephone Effect',
      'Crowd Gasp',
      'Heartbreak',
    ],
    bestFor: 'notes-app apologies, public regret, breakups, exits, and reputation fallout',
    editorialLens:
      'Hold the polished apology beside the unresolved consequence. Leave room for ambiguity instead of declaring guilt or sincerity.',
    lyricCraft:
      'Foreground a melodic earworm and an event-specific emotional or ironic contrast. Use intimate objects and a phrase whose meaning turns; neither rapid-fire rap nor an explosive drop is required.',
    productionSignature:
      'Close-mic melodic vocal and an ear-catching sad-guitar loop over a deep 808 heartbeat and crisp half-time snare. Preserve the slow tempo; create meme tension through a memorable melodic turn and the contrast between apology and consequence.',
    vocalDirection:
      'Vulnerable but intelligible melodic lead, conversational in the verse and opening into a memorable emotional refrain without theatrical sobbing.',
    arrangementArc:
      'Brief telephone-filtered confession -> guitar and half-time drums enter together -> aching melodic hook with a bass lift -> short exposed phrase -> unresolved final return.',
    avoid:
      'full-song rain ambience, theatrical sobbing, oversized power-ballad drums, and declaring whether the apology is sincere',
  },
  {
    id: 'main_character_emergency',
    label: 'Main-Character Alert',
    deck: 'A spectacle built to loop',
    icon: '🚨',
    tags: [
      'Jersey Club',
      'Layered Harmonies',
      'Sturdy Dance',
      'Bass Drop',
      'Live Studio Audience',
      'Vocal Chops',
      'Party',
      'Anthemic',
    ],
    bestFor: 'viral entrances, stunts, fashion moments, celebrations, and attention-grabbing spectacle',
    editorialLens:
      'Frame the public moment as choreography: entrance, reaction, replay, and aftermath. Keep the tone exhilarating without manufacturing stakes.',
    lyricCraft:
      'Foreground dance momentum and an addictive vocal phrase: short kinetic lines and physical verbs. Keep the chant easy to imitate; dense exposition and intricate rhyme are not required.',
    productionSignature:
      'Hard-kicking fast Jersey-club triplets, heavy sub-bass drops and tightly chopped vocal calls; make the dance groove recognizable immediately and keep the hook physically propulsive.',
    vocalDirection:
      'Bright rhythmic lead with compact phrases, confident diction, and group answers that reinforce rather than compete with the hook.',
    arrangementArc:
      'Immediate movement cue -> footwork verse -> tension cut -> chant-ready drop when present in the lyrics -> brief transition -> decisive final payoff.',
    avoid:
      'continuous bass drops, bed-squeak overuse, long sung lines, and festival-scale production that loses the meme-sized focus',
  },
  {
    id: 'timeline_fever',
    label: 'Timeline Fever',
    deck: 'Too online to look away',
    icon: '📱',
    tags: [
      'Hyperpop',
      'Robotic Vocals',
      'Digital Blip',
      'Fast Tempo',
      'Discord Ping',
      'Stutter',
      'Futuristic',
      'Manic Energy',
    ],
    bestFor: 'platform frenzies, fandom wars, tech hype, and rapidly mutating memes',
    editorialLens:
      'Follow how the story mutates as people repost, remix, and overreact. Separate the original fact from the internet amplification.',
    lyricCraft:
      'Foreground manic pace and digital mouth-feel: compressed images, crisp syllables and source-specific stutters or vocal fragments. Use notification language only if the event warrants it.',
    productionSignature:
      'Fast hyperpop with hard digital kicks, elastic distorted bass and a pixel-bright melodic hook. Rhythmic stutters and brief dropouts punctuate the news escalation without weakening the dance pulse.',
    vocalDirection:
      'Agile lead with expressive robotic doubles, rapid but understandable phrasing, and a clear melodic hook above the digital chaos.',
    arrangementArc:
      'Notification spark -> accelerating verse -> one-bar digital dropout -> melodic hyperpop chorus -> corrupted bridge -> cleaner final hook.',
    avoid:
      'constant bitcrushing, multiple competing notification sounds, unintelligible speed, and synthetic effects on every vocal line',
  },
  {
    id: 'internet_folklore',
    label: 'Internet Folklore',
    deck: 'A rumor enters the archive',
    icon: '📼',
    tags: [
      'Dark Phonk',
      'Haunting Synth',
      'Whisper Rap',
      'Hypnotic Loop',
      'Gong',
      'Tape Hiss',
      'Creepy',
      'Lo-Fi Horror',
    ],
    bestFor: 'mysteries, eerie coincidences, strange sightings, and unresolved viral lore',
    editorialLens:
      'Tell only what is observed, reported, or unknown. Make uncertainty the atmosphere rather than filling the gaps with invented answers.',
    lyricCraft:
      'Foreground hypnotic memory and strange event-specific imagery: sensory details, uncanny phrasing or a deadpan unresolved payoff. Do not force speed, shouting or a comedic chorus into every mystery.',
    productionSignature:
      'Hypnotic dark phonk with a deep rolling sub-bass, weighty kick and a haunting motif that sticks after one listen. Keep the low-tempo tension physical; one gong or tape interruption marks the unknown.',
    vocalDirection:
      'Close, low-intensity whisper-melodic lead with calm diction; use distance and doubles only when uncertainty deepens.',
    arrangementArc:
      'Tape hiss and lone motif -> hypnotic verse -> gong marks the unanswered turn -> hollow refrain -> suspended ending without resolution.',
    avoid: 'jump-scare impacts, horror narration, constant cowbell distortion, and invented supernatural conclusions',
  },
  {
    id: 'group_chat_static',
    label: 'Group-Chat Static',
    deck: 'Everyone is talking at once',
    icon: '💬',
    tags: ['Glitch Hop', 'Layered Harmonies', 'Syncopated', 'Beat Switch', 'Ad-libs', 'Stutter', 'Chaotic', 'Unhinged'],
    bestFor: 'multi-person feuds, fandom arguments, chaotic interviews, and crossed public messages',
    editorialLens:
      'Stage the verified public positions as overlapping voices, then let the chorus reveal what the argument is really about.',
    lyricCraft:
      'Foreground distinct comic attitudes and rhythmic conversation: concise replies, interruptions and a quotable exchange grounded in the public facts. Echo only when it improves the exchange.',
    productionSignature:
      'Punchy syncopated glitch-hop drums and crunchy bass underpin distinct rhythmic replies; beat stops, stutters and a group response make the argument audible without masking the lead.',
    vocalDirection:
      'One clear anchor lead surrounded by distinct short backing reactions; interruptions must remain rhythmically placed and intelligible.',
    arrangementArc:
      'Single-message opening -> replies accumulate -> beat switch reveals the core dispute -> everyone joins one hook -> notifications cut out.',
    avoid:
      'multiple lead voices at equal volume, constant ad-libs, muddy low end, and dialogue that obscures the song’s central point',
  },
  {
    id: 'public_meltdown',
    label: 'Public Meltdown',
    deck: 'The composure left the chat',
    icon: '💥',
    tags: [
      'Rage Beats',
      'Screaming Vocals',
      'Aggressive 808s',
      'Beat Switch',
      'Metal Pipe Falling',
      'Distorted',
      'High Energy',
      'Aggressive',
    ],
    bestFor: 'live blowups, disastrous launches, chaotic confrontations, and events that collapse in public',
    editorialLens:
      'Reconstruct the escalation beat by beat and let the loss of control become the dramatic arc. Satirize the public behavior, not the person’s identity.',
    lyricCraft:
      'Foreground explosive attitude and percussive phrasing from the first line. Shorten bars as the scene escalates into a blunt payoff; maintain intelligibility without smoothing away the anger.',
    productionSignature:
      'Hard-kicking rage drums, aggressive 808s and buzzing synth riffs establish energy immediately. Escalate into an explosive shouted hook; use a brief contrast for impact rather than withholding the beat until the chorus.',
    vocalDirection:
      'Controlled tense verse delivery that escalates into a short barked hook, with every key line remaining clearly understandable.',
    arrangementArc:
      'Buzzing riff and hard kick immediately -> pressure-building verse -> brief beat rupture -> explosive bass-heavy hook -> short exposed line -> final hit and comedown.',
    avoid:
      'clipping that buries the hook, nonstop screaming, repeated metal-pipe effects, and an ending with no dynamic release',
  },
] as const;

function normalizedParts(direction: string) {
  return new Set(
    direction
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function getEditorialStyleProfileById(id: string) {
  const profile = EDITORIAL_STYLE_PROFILES.find((item) => item.id === id);
  if (!profile) {
    throw new Error(`Unknown ScoopRYM editorial style: ${id}`);
  }
  return profile;
}

export function resolveEditorialStyleProfile(direction: string) {
  const parts = normalizedParts(direction);
  return EDITORIAL_STYLE_PROFILES.find((profile) => profile.tags.every((tag) => parts.has(tag.toLowerCase())));
}

export function buildEditorialStyleBrief(direction: string) {
  const profile = resolveEditorialStyleProfile(direction);
  if (!profile) return '';

  return [
    `Editorial cut: ${profile.label}.`,
    `Best suited to ${profile.bestFor}.`,
    `Story lens: ${profile.editorialLens}`,
    `Lyric craft: ${profile.lyricCraft}`,
    `Production signature: ${profile.productionSignature}`,
    `Vocal direction: ${profile.vocalDirection}`,
    `Arrangement arc: ${profile.arrangementArc} ${ADAPTIVE_ARRANGEMENT_RULE}`,
    `Avoid: ${profile.avoid}.`,
  ].join(' ');
}

export function buildEditorialProductionBrief(direction: string) {
  const profile = resolveEditorialStyleProfile(direction);
  if (!profile) return '';

  return [
    `Editorial cut: ${profile.label}.`,
    profile.productionSignature,
    `Vocal: ${profile.vocalDirection}`,
    `Arc: ${profile.arrangementArc} ${ADAPTIVE_ARRANGEMENT_RULE}`,
    `Avoid: ${profile.avoid}.`,
  ].join(' ');
}
