import { z } from 'zod';

/** 发布状态控制公开访问，栏目只控制公开歌曲的展示入口。 */
export const lorePublicationTopics = [
  { slug: 'absurd-social-phenomena', title: 'Absurd Social Phenomena' },
  { slug: 'entertainment-topics', title: 'Entertainment Topics' },
  { slug: 'gossip-roast', title: 'Gossip & Drama' },
  { slug: 'news-parody', title: 'News Parody' },
  { slug: 'meme-culture', title: 'Meme Culture' },
  { slug: 'comedy-drill', title: 'Everyday Contrast Comedy' },
] as const;

export type SongPublicationChannel = 'gallery' | 'internet_lore';
export interface SongPublicationPlacement {
  publicationChannel: SongPublicationChannel;
  loreTopicSlug: string | null;
}

export const songPublicationPlacementSchema = z
  .object({
    publicationChannel: z.enum(['gallery', 'internet_lore']),
    loreTopicSlug: z.string().nullable(),
  })
  .superRefine((placement, context) => {
    if (
      placement.publicationChannel === 'gallery'
        ? placement.loreTopicSlug !== null
        : !getPublicationLoreTopic(placement.loreTopicSlug)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['loreTopicSlug'],
        message: 'Choose a valid collection for Internet Lore; Gallery has no collection.',
      });
    }
  });

export function getPublicationLoreTopic(slug: string | null | undefined) {
  return lorePublicationTopics.find((topic) => topic.slug === slug);
}
