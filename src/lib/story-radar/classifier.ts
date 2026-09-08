import { STORY_RADAR_CATEGORY_CONFIG, TRUSTED_STORY_DOMAINS } from './config';
import type { StoryRadarCategory } from './types';

export function normalizeStoryDomain(value: string) {
  return value.toLowerCase().replace(/^www\./, '');
}

export function canonicalizeStoryUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Only public article HTTP URLs are supported');
  }
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_') || ['fbclid', 'gclid', 'mc_cid', 'mc_eid'].includes(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return url.toString();
}

function containsTerm(text: string, term: string) {
  // 汉字词组没有空格分词，不能沿用英文单词边界。
  if (/\p{Script=Han}/u.test(term)) return text.includes(term);
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(text);
}

export function classifyStoryHeadline(title: string): {
  category: StoryRadarCategory;
  matchedTerms: string[];
} | null {
  const normalizedTitle = title.toLowerCase();
  const matches = STORY_RADAR_CATEGORY_CONFIG.map((config) => ({
    category: config.id,
    matchedTerms: [...new Set([...config.strongTerms, ...config.queryTerms])].filter((term) =>
      containsTerm(normalizedTitle, term)
    ),
  })).filter((entry) => entry.matchedTerms.length > 0);

  if (matches.length === 0) return null;
  matches.sort((a, b) => b.matchedTerms.length - a.matchedTerms.length);
  return matches[0];
}

const IRRELEVANT_TOPIC_TERMS = [
  'dies at',
  'dead at',
  'obituary',
  'passed away',
  'mourns death',
  'killed in',
  'fatal crash',
  'homicide',
  'mass shooting',
  'quarterly earnings',
  'earnings report',
  'q1 results',
  'q2 results',
  'q3 results',
  'q4 results',
  'fiscal year',
  'shareholders meeting',
  'press release distribution',
];

export function isIrrelevantStoryTopic(title: string): boolean {
  const lower = title.toLowerCase();
  return IRRELEVANT_TOPIC_TERMS.some((term) => containsTerm(lower, term));
}

export function scoreStoryCandidate(input: {
  title?: string;
  domain: string;
  imageUrl: string | null;
  matchedTerms: string[];
  publishedAt: Date | null;
}) {
  if (input.title && isIrrelevantStoryTopic(input.title)) {
    return 0;
  }

  let score = Math.min(input.matchedTerms.length * 18, 54);
  if (TRUSTED_STORY_DOMAINS.has(input.domain)) score += 25;
  if (input.imageUrl) score += 8;
  const age = input.publishedAt ? Date.now() - input.publishedAt.getTime() : null;
  if (age !== null && age >= 0 && age <= 24 * 60 * 60 * 1000) score += 13;
  return Math.min(score, 100);
}

export function getStoryFreshness(value: Date | string | null, now = new Date()) {
  if (!value) return 'unknown';
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'unknown';
  if (time > now.getTime() + 5 * 60_000) return 'future';
  return now.getTime() - time > 72 * 60 * 60_000 ? 'older' : 'recent';
}
