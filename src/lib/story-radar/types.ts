export const STORY_RADAR_CATEGORIES = ['celebrity_drama', 'internet_chaos', 'absurd_headlines'] as const;

export type StoryRadarCategory = (typeof STORY_RADAR_CATEGORIES)[number];

export const STORY_CANDIDATE_STATUSES = ['new', 'shortlisted', 'adopted', 'dismissed'] as const;

export type StoryCandidateStatus = (typeof STORY_CANDIDATE_STATUSES)[number];

export interface StoryRadarCandidate {
  provider: 'gdelt' | 'rss';
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  sourceImageUrl: string | null;
  category: StoryRadarCategory;
  matchedTerms: string[];
  relevanceScore: number;
  publishedAt: Date | null;
}
