import { STORY_RADAR_CATEGORY_CONFIG, TRUSTED_STORY_DOMAINS } from './config';
import type { StoryRadarCategory } from './types';

export function normalizeStoryDomain(value: string) {
  return value.toLowerCase().replace(/^www\./, '');
}

export function canonicalizeStoryUrl(value: string) {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_') || ['fbclid', 'gclid', 'mc_cid', 'mc_eid'].includes(key)) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
}

export function classifyStoryHeadline(title: string): {
  category: StoryRadarCategory;
  matchedTerms: string[];
} | null {
  const normalizedTitle = title.toLowerCase();
  const matches = STORY_RADAR_CATEGORY_CONFIG.map((config) => ({
    category: config.id,
    matchedTerms: config.strongTerms.filter((term) => normalizedTitle.includes(term.toLowerCase())),
  })).filter((entry) => entry.matchedTerms.length > 0);

  if (matches.length === 0) return null;
  matches.sort((a, b) => b.matchedTerms.length - a.matchedTerms.length);
  return matches[0];
}

export function scoreStoryCandidate(input: {
  domain: string;
  imageUrl: string | null;
  matchedTerms: string[];
  publishedAt: Date | null;
}) {
  let score = Math.min(input.matchedTerms.length * 18, 54);
  if (TRUSTED_STORY_DOMAINS.has(input.domain)) score += 25;
  if (input.imageUrl) score += 8;
  if (input.publishedAt && Date.now() - input.publishedAt.getTime() <= 24 * 60 * 60 * 1000) score += 13;
  return Math.min(score, 100);
}
