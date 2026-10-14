import type { LoreTopic } from './topics';

export interface HistoricalLoreCase {
  id: string;
  title: string;
  premise: string;
  originalTitle: string;
  songId?: string;
}

/** 源自 9049f57 旧六专题，保留原顺序；创作角度不是经核实的新闻事实。 */
export const historicalLoreCases: Record<string, readonly HistoricalLoreCase[]> = {
  'absurd-social-phenomena': [
    {
      id: 'original-01',
      title: 'The Kentucky Bourbon Raccoon',
      premise:
        'A tiny intruder gets the treatment of a grand bourbon heist. The parody turns a trash-panda character into the least convincing outlaw in town.',
      originalTitle: 'The Kentucky Bourbon Raccoon (2025)',
      songId: 'f8a8e177-6f18-4cbd-9f70-1f479128954a',
    },
    {
      id: 'original-02',
      title: 'Molly-Mae’s "Pasta Crime"',
      premise:
        'A kitchen disagreement grows into a culinary courtroom. Cold water, dry pasta and exaggerated outrage supply the rhythm of a very small scandal.',
      originalTitle: 'Molly-Mae’s "Pasta Crime" (2025)',
      songId: '4f0de696-b9d1-451a-abed-b96044514491',
    },
    {
      id: 'original-03',
      title: 'The "IBPOOPN" Legal Saga',
      premise:
        'A childish phrase meets solemn legal language. The joke is the distance between a bathroom punchline and a room full of people treating it with absolute seriousness.',
      originalTitle: 'The "IBPOOPN" Legal Saga (2025)',
      songId: '91658fb9-b0f0-4cdd-b586-fcebb7b2d0c7',
    },
    {
      id: 'original-04',
      title: 'The "Prosthetic Combat" Gear',
      premise:
        'An imagined tactical outfit becomes its own punchline. The musical setup contrasts swagger, improvised equipment and a plan that cannot survive first contact.',
      originalTitle: 'The "Prosthetic Combat" Gear',
      songId: '6523bb10-c6d0-41d6-b0a8-f04b4fd63cd1',
    },
    {
      id: 'original-05',
      title: 'NY Rooftop Urinator',
      premise:
        'An eco-friendly invention pitch turns into a plumbing farce. The parody borrows the language of innovation to dress up a deeply unimpressive idea.',
      originalTitle: 'NY Rooftop Urinator (2025)',
      songId: '63ce09c5-b702-4ec9-8bd4-14b5624d9e1a',
    },
    {
      id: 'original-06',
      title: 'Ambulance Beer Thief',
      premise:
        'A joyride is narrated like an action blockbuster, then interrupted by the smallest possible priority: finishing a drink. Sirens and laid-back delivery do the comic work.',
      originalTitle: 'Ambulance Beer Thief (2025)',
      songId: '3523b8c0-3fde-4fa9-be52-64ebf3683894',
    },
    {
      id: 'original-07',
      title: 'The US Airport Pajama Ban',
      premise:
        'Comfortable travel clothes become the subject of an oversized public argument. The original setup plays with how a joke about a rule can acquire the tone of an official announcement.',
      originalTitle: 'The US Airport Pajama Ban',
      songId: '316d278c-993c-47b6-973d-0e90d19a5301',
    },
    {
      id: 'original-08',
      title: 'The Rise of "Italian Brainrot"',
      premise:
        'Surreal AI creatures, scrambled language and relentless repetition become a musical texture. The hook follows the absurd sound of the format, without pretending it has one tidy origin story.',
      originalTitle: 'The Rise of "Italian Brainrot"',
      songId: 'f358b6af-c0a9-4ca1-85ed-d450a4e2cb37',
    },
    {
      id: 'original-09',
      title: 'Oklahoma’s Robot Cockfighting',
      premise:
        'A robot-versus-rooster scenario supplies an intentionally ridiculous sporting spectacle. The archive treats it as an absurd creative premise, rather than evidence of a real law.',
      originalTitle: 'Oklahoma’s Robot Cockfighting',
      songId: 'e64e85ac-19ff-4ca2-bc06-8429c9a569e4',
    },
  ],
  'entertainment-topics': [
    {
      id: 'original-01',
      title: 'The Coldplay Kiss-Cam Disaster',
      premise:
        'A stadium screen becomes the narrator nobody invited. The parody angle is the collision between a private-looking moment, a public audience and a chorus of instant reactions.',
      originalTitle: 'The Coldplay Kiss-Cam Disaster (2025)',
    },
    {
      id: 'original-02',
      title: 'Kendrick’s ‘Bootcut Celine’ Halftime',
      premise:
        'A halftime performance becomes an argument about the outfit as much as the music. The setup turns fashion commentary and competitive fandom into a call-and-response.',
      originalTitle: 'Kendrick’s ‘Bootcut Celine’ Halftime (2025)',
    },
    {
      id: 'original-03',
      title: 'Katy Perry’s Tone-Deaf Space Trip',
      premise:
        'A space-trip spectacle meets the language of an ordinary holiday. The musical contrast is between cosmic scale and the decidedly earthbound reaction in the group chat.',
      originalTitle: 'Katy Perry’s Tone-Deaf Space Trip (2025)',
    },
    {
      id: 'original-04',
      title: 'Zendaya’s Silent Ring Reveal',
      premise:
        'A tiny red-carpet detail gets the volume of a major announcement. The archive theme plays with the audience decoding a gesture before anyone has explained it.',
      originalTitle: 'Zendaya’s Silent Ring Reveal (2025)',
    },
    {
      id: 'original-05',
      title: 'The "It Ends With Us" Press Chaos',
      premise:
        'A film press tour is imagined as a diplomatic standoff. Rehearsed smiles, awkward spacing and confident audience interpretations become the ingredients of the parody.',
      originalTitle: 'The "It Ends With Us" Press Chaos (2025)',
    },
    {
      id: 'original-06',
      title: 'Timothée’s "Ballet" Backlash',
      premise:
        'A pop-culture remark collides with the seriousness of the classical arts. The song concept lets two very different worlds argue in two very different musical voices.',
      originalTitle: 'Timothée’s "Ballet" Backlash (2026)',
    },
    {
      id: 'original-07',
      title: 'The "Big Four" Leak',
      premise:
        'Rumors create an audience of self-appointed detectives. The comic subject is the rush to explain incomplete information, without treating an alleged leak as established fact.',
      originalTitle: 'The "Big Four" Leak (2026)',
    },
    {
      id: 'original-08',
      title: 'Taylor & Travis Crash IG',
      premise:
        'Relationship news is given the scale of an emergency broadcast. The premise makes the audience reaction the spectacle, rather than claiming a particular platform actually crashed.',
      originalTitle: 'Taylor & Travis Crash IG (2025)',
    },
    {
      id: 'original-09',
      title: 'The "Snow White" Culture War',
      premise:
        'A familiar fairy-tale title becomes a stage for online arguments. The archive theme turns the repetition of culture-war talking points into an increasingly crowded chorus.',
      originalTitle: 'The "Snow White" Culture War (2025)',
    },
  ],
  'gossip-roast': [
    {
      id: 'original-01',
      title: 'The "Toxic Gossip Train" Apology',
      premise:
        'An apology arrives with an unexpected instrument. The parody explores the mismatch between the gravity of a public response and the cheerful format chosen to deliver it.',
      originalTitle: 'The "Toxic Gossip Train" Apology (2025)',
    },
    {
      id: 'original-02',
      title: 'Delayed Accountability',
      premise:
        'An audience waits for accountability while a statement tries to control the tempo. Pauses, carefully chosen words and repeated refrains form the comic setup.',
      originalTitle: 'Delayed Accountability (2025)',
    },
    {
      id: 'original-03',
      title: 'The Podcast Persona Break',
      premise:
        'A polished public persona meets an unguarded conversation. The musical idea gives the audience reaction its own voice, without presenting speculation about a relationship as fact.',
      originalTitle: 'The Podcast Persona Break (2026)',
    },
    {
      id: 'original-04',
      title: 'The Press Tour Cold War',
      premise:
        'A press tour becomes a cold war conducted through smiles. The comic focus is the audience reading a whole narrative into every pose and pause.',
      originalTitle: 'The Press Tour Cold War (2025)',
    },
    {
      id: 'original-05',
      title: 'The Billionaire Vlog Backlash',
      premise:
        'A luxury lifestyle video meets the rhythms of an ordinary errand. The contrast lets the parody examine spectacle and self-presentation without inventing a specific security incident.',
      originalTitle: 'The Billionaire Vlog Backlash (2026)',
    },
    {
      id: 'original-06',
      title: 'Defamation Lawsuit Era',
      premise:
        'A public argument borrows the formal language of legal correspondence. The archive setup turns the tension between a group-chat feud and a carefully worded response into a duet.',
      originalTitle: 'Defamation Lawsuit Era (2025)',
    },
    {
      id: 'original-07',
      title: 'The Miss Universe Mutiny',
      premise:
        'A beauty-pageant setting is imagined as a room where everyone wants the microphone. The song concept plays with competing speeches, dramatic exits and a chorus that refuses to stay coordinated.',
      originalTitle: 'The Miss Universe Mutiny (2025)',
    },
    {
      id: 'original-08',
      title: 'Resurfaced TikTok Shade',
      premise:
        'An old clip is assigned a brand-new meaning by its audience. The parody follows the speed of reinterpretation, keeping imagined motives separate from what a clip actually shows.',
      originalTitle: 'Resurfaced TikTok Shade (2026)',
    },
    {
      id: 'original-09',
      title: 'The Jeans Campaign Uproar',
      premise:
        'An advertising slogan becomes the starting point for a much larger argument. The creative angle is how repetition can turn a short campaign line into a seemingly endless debate.',
      originalTitle: 'The Jeans Campaign Uproar (2025)',
    },
  ],
  'news-parody': [
    {
      id: 'original-01',
      title: 'The Eiffel Tower Demolition Hoax',
      premise:
        'An impossible demolition announcement is delivered with complete confidence. The joke depends on the sound of a headline outrunning the audience’s first skeptical question.',
      originalTitle: 'The Eiffel Tower Demolition Hoax (2026)',
    },
    {
      id: 'original-02',
      title: 'The "Doomsday Fish" Panic',
      premise:
        'An unusual fish becomes a narrator for end-of-the-world anxiety. The musical setup exaggerates the reaction rather than endorsing a prediction of disaster.',
      originalTitle: 'The "Doomsday Fish" Panic (2026)',
    },
    {
      id: 'original-03',
      title: 'Marjorie Taylor Greene Resignation Prank',
      premise:
        'An imagined resignation letter acquires the ceremony of a major bulletin. The parody follows the audience’s eagerness to repeat an announcement before checking its premise.',
      originalTitle: 'Marjorie Taylor Greene Resignation Prank (2025)',
    },
    {
      id: 'original-04',
      title: 'The "Year of the Bizarre" Hotel Seal',
      premise:
        'A hotel’s polished hospitality script meets an unexpected animal guest. The archive theme gives the front desk and the unbothered visitor very different musical priorities.',
      originalTitle: 'The "Year of the Bizarre" Hotel Seal (2025)',
    },
    {
      id: 'original-05',
      title: 'The "Birds Aren\'t Real" AI Expansion',
      premise:
        'A satirical conspiracy about birds becomes an over-serious briefing. The joke borrows the cadence of evidence and analysis for a premise that is deliberately absurd.',
      originalTitle: 'The "Birds Aren\'t Real" AI Expansion (2026)',
    },
    {
      id: 'original-06',
      title: 'Gen Z "Heterosexual" Fashion Satire',
      premise:
        'An ordinary outfit receives the language of a revolutionary fashion review. The comedy lives in the gap between modest clothes and extravagant critical praise.',
      originalTitle: 'Gen Z "Heterosexual" Fashion Satire (2026)',
    },
    {
      id: 'original-07',
      title: 'The Jet2Holiday Jingle Obsession',
      premise:
        'A commercial travel jingle is imagined as the biggest anthem in the room. The parody explores how a familiar advertising phrase can become a joke through relentless reuse.',
      originalTitle: 'The Jet2Holiday Jingle Obsession (2025)',
    },
    {
      id: 'original-08',
      title: 'The Great "IBPOOPN" Debate',
      premise:
        'A vanity-plate joke is treated as a matter of national importance. Bureaucratic delivery and an irreverent refrain make the contrast audible.',
      originalTitle: 'The Great "IBPOOPN" Debate (2025)',
    },
    {
      id: 'original-09',
      title: '"250 Years of Trump" Comedy Tour',
      premise:
        'An intentionally impossible political timeline becomes a touring musical premise. The archive’s comic device is repetition stretched far beyond a realistic term of office.',
      originalTitle: '"250 Years of Trump" Comedy Tour (2026)',
    },
  ],
  'meme-culture': [
    {
      id: 'original-01',
      title: 'The "6-7" Meme Chaos',
      premise:
        'Two ordinary numbers become a recognizable shout. The archive theme explores the rhythm, shared recognition and repetition of an in-joke, without inventing a particular business response.',
      originalTitle: 'The "6-7" Meme Chaos (2025)',
    },
    {
      id: 'original-02',
      title: 'The "Nihilist Penguin"',
      premise:
        'A solitary penguin becomes a character for people projecting their own moods. The musical angle is the audience giving a quiet image a very dramatic inner monologue.',
      originalTitle: 'The "Nihilist Penguin" (2026)',
    },
    {
      id: 'original-03',
      title: 'The "Shrimp Jesus" Epidemic',
      premise:
        'An unlikely AI image mash-up becomes a chorus about familiarity and strangeness. The creative setup plays with a recognizable silhouette assembled from completely unexpected material.',
      originalTitle: 'The "Shrimp Jesus" Epidemic (2025)',
    },
    {
      id: 'original-04',
      title: 'Labubu Blind Box Madness',
      premise:
        'A collectible toy becomes the narrator of a wildly disproportionate shopping quest. Blind-box suspense and a cute-but-strange character give the parody its recurring hook.',
      originalTitle: 'Labubu Blind Box Madness (2025)',
    },
    {
      id: 'original-05',
      title: 'Reality Show "Brainrot" Edits',
      premise:
        'An ordinary task is edited like a season finale. The archive theme borrows dramatic pauses, reaction cuts and oversized sound cues to make daily life sound absurdly eventful.',
      originalTitle: 'Reality Show "Brainrot" Edits (2026)',
    },
    {
      id: 'original-06',
      title: 'Punch the Monkey',
      premise:
        'An animal character becomes the emotional center of a feed. The parody angle is the audience’s affection and instant investment, rather than a claim about a specific algorithm.',
      originalTitle: 'Punch the Monkey (2026)',
    },
    {
      id: 'original-07',
      title: 'The Spanish Copypasta',
      premise:
        'A sprawling repeated message acquires the tone of a news announcement. The song concept follows the pattern of copy, repeat and tiny variation across a comment section.',
      originalTitle: 'The Spanish Copypasta',
    },
    {
      id: 'original-08',
      title: '"Do you actually want..." Audio',
      premise:
        'A dramatic argument sound is placed against tiny everyday stakes. The musical contrast lets a low-key inconvenience borrow the voice of an operatic confrontation.',
      originalTitle: '"Do you actually want..." Audio',
    },
    {
      id: 'original-09',
      title: '"Because here\'s my thing..."',
      premise:
        'A conversation restarts for one last point, then another. The archive theme turns the refusal to let a discussion end into a chorus that keeps finding an excuse to return.',
      originalTitle: '"Because here\'s my thing..."',
    },
  ],
  'comedy-drill': [
    {
      id: 'original-01',
      title: 'The "Forgot Password" Loop',
      premise:
        'A password reset leads back to the password that supposedly did not work. The comic loop becomes a refrain: change it, try again, return to the beginning.',
      originalTitle: 'The "Forgot Password" Loop',
    },
    {
      id: 'original-02',
      title: 'The 1% Battery Panic',
      premise:
        'A phone’s last percent of battery arrives at exactly the wrong moment. A tiny number gets the tension of a countdown in an action film.',
      originalTitle: 'The 1% Battery Panic',
    },
    {
      id: 'original-03',
      title: 'Phantom Notifications',
      premise:
        'A vibration promises a message that never appears. The setup gives an ordinary pocket check the anticipation and anticlimax of a dramatic reveal.',
      originalTitle: 'Phantom Notifications',
    },
    {
      id: 'original-04',
      title: 'Subscription Traps',
      premise:
        'Signing up takes one easy gesture; leaving feels like an expedition. The musical premise contrasts a welcoming entrance with an exit full of increasingly elaborate steps.',
      originalTitle: 'Subscription Traps',
    },
    {
      id: 'original-05',
      title: 'The USB Paradox',
      premise:
        'A USB plug seems to need three attempts despite having only two orientations. Repetition turns an everyday frustration into its own miniature puzzle.',
      originalTitle: 'The USB Paradox',
    },
    {
      id: 'original-06',
      title: 'Unskippable Ads on 10s Videos',
      premise:
        'A very short clip comes with a much longer advertising prelude. The parody lets the interruption become the loudest and most determined character in the scene.',
      originalTitle: 'Unskippable Ads on 10s Videos',
    },
    {
      id: 'original-07',
      title: 'The "Reply All" Disaster',
      premise:
        'One polite reply expands to an entire inbox. The archive theme transforms a small office courtesy into a choir that nobody asked to join.',
      originalTitle: 'The "Reply All" Disaster',
    },
    {
      id: 'original-08',
      title: 'The Windows Update Ambush',
      premise:
        'A computer decides that the most urgent job is restarting just before a presentation. The song concept gives the progress bar a calm voice and the user a very different tempo.',
      originalTitle: 'The Windows Update Ambush',
    },
    {
      id: 'original-09',
      title: 'The Verification Captcha Insanity',
      premise:
        'A simple human-verification task starts to feel like an identity crisis. Crosswalks, traffic lights and repeated attempts become the rhythm of a strangely philosophical frustration.',
      originalTitle: 'The Verification Captcha Insanity',
    },
  ],
};

export function getLoreTopicArchiveCases(topic: Pick<LoreTopic, 'slug'>) {
  return historicalLoreCases[topic.slug] ?? [];
}
