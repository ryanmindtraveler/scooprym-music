/**
 * ScoopRYM 编辑风格层。
 *
 * 底层音乐标签负责告诉模型“怎么响”，编辑风格负责告诉模型
 * “用什么新闻镜头写、笑点落在哪里、Hook 应该如何记住”。
 */
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
      'Use clipped, cinematic lines and a chorus built around the headline twist. Let the bridge briefly drop the jokes and expose the human consequence.',
    productionSignature:
      'Tense drill pulse, restrained bulletin textures, urgent transitions, and a chorus that expands without becoming trailer music.',
    vocalDirection:
      'Dry, articulate mid-register lead with controlled urgency; use the anchor tone as framing, never as a comic impersonation.',
    arrangementArc:
      'Cold bulletin sting -> sparse investigative verse -> rising pre-chorus pressure -> widescreen hook -> stripped human bridge -> decisive final hook.',
    avoid: 'constant sirens, movie-trailer bombast, shouted delivery, and stacked orchestral impacts',
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
      'Use escalating evidence-shaped images, terse setups, and one devastatingly simple hook. Keep the wit precise rather than merely loud.',
    productionSignature:
      'Mechanical percussion and controlled distortion, with impact effects used only at factual turn points and a sharply gated final stop.',
    vocalDirection:
      'Confidential close-mic delivery in the verses, turning into clipped, fully intelligible rhythmic lines at the hook.',
    arrangementArc:
      'Whispered receipt reveal -> percussion accumulates with each contradiction -> one clean beat switch before the verdict hook -> abrupt stop.',
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
      'Write visual punchlines, rule-of-three escalation, and a compact call-and-response hook. Avoid random meme-word soup.',
    productionSignature:
      'Tightly arranged circus-trap with playful negative space; one recurring comic motif should become part of the hook.',
    vocalDirection:
      'Agile talk-singing with precise comic timing, crisp consonants, and short crowd answers only at the hook.',
    arrangementArc:
      'Tiny carnival motif -> bouncy verse with open space -> motif mutates into the chorus -> brief fake ending -> bigger final replay.',
    avoid: 'random soundboard collage, nonstop kazoo, childish vocal caricature, and jokes that overpower the groove',
  },
  {
    id: 'velvet_rope_whisper',
    label: 'Velvet-Rope Whisper',
    deck: 'Celebrity drama in close-up',
    icon: '🥂',
    tags: [
      'Sassy R&B',
      'Gossip Tone',
      'Pizzicato Strings',
      'Snap Beat',
      'Crowd Gasp',
      'Vocal Chops',
      'Petty',
      'Chillwide',
    ],
    bestFor: 'celebrity feuds, red-carpet tension, relationship news, and polished shade',
    editorialLens:
      'Observe the public performance around the story: the pause, the pose, the statement, and the detail everyone noticed. Attribute claims and protect private uncertainty.',
    lyricCraft:
      'Favor elegant double meanings, conversational phrasing, and a hook that sounds like the line the group chat repeats tomorrow.',
    productionSignature:
      'Glossy but sparse R&B, poised lead vocal, pizzicato punctuation, dry snaps, and a chorus that opens like flashbulbs.',
    vocalDirection:
      'Intimate, poised talk-singing with controlled attitude, clean diction, and breathy doubles reserved for the sharpest phrase.',
    arrangementArc:
      'Velvet-close intro -> minimal snap verse -> pizzicato tension -> flashbulb-wide chorus -> whispered bridge -> polished final chorus.',
    avoid: 'melismatic over-singing, cartoon gossip voices, dense trap drums, and crowd effects outside the reveal',
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
      'Use internal rhyme, controlled setup-and-payoff bars, and a chorus with one repeatable verdict. Every punchline must advance the story.',
    productionSignature:
      'Dusty boom-bap authority, crisp diction, selective scratches, and a final chorus that feels like the room reached a verdict.',
    vocalDirection:
      'Highly articulate rhythmic lead with measured confidence, internal-rhyme precision, and restrained sample responses.',
    arrangementArc:
      'Dusty sample cold open -> evidence-heavy verse -> scratch punctuation -> compact verdict chorus -> half-time bridge -> final ruling.',
    avoid: 'air-horn clutter, aggressive shouting, modern trap hi-hat overload, and punchlines without factual setup',
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
      'Use intimate objects, unanswered questions, and a chorus whose repeated phrase changes emotional meaning on its return.',
    productionSignature:
      'Close-mic melodic vocal, rain-soft guitar, telephone-colored intro, restrained trap drums, and a bruised final lift.',
    vocalDirection:
      'Fragile but intelligible melodic lead, conversational in the verse and opening into a restrained emotional chorus.',
    arrangementArc:
      'Telephone-filtered confession -> dry guitar verse -> drums enter late -> aching chorus -> near-silent bridge -> unresolved final return.',
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
    lyricCraft: 'Use short kinetic lines, physical verbs, and a hook that works as both caption and crowd chant.',
    productionSignature:
      'Fast Jersey-club propulsion, clean vocal chops, a recognizable rhythmic hook, and a bass-drop payoff designed for replay.',
    vocalDirection:
      'Bright rhythmic lead with compact phrases, confident diction, and group answers that reinforce rather than compete with the hook.',
    arrangementArc:
      'Immediate movement cue -> footwork verse -> tension cut -> chant-ready drop chorus -> eight-bar reset -> larger final loop.',
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
      'Use compressed imagery, recurring notification language, and a hook that feels contagious while remaining intelligible.',
    productionSignature:
      'Bright glitch-pop velocity, precise digital ear candy, sudden dropouts, and a coherent melodic center beneath the chaos.',
    vocalDirection:
      'Clean agile lead with restrained robotic doubles, rapid but understandable phrasing, and one human-sounding chorus center.',
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
      'Use recurring objects, sensory details, and an unresolved refrain that returns like a corrupted memory.',
    productionSignature:
      'Tape-worn phonk, shadowed low end, sparse haunting synths, and suspense created through omission rather than constant effects.',
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
      'Use distinct vocal attitudes, interruptions, and echo phrases while preserving one clear narrator and one memorable hook.',
    productionSignature:
      'Layered ad-libs around an intelligible lead, crunchy low end, selective call-and-response, and controlled conversational chaos.',
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
      'Start controlled, shorten the lines as pressure rises, and release into a blunt cathartic hook. Preserve clarity inside the noise.',
    productionSignature:
      'Rage synth pressure with disciplined dynamics, a rising pre-chorus, one explosive hook, and a hard comedown after the final hit.',
    vocalDirection:
      'Controlled tense verse delivery that escalates into a short barked hook, with every key line remaining clearly understandable.',
    arrangementArc:
      'Contained buzzing intro -> pressure-building verse -> sudden beat rupture -> explosive hook -> empty-space bridge -> final hit and comedown.',
    avoid:
      'full-volume distortion from the first bar, nonstop screaming, repeated metal-pipe effects, and an ending with no dynamic release',
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
    `Arrangement arc: ${profile.arrangementArc}`,
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
    `Arc: ${profile.arrangementArc}`,
    `Avoid: ${profile.avoid}.`,
  ].join(' ');
}
