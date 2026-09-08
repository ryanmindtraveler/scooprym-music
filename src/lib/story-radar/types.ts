export const STORY_RADAR_CATEGORIES = ['celebrity_drama', 'internet_chaos', 'absurd_headlines'] as const;

export type StoryRadarCategory = (typeof STORY_RADAR_CATEGORIES)[number];

export const STORY_CANDIDATE_STATUSES = ['new', 'shortlisted', 'adopted', 'dismissed'] as const;

export type StoryCandidateStatus = (typeof STORY_CANDIDATE_STATUSES)[number];

export interface GoogleTrendSignal {
  term: string;
  region: string;
  approximateTraffic: string | null;
  startedAt: string | null;
  observedAt: string;
}

export interface StoryRadarCandidate {
  provider: 'gdelt' | 'rss' | 'google-trends';
  trendSignals?: GoogleTrendSignal[] | null;
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  sourceImageUrl: string | null;
  category: StoryRadarCategory;
  matchedTerms: string[];
  relevanceScore: number;
  publishedAt: Date | null;
}

export interface RadarSourceReport {
  name: string;
  url: string;
  status: 'ok' | 'empty' | 'failed' | 'disabled';
  fetched: number;
  accepted: number;
  needsReview: number;
  older: number;
  invalid: number;
  latestPublishedAt: string | null;
  durationMs: number;
  httpStatus?: number;
  topics?: number;
  error?: string;
}

export interface RadarSourceBatch {
  candidates: StoryRadarCandidate[];
  report: RadarSourceReport;
}

export interface RadarCollection {
  candidates: StoryRadarCandidate[];
  sources: RadarSourceReport[];
  status: 'completed' | 'partial' | 'failed';
}

export interface RadarScanSummary {
  id: string;
  status: 'running' | 'completed' | 'partial' | 'failed';
  startedAt: string;
  completedAt: string | null;
  discovered: number;
  inserted: number;
  updated: number;
  sources: RadarSourceReport[];
  error: string | null;
}
