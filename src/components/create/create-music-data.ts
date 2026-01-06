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

export interface VibePersona {
  id: string;
  label: string;
  desc: string;
  icon: string;
  tags: string[] | readonly string[];
  color: string;
  tooltip?: string;
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// 🛑 LOCKED SCHEMA - DO NOT EDIT 🛑
// The 5-layer structure and tag set below are FINALIZED and LOCKED.
// All Vibe Check themes MUST be composed of tags from these 5 layers.
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

export const MUSIC_STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: 'genre',
    title: '1. Core Genre',
    description: 'The foundation. Choose the beat pattern and genre.',
    tags: [
      // Core Hip-Hop & Trap
      { label: 'UK Drill', desc: 'Aggressive, sliding basslines, dark' },
      { label: 'Trap Rhythm', desc: 'Sharp snares, fast hi-hats, club ready' },
      { label: 'Boom Bap', desc: 'Hard hitting drums, sample based' },
      { label: '90s Boom Bap', desc: 'Golden age hip hop sound' },
      { label: 'West Coast Hip Hop', desc: 'Bounce, sunshine, cruising' },
      { label: 'G-Funk', desc: 'Laid back West Coast groove' },
      { label: 'Sample Drill', desc: 'Drill beats using goofy samples' },
      { label: 'Memphis Rap', desc: 'Lo-fi 90s southern hip hop' },

      // Electronic & Viral
      { label: 'Jersey Club', desc: 'Fast, repetitive triplets, bed squeaks' },
      { label: 'Phonk', desc: 'Gritty, lo-fi, screwed vocals' },
      { label: 'Drift Phonk', desc: 'High distortion, cowbells, driving' },
      { label: 'Dark Phonk', desc: 'Gritty, evil, distorted phonk' },
      { label: 'Hyperpop', desc: 'Fast, high-pitched, synthetic, chaotic' },
      { label: 'Glitchcore', desc: 'Chaotic hyperpop subgenre' },
      { label: 'Rage Beats', desc: 'Synthesized, chaotic, high energy' },
      { label: 'Vocal House', desc: 'Glamorous, runway style, club beat' },
      { label: 'Synth-Pop', desc: 'Commercial, catchy, tech-news vibe' },

      // Pop & Melodic
      { label: 'Modern Pop', desc: 'Contemporary radio-friendly sound' },
      { label: 'Pop-Funk', desc: 'Groovy, retro-viral summer vibe' },
      { label: 'R&B', desc: 'Smooth, melodic, emotional' },
      { label: 'Sassy R&B', desc: 'R&B with attitude and snap beats' },
      { label: 'Melodic Trap', desc: 'Hybrid of rap beats and singing' },
      { label: 'Emo Rap', desc: 'Sad, melodic, guitar-driven trap' },
      { label: 'Lo-Fi Hip Hop', desc: 'Relaxed, nostalgic, study beats' },

      // Dark & Aggressive
      { label: 'Dark Trap', desc: 'Ominous, heavy bass, minor key' },
      { label: 'Horrorcore', desc: 'Dark, eerie, aggressive themes' },
      { label: 'Industrial Trap', desc: 'Mechanical, harsh, clanking trap' },
      { label: 'Metal Rap', desc: 'Rap with heavy metal guitars' },
      { label: 'Soundcloud Rap', desc: 'Lo-fi, distorted, raw energy' },
      { label: 'Mumble Rap', desc: 'Slurred, triplet flow, vibe-focused' },

      // Meme & Parody
      { label: 'Goofy Ahh Beat', desc: 'Cartoonish, silly, viral sound' },
      { label: 'Circus Trap', desc: 'Trap beats with carnival melodies' },
      { label: 'Glitch Hop', desc: 'Digital distortion, stuttering beats' },
      { label: 'Dark Ambient', desc: 'Eerie, athletic horror texture' },
      { label: 'High BPM', desc: 'Fast tempo, >140 BPM' },
      { label: 'Fast 140 BPM', desc: 'Specific viral dance tempo' },
    ],
  },
  {
    id: 'timbre',
    title: '2. Unique Timbre',
    description: 'Distinctive instruments and vocal characters.',
    tags: [
      // Vocal Character (Merged)
      { label: 'News Anchor', desc: 'Professional, reliable tone' },
      { label: 'Gossip Tone', desc: 'Sassy, inquisitive, drama-seeking' },
      { label: 'Sassy', desc: 'Expressive, bold attitude' },
      { label: 'Deep Voice', desc: 'Low, resonant vocal tone' },
      { label: 'Robotic Vocals', desc: 'Heavy modulation, non-human' },
      { label: 'NPC Voice', desc: 'Flat, repetitive AI-streamer tone' },
      { label: 'Chipmunk Soul', desc: 'Sped-up, high-pitched vocal samples' },
      { label: 'Whisper Rap', desc: 'Quiet, intense, ASMR style for secrets' },
      { label: 'Screaming Vocals', desc: 'Aggressive, metal-influenced rage' },
      { label: 'Emotional Vocals', desc: 'Crying, breaking voice' },
      { label: 'Male Vocals', desc: 'Clear, resonant male vocal tone' },
      { label: 'Female Vocals', desc: 'Clear, melodic female tone' },
      { label: 'Gang Vocals', desc: 'Group shouting, raw energy' },
      { label: 'Spoken Word', desc: 'Narrative, no melody' },
      { label: 'Layered Harmonies', desc: 'Thick, produced vocal stacks' },
      { label: 'Baby Voice', desc: 'High-pitched, squeaky Carti style' },
      { label: 'Choir Stabs', desc: 'Dramatic heavenly vocal hits' },

      // Key Instruments
      { label: '808 Slides', desc: 'Bending sub-bass notes' },
      { label: 'Heavy Bass', desc: 'Thumping low-end' },
      { label: 'Deep 808s', desc: 'Clean, low sub-bass' },
      { label: 'Aggressive 808s', desc: 'Bass that punches hard' },
      { label: 'Distorted Bass', desc: 'Fuzzy, blown-out low end' },
      { label: 'Tuba', desc: 'Low, comedic brass hits' },
      { label: 'Kazoo', desc: 'The ultimate meme instrument' },
      { label: 'Tuba Bass', desc: 'Bassline played by a tuba' },
      { label: 'Sad Guitar', desc: 'Melancholic acoustic or electric riffs' },
      { label: 'Sad Guitar Loop', desc: 'Repeating melancholic riff' },
      { label: 'Funky Guitar', desc: 'Wah-wah or clean rhythmic chops' },
      { label: 'Synthesizer', desc: 'Electronic leads and pads' },
      { label: 'Haunting Synth', desc: 'Ghostly, atmospheric pads' },
      { label: 'Pizzicato Strings', desc: 'Sneaky, short plucked strings' },
      { label: 'Cinematic String Stabs', desc: 'Sharp, orchestral string hits' },
      { label: 'News Intro Theme', desc: 'Orchestral breaking news sting' },
      { label: 'Piano', desc: 'Acoustic or electric keys' },
      { label: 'Circus Melody', desc: 'Carnival music riffs' },
      { label: 'Cowbell', desc: 'Metallic, harsh phonk rhythm' },
      { label: 'Distorted Cowbell', desc: 'Overdriven phonk cowbell' },
      { label: 'G-Funk Synth', desc: 'High-pitched G-Funk lead' },
      { label: 'Arpeggiator', desc: 'Fast, cycling synth notes' },
      { label: 'Buzzing Synths', desc: 'Sawtooth, electric fly sound' },
      { label: 'Digital Blip', desc: '8-bit computer sounds' },
      { label: 'Distorted 808s', desc: 'Fuzzy, aggressive bass' },
    ],
  },
  {
    id: 'rhythm',
    title: '3. Rhythm & Flow',
    description: 'Tempo, flow patterns, and drum groove.',
    tags: [
      // Tempo & Groove
      { label: 'Fast Tempo', desc: 'Rapid, driving energy' },
      { label: 'Sturdy Dance', desc: 'Rhythm made for TikTok footwork' },
      { label: 'Slow Tempo', desc: 'Dragging, heavy, sluggish' },
      { label: 'Bouncy Rhythm', desc: 'Swinging, energetic feel' },
      { label: 'Syncopated', desc: 'Off-beat, groovy rhythm' },
      { label: 'Breakbeat', desc: 'Syncopated drum loops' },
      { label: 'Repetitive', desc: 'Hypnotic, loop-focused' },
      { label: 'Hypnotic Loop', desc: 'Trance-inducing repetition' },
      { label: 'Bass Drop', desc: 'Building tension into heavy bass' },
      { label: 'Heavy Bass Drop', desc: 'Massive low-end impact' },
      { label: 'Beat Switch', desc: 'Sudden change in tempo/rhythm' },

      // Flow Styles
      { label: 'Fast Flow', desc: 'Rapid-fire, impressive rapping' },
      { label: 'Triplet Flow', desc: 'Migos-style rapid triplets' },
      { label: 'Aggressive Flow', desc: 'Hard, shouting delivery' },
      { label: 'Lyrical', desc: 'Focus on wordplay and bars' },
      { label: 'Mumble Rap', desc: 'Slurred delivery (Style)' },

      // Drum Kit
      { label: 'Hard Hitting Drums', desc: 'Powerful, punching kit' },
      { label: 'Punchy Kick', desc: 'Kick drum that cuts through' },
      { label: 'Snap Beat', desc: 'Finger snaps as percussion' },
    ],
  },
  {
    id: 'ornament',
    title: '4. Special Ornament',
    description: 'Meme SFX, ad-libs, and spice.',
    tags: [
      // Meme SFX
      { label: 'Vine Boom', desc: 'Dramatic viral boom sound effect' },
      { label: 'Air Horn', desc: 'Classic reggae/dancehall air horn blast' },
      { label: 'Metal Pipe Falling', desc: 'Loud, clanging meme impact' },
      { label: 'Bed Squeak', desc: 'Rhythmic squeaking sample' },
      { label: 'Slide Whistle', desc: 'Comedic falling/rising sound' },
      { label: 'Coin Sound', desc: 'Mario-style coin collection sfx' },
      { label: 'Glass Shattering', desc: 'Loud impact of breaking glass' },
      { label: 'Gong', desc: 'Large, dramatic metallic impact' },
      { label: 'Cartoon Sfx', desc: 'Boings, whistles, splats' },
      { label: 'Cartoon Boing', desc: 'The specific goofy spring sound' },
      { label: 'What The Hell', desc: 'Viral confused voice meme' },
      { label: 'Whistle', desc: 'Catchy melodic whistling' },
      { label: 'Video Game Sfx', desc: 'Retro arcade sounds' },
      { label: 'Police Sirens', desc: 'Urgent, warning, chaos' },
      { label: 'Record Scratch', desc: 'DJ scratch, rewind effect' },
      { label: 'Discord Ping', desc: 'PTSD-inducing notification sound' },
      { label: 'Bruh Sound Warning', desc: 'The classic disappointment SFX' },
      { label: 'Crowd Gasp', desc: 'Shocked audience reaction' },

      // Vocal Ornaments
      { label: 'Ad-libs', desc: 'Background shouts, hype vocals' },
      { label: 'Ad-lib Heavy', desc: 'Constant background vocals' },
      { label: 'Manic Laughter', desc: 'Crazy, unhinged laughter sfx' },
      { label: 'Live Studio Audience', desc: 'Cheering, clapping, reactions' },
      { label: 'Dramatic Hits', desc: 'Impactful cinematic strikes' },
      { label: 'Orchestral Hits', desc: 'Sudden, dramatic impacts' },
      { label: 'Orchestral Stabs', desc: 'Sharp, dramatic tutti hits' },
    ],
  },
  {
    id: 'production',
    title: '5. Production Polish',
    description: 'Mixing effects, mood, and atmosphere.',
    tags: [
      // Processing Effects
      { label: 'Auto-Tune', desc: 'Pitch-corrected, robotic effect' },
      { label: 'Heavy Auto-Tune', desc: 'Maxed out pitch correction' },
      { label: 'Deep Fried Bass', desc: 'Extremely distorted sub-bass' },
      { label: 'Nuked', desc: 'Audio destruction beyond deep fried' },
      { label: 'Distorted', desc: 'Audio clipping, raw sound' },
      { label: 'Bitcrushed Synths', desc: 'Low-res, 8-bit digital synths' },
      { label: 'Bass Boosted', desc: 'Blown-out, ear-rape distortion' },
      { label: 'Slowed + Reverb', desc: 'Deep, slow, atmospheric vibe' },
      { label: 'Vocal Chops', desc: 'Pitched up/down vocal samples' },
      { label: 'Memphis Vocals', desc: 'Lo-fi, chopped, phonk style (FX)' },
      { label: 'Telephone Effect', desc: 'Lo-fi EQ filter on vocals' },
      { label: 'Reverb', desc: 'Spacious, echoey room sound' },
      { label: 'Stutter', desc: 'Rhythmic audio chopping' },
      { label: 'Glitch', desc: 'Digital error sfx, malfunctions' },
      { label: 'Vinyl Crackle', desc: 'Lo-fi retro noise floor' },
      { label: 'VHS Audio', desc: 'Wobbly, muffled 90s tape sound' },
      { label: 'Tape Hiss', desc: 'Analog recording noise' },
      { label: 'Rain Sounds', desc: 'Realistic rainfall ambiance' },
      { label: 'Chillwide', desc: 'Wide stereo, cinematic relaxation' },

      // Mood / Atmosphere
      { label: 'Funny', desc: 'Comedic, lighthearted, parody' },
      { label: 'Cringe', desc: 'Awkward, satirical, embarrassing' },
      { label: 'Unhinged', desc: 'Completely crazy, mental breakdown' },
      { label: 'Based', desc: 'Confident, controversial, unapologetic' },
      { label: 'Petty', desc: 'Spiteful, gossip-fueled, dramatic' },
      { label: 'Roast', desc: 'Mocking, sharp, biting' },
      { label: 'High Energy', desc: 'Intense, pumping, workout' },
      { label: 'Aggressive', desc: 'In-your-face, confrontational' },
      { label: 'Chaotic', desc: 'Unpredictable, overwhelming' },
      { label: 'Manic Energy', desc: 'Uncontrollable excitement' },
      { label: 'Dark', desc: 'Ominous, shadowy, evil' },
      { label: 'Creepy', desc: 'Unsettling, scary, weird' },
      { label: 'Emotional', desc: 'Heartfelt, sad, touching' },
      { label: 'Heartbreak', desc: 'Songs about breaking up' },
      { label: 'Anthemic', desc: 'Big sound, stadium feel' },
      { label: 'Party', desc: 'Celebration, good times' },
      { label: 'Futuristic', desc: 'Sci-fi, forward-looking' },
      { label: 'Lo-Fi Horror', desc: 'VHS tape scary vibes' },
      { label: 'Catchy Hook', desc: 'Memorable, earworm melody' },
    ],
  },
] as const;

export const DEFAULT_CUSTOM_VIBE_PROMPT = 'Jersey Club, Fast Tempo, Funny, Aggressive Flow, Bed Squeak';

export const VIBE_PERSONAS: readonly VibePersona[] = [
  {
    id: 'viral_pop',
    label: 'Custom Vibe',
    desc: 'Create your own',
    icon: '✨',
    color: 'bg-slate-50 dark:bg-white/5 border-dashed border-slate-200 dark:border-white/10',
    tags: [
      'Jersey Club',
      'Fast Tempo',
      'Funny',
      'Aggressive Flow',
      'Bed Squeak',
    ],
  },
  {
    id: 'news',
    label: 'Breaking Trap',
    desc: 'Urgent Flash',
    icon: '📰',
    tags: [
      'UK Drill',
      'News Intro Theme',
      'News Anchor',
      'Police Sirens',
      'Crowd Gasp',
      'Dramatic Hits',
    ],
    color: 'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/50',
    tooltip: 'Serious "News Parody" with UK Drill beats, cinematic sirens, and urgent strings.',
  },
  {
    id: 'karen',
    label: 'Karen Alert',
    desc: 'Manager Plz',
    icon: '🤬',
    tags: [
      'Industrial Trap',
      'Screaming Vocals',
      'Distorted Bass',
      'Glass Shattering',
      'Bruh Sound Warning',
      'High BPM',
    ],
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/50',
    tooltip: 'Chaotic "Public Freakout" vibe with industrial trap, screaming, and glass breaking.',
  },
  {
    id: 'satire',
    label: 'Clown World',
    desc: 'Goofy & Weird',
    icon: '🤡',
    tags: [
      'Goofy Ahh Beat',
      'Circus Trap',
      'Kazoo',
      'Slide Whistle',
      'Cartoon Boing',
      'Bouncy Rhythm',
      'Funny',
    ],
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/50',
    tooltip: 'Absurd "Circus Trap" for satire, featuring tuba bass and goofy cartoon sound effects.',
  },
  {
    id: 'gossip',
    label: 'Spill The Tea',
    desc: 'Celeb Drama',
    icon: '☕',
    tags: [
      'Sassy R&B',
      'Pizzicato Strings',
      'Snap Beat',
      'Vocal Chops',
      'Petty',
      'Gossip Tone',
      'What The Hell',
    ],
    color:
      'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/50',
    tooltip: 'Petty "Gossip R&B" with pizzicato strings and snaps for spilling the tea.',
  },
  {
    id: 'diss',
    label: 'Diss Master',
    desc: 'Ruthless Roast',
    icon: '🔥',
    tags: [
      '90s Boom Bap',
      'Hard Hitting Drums',
      'Record Scratch',
      'Vine Boom',
      'Air Horn',
      'Crowd Gasp',
      'Aggressive Flow',
      'Roast',
    ],
    color: 'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50',
    tooltip: 'Hardcore "Battle Rap" boom bap with record scratches for aggressive roasting.',
  },
  {
    id: 'emo',
    label: 'Sad Boi',
    desc: 'Fake Apology',
    icon: '💔',
    tags: [
      'Emo Rap',
      'Sad Guitar Loop',
      'Melodic Trap',
      'Reverb',
      'Heartbreak',
      'Rain Sounds',
      'Telephone Effect',
      'Emotional Vocals',
    ],
    color: 'bg-sky-500/10 text-sky-700 border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/50',
    tooltip: 'Dramatic "Fake Apology" emo rap with sad guitars and heavy reverb.',
  },
  {
    id: 'club',
    label: 'Club Banger',
    desc: 'Viral Dance',
    icon: '🪩',
    tags: [
      'Jersey Club',
      'Bed Squeak',
      'Sturdy Dance',
      'Heavy Bass Drop',
      'Vocal Chops',
      'Fast Tempo',
      'Party',
    ],
    color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/50',
    tooltip: 'Viral "Jersey Club" dance anthem with bed squeaks and heavy bass drops.',
  },
  {
    id: 'crypto',
    label: 'Crypto God',
    desc: 'To The Moon',
    icon: '🚀',
    tags: [
      'Hyperpop',
      'Glitchcore',
      'Discord Ping',
      'Arpeggiator',
      'Coin Sound',
      'Manic Energy',
      'NPC Voice',
    ],
    color:
      'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/50',
    tooltip: 'Manic "Hyperpop" for crypto hype featuring coin sounds and glitch effects.',
  },
  {
    id: 'mystery',
    label: 'Analog Horror',
    desc: 'Urban Legends',
    icon: '📼',
    tags: [
      'Dark Phonk',
      'Memphis Rap',
      'Tape Hiss',
      'Haunting Synth',
      'Distorted Cowbell',
      'Creepy',
      'Lo-Fi Horror',
      'Dark',
    ],
    color: 'bg-purple-600/10 text-purple-700 border-purple-600/20 hover:bg-purple-600/20 hover:border-purple-600/50',
    tooltip: 'Creepy "Analog Horror" phonk with tape hiss and distorted cowbells.',
  },
  {
    id: 'mumble',
    label: 'Mumble God',
    desc: 'Incoherent Hype',
    icon: '💊',
    tags: [
      'Soundcloud Rap',
      'Mumble Rap',
      'Heavy Auto-Tune',
      'Triplet Flow',
      'Deep Fried Bass',
      'Ad-lib Heavy',
      'VHS Audio',
    ],
    color: 'bg-violet-500/10 text-violet-700 border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-500/50',
    tooltip: 'Hazy "Mumble Rap" with heavy auto-tune and deep fried bass.',
  },
  {
    id: 'rage',
    label: 'Rage Mode',
    desc: 'Opium Vibe',
    icon: '🦇',
    tags: [
      'Rage Beats',
      'Buzzing Synths',
      'Bass Boosted',
      'High Energy',
      'Metal Pipe Falling',
      'Distorted',
    ],
    color: 'bg-rose-900/10 text-rose-900 border-rose-900/20 hover:bg-rose-900/20 hover:border-rose-900/50',
    tooltip: 'Aggressive "Rage Beat" with buzzing synths and video game SFX for moshpits.',
  },
] as const;

// Pre-calculated set of all known tags for O(1) lookup
export const ALL_KNOWN_TAGS = new Set([
  ...VIBE_PERSONAS.flatMap((p) => p.tags),
  ...MUSIC_STYLE_CATEGORIES.flatMap((c) => c.tags.map((t) => t.label)),
]);

export const getActiveStyle = (catId: string) => {
  switch (catId) {
    case 'genre':
      return 'bg-linear-to-r from-blue-500 to-cyan-500 shadow-blue-500/20';
    case 'timbre':
      return 'bg-linear-to-r from-pink-500 to-rose-500 shadow-pink-500/20';
    case 'rhythm':
      return 'bg-linear-to-r from-green-400 to-emerald-500 shadow-emerald-500/20';
    case 'ornament':
      return 'bg-linear-to-r from-amber-400 to-orange-500 shadow-orange-500/20';
    case 'production':
      return 'bg-linear-to-r from-violet-500 to-purple-600 shadow-purple-500/20';
    default:
      return 'bg-linear-to-r from-indigo-500 to-indigo-600';
  }
};
