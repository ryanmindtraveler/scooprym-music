export interface StyleTag {
  label: string;
  desc: string;
}

export interface StyleCategory {
  id: string;
  title: string;
  description: string;
  tags: StyleTag[];
}

export const MUSIC_STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: 'structure',
    title: '1. Musical Genre',
    description: 'The foundation. Choose the beat pattern and rhythm style.',
    tags: [
      { label: 'UK Drill', desc: 'Aggressive, sliding basslines, dark' },
      { label: 'Trap Rhythm', desc: 'Sharp snares, fast hi-hats, club ready' },
      { label: 'Old School Hip Hop', desc: 'Classic 90s boom bap flow' },
      { label: 'Boom Bap', desc: 'Hard hitting drums, sample based' },
      { label: 'Drift Phonk', desc: 'High distortion, cowbells, driving' },
      { label: 'Jersey Club', desc: 'Fast, repetitive triplets, bed squeaks' },
      { label: 'G-Funk', desc: 'Laid back West Coast groove' },
      { label: 'R&B', desc: 'Smooth, melodic, emotional' },
      { label: 'Emo Rap', desc: 'Sad, melodic, guitar-driven trap' },
      { label: 'Cloud Rap', desc: 'Hazy, dreamlike, lo-fi aesthetics' },
      { label: 'Rage Beats', desc: 'Synthesized, chaotic, high energy' },
      { label: 'Mumble Rap', desc: 'Slurred, triplet flow, vibe-focused' },
      { label: 'Dark Trap', desc: 'Ominous, heavy bass, minor key' },
      { label: 'Horrorcore', desc: 'Dark, eerie, aggressive themes' },
      { label: 'Hyperpop', desc: 'Fast, high-pitched, synthetic, chaotic' },
      { label: 'Glitch Hop', desc: 'Digital distortion, stuttering beats' },
      { label: 'Acoustic Trap', desc: 'Plucky guitar/strings with 808s' },
      { label: 'Goofy Ahh Beat', desc: 'Cartoonish, silly, viral sound' },
      { label: 'Synth-Pop', desc: 'Commercial, catchy, tech-news vibe' },
      { label: 'Phonk', desc: 'Gritty, lo-fi, screwed vocals' },
      { label: 'Vocal House', desc: 'Glamorous, runway style, club beat' },
      { label: 'Lo-Fi Hip Hop', desc: 'Relaxed, nostalgic, study beats' },
      { label: 'Dark Ambient', desc: 'Eerie, athletic horror texture' },
      { label: 'West Coast Hip Hop', desc: 'Bounce, sunshine, cruising' },
      { label: 'Modern Pop', desc: 'Contemporary radio-friendly sound' },
      { label: 'Melodic Trap', desc: 'Hybrid of rap beats and singing' },
    ],
  },
  {
    id: 'voice',
    title: '2. Voice Character',
    description: 'Defines who is rapping or singing.',
    tags: [
      { label: 'Deep Voice', desc: 'Low, resonant vocal tone' },
      { label: 'Sassy', desc: 'Expressive, bold attitude' },
      { label: 'Female Vocals', desc: 'Clear, melodic female tone' },
      { label: 'Coin Sound', desc: 'Mario-style coin collection sfx' },
      { label: 'Glass Break', desc: 'Shattering sound effect' },
      { label: 'Screaming Vocals', desc: 'Aggressive, metal-influenced rage' },
      { label: 'Memphis Vocals', desc: 'Lo-fi, chopped, phonk style' },
      { label: 'Auto-Tune', desc: 'Pitch-corrected, robotic effect' },
      { label: 'Fast Flow', desc: 'Rapid-fire, impressive rapping' },
      { label: 'Ad-libs', desc: 'Background shouts, hype vocals' },
      { label: 'Chopped Vocals', desc: 'Stuttering, rhythmic vocal cuts' },
      { label: 'Vocal Chops', desc: 'Pitched up/down vocal samples' },
      { label: 'Spoken Word', desc: 'Narrative, no melody' },
      { label: 'Whisper Rap', desc: 'Quiet, intense, ASMR style' },
      { label: 'News Anchor', desc: 'Professional, reliable tone' },
      { label: 'Gang Vocals', desc: 'Group shouting, raw energy' },
      { label: 'Layered Harmonies', desc: 'Thick, produced vocal stacks' },
      { label: 'Live Studio Audience', desc: 'Cheering, clapping, reactions' },
      { label: 'Goofy', desc: 'High-energy, silly, comedic style' },
      { label: 'Telephone Effect', desc: 'Lo-fi EQ filter on vocals' },
      { label: 'Male Vocals', desc: 'Clear, resonant male vocal tone' },
      { label: 'No Vocals', desc: 'Instrumental only' },
    ],
  },
  {
    id: 'mood',
    title: '3. Mood & Atmosphere',
    description: 'Determines emotional color and theme.',
    tags: [
      { label: 'Aggressive', desc: 'In-your-face, confrontational' },
      { label: 'Funny', desc: 'Comedic, lighthearted, parody' },
      { label: 'Dark', desc: 'Ominous, shadowy, evil' },
      { label: 'Emotional', desc: 'Heartfelt, sad, touching' },
      { label: 'High Energy', desc: 'Intense, pumping, workout' },
      { label: 'Roast', desc: 'Mocking, sharp, biting' },
      { label: 'Gangsta Rap', desc: 'Tough, street credibility' },
      { label: 'Moshing', desc: 'Violent movement, chaotic' },
      { label: 'Laid Back', desc: 'Chill, reclining, easygoing' },
      { label: 'Creepy', desc: 'Unsettling, scary, weird' },
      { label: 'Light Tension', desc: 'Sneaky, curious, drama-building' },
      { label: 'Fast Tempo', desc: 'Rapid, driving energy' },
      { label: 'Slow Tempo', desc: 'Dragging, heavy, sluggish' },
      { label: 'Upbeat', desc: 'Happy, party vibes' },
      { label: 'Dance', desc: 'Groovy, makes you move' },
      { label: 'Repetitive', desc: 'Hypnotic, loop-focused' },
      { label: 'Chillwide', desc: 'Wide stereo, cinematic relaxation' },
      { label: 'Anthemic', desc: 'Big sound, stadium feel' },
      { label: 'Catchy Hook', desc: 'Memorable, earworm melody' },
      { label: 'Chaotic', desc: 'Unpredictable, overwhelming' },
    ],
  },
  {
    id: 'instrument',
    title: '4. Sound & Production',
    description: 'Key sounds that define the track.',
    tags: [
      { label: '808 Slides', desc: 'Bending sub-bass notes' },
      { label: 'Heavy Bass', desc: 'Thumping low-end' },
      { label: 'Sliding 808', desc: 'Pitch-gliding sub-bass' },
      { label: 'Distorted 808s', desc: 'Fuzzy, aggressive bass' },
      { label: 'Cowbell', desc: 'Metallic, harsh phonk rhythm' },
      { label: 'Record Scratch', desc: 'DJ scratch, rewind effect' },
      { label: 'Bed Squeak', desc: 'Rhythmic squeaking sample' },
      { label: 'Police Sirens', desc: 'Urgent, warning, chaos' },
      { label: 'Tuba', desc: 'Low, comedic brass hits' },
      { label: 'Sad Guitar', desc: 'Melancholic acoustic or electric riffs' },
      { label: 'Haunting Synth', desc: 'Ghostly, atmospheric pads' },
      { label: 'Synthesizer Whine', desc: 'High-pitched G-Funk lead' },
      { label: 'Orchestral Hits', desc: 'Sudden, dramatic impacts' },
      { label: 'Orchestral Stabs', desc: 'Sharp, dramatic tutti hits' },
      { label: 'Pizzicato Strings', desc: 'Sneaky, short plucked strings' },
      { label: 'Cartoon Sfx', desc: 'Boings, whistles, splats' },
      { label: 'Circus Melody', desc: 'Carnival music riffs' },
      { label: 'Hard Hitting', desc: 'Punchy drums and kicks' },
      { label: 'Synthesizer', desc: 'Electronic leads and pads' },
      { label: 'Deep 808s', desc: 'Clean, low sub-bass' },
      { label: 'Stutter', desc: 'Rhythmic audio chopping' },
      { label: 'Syncopated', desc: 'Off-beat, groovy rhythm' },
      { label: 'Glitch', desc: 'Digital error sfx, malfunctions' },
      { label: 'Breakbeat', desc: 'Syncopated drum loops' },
      { label: 'Arpeggiator', desc: 'Fast, cycling synth notes' },
      { label: 'Beat Switch', desc: 'Sudden change in tempo/rhythm' },
      { label: 'Vinyl Crackle', desc: 'Lo-fi retro noise floor' },
      { label: 'Digital Blip', desc: '8-bit computer sounds' },
      { label: 'Bass Drop', desc: 'Building tension into heavy bass' },
      { label: 'Funky Guitar', desc: 'Wah-wah or clean rhythmic chops' },
      { label: 'Rain', desc: 'Ambient rainfall texture' },
      { label: 'Whistle', desc: 'Catchy melodic whistling' },
    ],
  },
];

export const DEFAULT_CUSTOM_VIBE_PROMPT = 'Trap Rhythm, Goofy Ahh Beat, Funny, Catchy Hook, Fast Tempo, Ad-libs';

export const VIBE_PERSONAS = [
  {
    id: 'viral_pop',
    label: 'Custom Vibe',
    desc: 'Create your own',
    icon: '🍿',
    color: 'bg-slate-50 dark:bg-white/5 border-dashed border-slate-200 dark:border-white/10',
    tags: DEFAULT_CUSTOM_VIBE_PROMPT.split(', '),
  },
  {
    id: 'news',
    label: 'Breaking Trap',
    desc: 'Urgent Flash',
    icon: '🔥',
    tags: ['UK Drill', 'Deep Voice', 'Aggressive', 'Police Sirens', 'Sliding 808', 'Orchestral Stabs', 'Fast Tempo', 'Gang Vocals'],
    color: 'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/50',
    tooltip: 'High-energy UK Drill with sliding 808s and orchestral stabs for urgent news.',
  },
  {
    id: 'gossip',
    label: 'Spill The Tea',
    desc: 'Celeb Drama',
    icon: '☕',
    tags: ['R&B', 'Sassy', 'Pizzicato Strings', 'Vocal Chops', 'Light Tension', 'Female Vocals', 'Telephone Effect', 'Syncopated'],
    color:
      'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/50',
    tooltip: 'Sassy R&B vibes with pizzicato strings and vocal chops for drama and tea.',
  },
  {
    id: 'satire',
    label: 'Clown World',
    desc: 'Goofy & Weird',
    icon: '🤡',
    tags: ['Goofy Ahh Beat', 'Cartoon Sfx', 'Trap Rhythm', 'Tuba', 'Fast Tempo', 'Funny', 'Circus Melody', 'Stutter', 'Goofy'],
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/50',
    tooltip: 'Exaggerated, goofy sounds with cartoon SFX and tuba for absurd satire.',
  },
  {
    id: 'club',
    label: 'Club Banger',
    desc: 'Viral Dance',
    icon: '🪩',
    tags: ['Jersey Club', 'Bed Squeak', 'Heavy Bass', 'Chopped Vocals', 'Fast Tempo', 'Upbeat', 'Dance', 'Triplet Flow', 'Bass Drop'],
    color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/50',
    tooltip: 'Fast-paced Jersey Club with bed squeaks and bass drops for viral loops.',
  },
  {
    id: 'karen',
    label: 'Karen Alert',
    desc: 'Manager Plz',
    icon: '🤬',
    tags: [
      'Trap Rhythm',
      'Orchestral Hits',
      'Screaming Vocals',
      'Police Sirens',
      'Fast Tempo',
      'Glass Break',
      'Aggressive',
      'Chaotic',
    ],
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/50',
    tooltip: 'Tense, frantic plucked strings for public freakouts and entitlement.',
  },
  {
    id: 'diss',
    label: 'Diss Master',
    desc: 'Ruthless Roast',
    icon: '🎤',
    tags: ['Boom Bap', 'Live Studio Audience', 'Aggressive', 'Record Scratch', 'Fast Flow', 'Roast', 'Hard Hitting', 'Breakbeat'],
    color: 'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50',
    tooltip: 'Aggressive Boom Bap with record scratches and fast flow for roasting.',
  },
  {
    id: 'crypto',
    label: 'Crypto God',
    desc: 'To The Moon',
    icon: '🚀',
    tags: ['Hyperpop', 'Glitch Hop', 'Auto-Tune', 'Digital Blip', 'Fast Tempo', 'Coin Sound', 'High Energy', 'Glitch', 'Arpeggiator'],
    color:
      'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/50',
    tooltip: 'Glitchy Hyperpop with digital blips and arps for volatile crypto hype.',
  },
  {
    id: 'mystery',
    label: 'Analog Horror',
    desc: 'Urban Legends',
    icon: '📼',
    tags: ['Horrorcore', 'Dark Trap', 'Haunting Synth', 'Heavy 808', 'Creepy', 'Whisper Rap', 'Aggressive', 'Tape Hiss', 'Dark Ambient'],
    color: 'bg-purple-600/10 text-purple-700 border-purple-600/20 hover:bg-purple-600/20 hover:border-purple-600/50',
    tooltip: 'Creepy, lo-fi horror vibes with tape hiss and haunting synths.',
  },
  {
    id: 'mumble',
    label: 'Mumble God',
    desc: 'Incoherent Hype',
    icon: '💊',
    tags: ['Mumble Rap', 'Auto-Tune', 'Trap', 'Ad-libs', 'Cloud Rap', 'Repetitive', 'Synthesizer', 'Deep 808s'],
    color: 'bg-violet-500/10 text-violet-700 border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-500/50',
    tooltip: 'Blurred, auto-tuned Cloud Rap with layered harmonies for vibe-only moments.',
  },
  {
    id: 'rage',
    label: 'Rage Mode',
    desc: 'Opium Vibe',
    icon: '🦇',
    tags: ['Rage Beats', 'Distorted 808s', 'Screaming Vocals', 'Synthesizer', 'High Energy', 'Moshing', 'Dark', 'Beat Switch'],
    color: 'bg-rose-900/10 text-rose-900 border-rose-900/20 hover:bg-rose-900/20 hover:border-rose-900/50',
    tooltip: 'Chaotic, distorted energy with frequent beat switches for pure rage.',
  },
  {
    id: 'emo',
    label: 'Sad Boi',
    desc: 'Fake Apology',
    icon: '💔',
    tags: ['Emo Rap', 'Melodic Trap', 'Sad Guitar', 'Auto-Tune', 'Emotional', 'Slow Tempo', 'Deep 808s', 'Vinyl Crackle', 'Rain'],
    color: 'bg-sky-500/10 text-sky-700 border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/50',
    tooltip: 'Sad, melodic trap with vinyl crackle and acoustic guitars for drama.',
  },
];

// Pre-calculated set of all known tags for O(1) lookup
export const ALL_KNOWN_TAGS = new Set([
  ...VIBE_PERSONAS.flatMap((p) => p.tags),
  ...MUSIC_STYLE_CATEGORIES.flatMap((c) => c.tags.map((t) => t.label)),
]);

export const getActiveStyle = (catId: string) => {
  switch (catId) {
    case 'structure':
      return 'bg-linear-to-r from-blue-500 to-cyan-500 shadow-blue-500/20';
    case 'voice':
      return 'bg-linear-to-r from-pink-500 to-rose-500 shadow-pink-500/20';
    case 'mood':
      return 'bg-linear-to-r from-violet-500 to-purple-600 shadow-purple-500/20';
    case 'instrument':
      return 'bg-linear-to-r from-amber-400 to-orange-500 shadow-orange-500/20';
    default:
      return 'bg-linear-to-r from-indigo-500 to-indigo-600';
  }
};
