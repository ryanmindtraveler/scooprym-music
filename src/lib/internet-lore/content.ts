import type { Song } from '@/types/song';

export interface LoreEntry {
  slug: string;
  title: string;
  category: string;
  era: string;
  summary: string;
  paragraphs: string[];
  sources: { title: string; url: string }[];
  songId: string;
}

export type LoreEntryWithSong = LoreEntry & { song: Song | null };

/** 编辑正文与歌曲分开保存；作品下架后仍可阅读有来源的事件解释。 */
export const internetLoreEntries: LoreEntry[] = [
  {
    slug: 'drunk-raccoon',
    title: 'The drunk raccoon that stole the internet',
    category: 'Bizarre news',
    era: '2025',
    summary:
      'A Virginia liquor store, broken bottles and a raccoon asleep in the bathroom. Yes, this one really happened.',
    paragraphs: [
      'In November 2025, a raccoon broke into an ABC liquor store in Ashland, Virginia. According to Hanover County animal protection officials, it knocked over bottles, apparently drank some of the spilled alcohol and was found passed out in the bathroom.',
      'Animal control took the raccoon to a shelter. After a few hours of sleep and no apparent injuries, it was released back into the wild. ABC News reported the incident on December 2, 2025.',
      'The comic reversal is the whole story: a creature already dressed like a tiny burglar becomes the customer who cannot handle the night out. Our song takes that real incident into parody, turning the liquor-store mishap into a musical getaway.',
    ],
    sources: [
      {
        title: 'ABC News · Drunk raccoon found in a Virginia liquor store',
        url: 'https://abcnews.com/US/drunk-raccoon-found-passed-liquor-store-bathroom-officials/story?id=128054453',
      },
    ],
    songId: '5ccdaff4-3a70-46cb-a4a8-4f52d96939e4',
  },
  {
    slug: 'swish-swish-snl',
    title: 'Katy Perry, the Backpack Kid and a pop-culture fever dream',
    category: 'Pop culture',
    era: '2017',
    summary: 'One SNL performance became a shortcut to remembering the internet’s strangest pop-culture moments.',
    paragraphs: [
      'During the May 2017 Saturday Night Live season finale, Katy Perry performed “Swish Swish” alongside Russell Horning, better known as the Backpack Kid. His backpack and signature stiff-armed dance made an unusually memorable pairing with a major pop performance.',
      'In September 2026, The Daily Dot reported on a Reddit discussion that brought the performance back into circulation. A question about pop-culture moments that felt like fever dreams became a shared trip through internet memories. The outlet noted that it could not independently verify every recollection in the thread.',
      'The performance and the later discussion are separate chapters: a live TV moment, then a wave of people remembering it together. Our original track plays with that second chapter — the feeling of opening one old clip and suddenly remembering an entire era online.',
    ],
    sources: [
      {
        title: 'The Daily Dot · The internet revisits Katy Perry and the Backpack Kid',
        url: 'https://dailydot.com/reddit-katy-perry-swish-swish-performance',
      },
    ],
    songId: '6cc68d73-23d7-45c2-a161-a886709349a6',
  },
];
