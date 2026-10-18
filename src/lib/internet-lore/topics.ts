export interface LoreTopic {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  introduction: string[];
  angles: { title: string; text: string }[];
  entrySlugs: string[];
}

/** 汇总页只接收公开作品的封面与名称，不发送音频或创作数据。 */
export interface LoreTopicPreview {
  title: string;
  coverImageUrl: string | null;
  songCount?: number;
  archiveCount?: number;
  themeCount?: number;
}

/** 六个专题是固定一级分类；事件与歌曲归入专题，不能替代专题入口。 */
export const internetLoreTopics: LoreTopic[] = [
  {
    slug: 'absurd-social-phenomena',
    title: 'Absurd Social Phenomena',
    kicker: 'REAL LIFE, ZERO LOGIC',
    description:
      'Strange social rituals, bizarre behavior and real-life situations that seem written by a comedy room.',
    introduction: [
      'Some stories become funny before anyone adds a punchline. A serious setting meets an unexpected guest, a tiny inconvenience becomes a public spectacle, or a supposedly sensible rule makes ordinary life stranger. This collection follows that gap between how the world is meant to work and what actually happens.',
      'The original concepts turn those contradictions into characters, recurring lines and oversized musical reactions. An animal mishap and a social trend can belong in the same collection when both make the familiar suddenly ridiculous. The archive preserves the comic premise separately from the availability of its recording.',
    ],
    angles: [
      {
        title: 'When reality supplies the punchline',
        text: 'Unexpected behavior is the starting point. The comedy comes from the setting, the reversal and the details that make the scene easy to picture.',
      },
      {
        title: 'Small incident, enormous reaction',
        text: 'A minor disruption can acquire the scale of a blockbuster once it becomes a chorus. The music deliberately makes that difference audible.',
      },
    ],
    entrySlugs: [],
  },
  {
    slug: 'entertainment-topics',
    title: 'Entertainment Topics',
    kicker: 'POP CULTURE ON REPLAY',
    description:
      'Unforgettable performances, television moments and pop-culture spectacles, explored through original parody ideas.',
    introduction: [
      'A performance can outlive its broadcast in a completely different form: a clip, a reaction, a dance or a memory people keep sharing. Entertainment Topics collects those moments when the show and the online conversation around it become one story.',
      'The focus is the public moment and why it stays recognizable. Our original songs borrow the comic setup and the feeling of remembering it, rather than copying the performance. Context also matters: the date of the original appearance and the date of a later revival are separate parts of its internet life.',
    ],
    angles: [
      {
        title: 'The clip everyone remembers',
        text: 'A memorable visual or unexpected pairing gives a performance a second life beyond its original audience.',
      },
      {
        title: 'The internet reunion',
        text: 'When an old moment resurfaces, the jokes often become as much about remembering an era as about the clip itself.',
      },
    ],
    entrySlugs: [],
  },
  {
    slug: 'gossip-roast',
    title: 'Gossip & Drama',
    kicker: 'THE GROUP CHAT HAS THOUGHTS',
    description: 'Celebrity chatter, public reactions and messy social dynamics, with the speculation kept in context.',
    introduction: [
      'Gossip gets its energy from the space between what people know and what they think they know. A public appearance, a vague post or a rumored plan can set off a whole chorus of interpretations. This collection explores the conversation, the reactions and the theatrical energy of the group chat.',
      'A rumor remains a rumor. The songs can exaggerate the audience’s excitement without turning an unconfirmed claim into a fact. Follow the song story for its reporting context, and hear the lyrics as parody: a musical response to public chatter, with imagined lines and heightened reactions.',
    ],
    angles: [
      {
        title: 'Rumor becomes a chorus',
        text: 'The comic subject can be the audience’s certainty, the endless decoding and the speed at which a small clue becomes a whole narrative.',
      },
      {
        title: 'Drama in the reaction',
        text: 'A song can give the group chat a voice while keeping confirmed information separate from speculation.',
      },
    ],
    entrySlugs: [],
  },
  {
    slug: 'news-parody',
    title: 'News Parody',
    kicker: 'HEADLINES WITH A HOOK',
    description: 'Headlines reimagined as musical satire, with dramatic delivery and deliberately oversized reactions.',
    introduction: [
      'News Parody takes the language and rhythm of a headline and asks what happens when it gets a beat. The humor may come from a breathless announcement, an extravagant detail or the contrast between a mundane subject and a very serious delivery.',
      'A headline supplies a setup; the parody adds an invented narrator and a comic perspective. A creative premise can be theatrical, sarcastic or absurd without being a literal account of events. This archive records the original themes and the ways their language can become musical comedy.',
    ],
    angles: [
      {
        title: 'Breaking news, tiny stakes',
        text: 'Urgent delivery can make an ordinary detail sound momentous. That change of scale is one of the genre’s most useful jokes.',
      },
      {
        title: 'Excess gets an anthem',
        text: 'Luxury, spectacle and elaborate solutions lend themselves to a chorus that takes the premise all the way to its comic extreme.',
      },
    ],
    entrySlugs: [],
  },
  {
    slug: 'meme-culture',
    title: 'Meme Culture',
    kicker: 'THE INTERNET SPEAKS IN REFERENCES',
    description: 'Viral formats, online in-jokes and familiar internet references that become hooks you can sing.',
    introduction: [
      'A meme is a pattern people recognize and reuse: an image, a phrase, a challenge or a reaction that works because the audience already knows the joke. Meme Culture follows the setups that become shared internet shorthand and the musical ideas hiding inside them.',
      'Repetition is the connection between memes and songs. A recognizable premise becomes a recurring line; a small variation makes the next verse work. These archive concepts explore that loop, using familiar online energy to build their own jokes rather than presenting a definitive history of every format.',
    ],
    angles: [
      {
        title: 'One setup, endless variations',
        text: 'The audience recognizes the pattern, then waits to see how the next version changes it. A chorus can play the same game.',
      },
      {
        title: 'An idiom becomes a challenge',
        text: 'Taking a familiar phrase literally can make a simple concept feel wonderfully unreasonable.',
      },
    ],
    entrySlugs: [],
  },
  {
    slug: 'comedy-drill',
    title: 'Everyday Contrast Comedy',
    kicker: 'EXPECTATION MEETS REALITY',
    description: 'Ordinary routines, awkward moments and everyday expectations that take an unexpectedly comic turn.',
    introduction: [
      'Everyday Contrast Comedy starts with something familiar: a quiet game, a simple errand, a carefully made plan. Then one detail changes the entire mood. The joke lives in that moment when the expected version of daily life collides with the version that actually unfolds.',
      'These parody concepts give small reversals room to grow. An ordinary object can become the loudest character in the scene, and a minor frustration can sound like an epic battle. The appeal is recognition: you do not need to know a celebrity or remember a particular news cycle to understand the setup.',
    ],
    angles: [
      {
        title: 'A routine with a surprise guest',
        text: 'An unexpected sound, response or obstacle interrupts an otherwise ordinary activity and changes its whole comic rhythm.',
      },
      {
        title: 'Tiny problem, cinematic response',
        text: 'Treating a small daily disruption like a grand musical crisis makes the contrast itself the punchline.',
      },
    ],
    entrySlugs: [],
  },
];

export function getInternetLoreTopic(slug: string): LoreTopic | undefined {
  return internetLoreTopics.find((topic) => topic.slug === slug);
}
