/** 旧版标签不变，仅明确标签的角色，避免把人声、节奏误作音色。 */
export const LEGACY_PRODUCTION: Record<
  string,
  { foundation: string; colors: readonly [string, string]; vocal: string; guard: string }
> = {
  news: {
    foundation: 'UK drill',
    colors: ['short news bulletin sting', 'brief cinematic siren accent'],
    vocal: 'Percussive deadpan news-anchor rap over hard drill drums.',
    guard: 'News Intro Theme means a short sting under immediate vocals, not a long instrumental introduction.',
  },
  karen: {
    foundation: 'industrial trap',
    colors: ['distorted bass', 'glass-shatter accent'],
    vocal: 'Explosive shouted phrases with intelligible lead words and audible breathing gaps.',
    guard: 'Use warning and shatter effects at punchlines, not continuously under every bar.',
  },
  satire: {
    foundation: 'circus trap',
    colors: ['kazoo motif', 'slide-whistle answer'],
    vocal: 'Bouncy comic talk-rap with elastic syllables.',
    guard:
      'Goofy Ahh Beat describes comic attitude, not a separate genre. Boing accents answer the scene; do not run every novelty instrument continuously.',
  },
  gossip: {
    foundation: 'sassy R&B',
    colors: ['pizzicato strings', 'rhythmic vocal chops'],
    vocal: 'Petty close-mic rhythmic singing with crisp snap-beat phrasing.',
    guard:
      'What The Hell describes an incredulous attitude; do not insert or sing that phrase unless it is in the supplied lyrics.',
  },
  diss: {
    foundation: '90s boom bap',
    colors: ['record-scratch punctuation', 'brief air-horn accent'],
    vocal: 'Aggressive, articulate battle-rap flow with dense internal rhyme where appropriate.',
    guard: 'Vine Boom, air horn and crowd gasp are optional accent alternatives, not a simultaneous soundboard loop.',
  },
  emo: {
    foundation: 'melodic emo trap',
    colors: ['sad guitar loop', 'telephone-filtered pickup'],
    vocal: 'Melodic emotional lead with a memorable refrain and clear consonants.',
    guard:
      'Rain and reverb must not wash out the drums. Fake Apology is a theatrical format, not a factual assertion that someone is lying.',
  },
  club: {
    foundation: 'Jersey club',
    colors: ['rhythmic bed-squeak motif', 'tight vocal chops'],
    vocal: 'Short, buoyant rhythmic calls locked to the fast kick pattern.',
    guard: 'Keep the heavy bass drop and dance pulse; bed squeaks must support the rhythm, not crowd out the hook.',
  },
  crypto: {
    foundation: 'hyperpop with glitchcore accents',
    colors: ['arpeggiated synth', 'coin-sound motif'],
    vocal: 'Characterful NPC-like delivery with a clearly intelligible anchor phrase.',
    guard:
      'Coin and Discord sounds punctuate the event; never require a coin reference in lyrics for an unrelated story.',
  },
  mystery: {
    foundation: 'dark Memphis-influenced phonk',
    colors: ['distorted cowbell motif', 'haunting synth'],
    vocal: 'Dark rhythmic Memphis-style delivery with clear key phrases.',
    guard:
      'Tape hiss is background texture, not a reason to obscure the vocal. Preserve reported uncertainty rather than inventing supernatural facts.',
  },
  mumble: {
    foundation: 'SoundCloud mumble rap',
    colors: ['heavy auto-tune color', 'deep-fried bass'],
    vocal: 'Hazy triplet-flow verses and playful ad-libs; keep the central phrase clear enough to repeat.',
    guard:
      'Mumble is a vocal texture, not permission to lose every word. Do not stack VHS degradation and distortion until the hook disappears.',
  },
  rage: {
    foundation: 'rage rap',
    colors: ['buzzing synth riff', 'brief metal-impact accent'],
    vocal: 'High-energy percussive rap; shouting is optional, not required throughout.',
    guard:
      'Bass boosting must preserve kick attack and vocal clarity. Metal Pipe Falling is an accent, never a lyric instruction.',
  },
};

export const ADAPTIVE_ARRANGEMENT_RULE =
  'Arrangement arcs are optional energy sketches, not mandatory section lists. Follow the supplied lyrics and selected meme strategy; omit absent choruses, bridges, resets and repeats. Never add unwritten lyric loops or reveal a protected final punchline early.';
