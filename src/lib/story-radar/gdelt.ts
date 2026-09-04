import { canonicalizeStoryUrl, classifyStoryHeadline, normalizeStoryDomain, scoreStoryCandidate } from './classifier';
import { STORY_RADAR_CATEGORY_CONFIG } from './config';
import type { StoryRadarCandidate } from './types';

const GDELT_DOC_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const FETCH_TIMEOUT_MS = 15_000;
const RATE_LIMIT_RETRY_MS = 6_000;
const MAX_REQUEST_ATTEMPTS = 3;

interface GdeltArticle {
  url?: unknown;
  title?: unknown;
  seendate?: unknown;
  socialimage?: unknown;
  domain?: unknown;
  language?: unknown;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

function buildGdeltQuery() {
  const terms = STORY_RADAR_CATEGORY_CONFIG.flatMap((category) => category.queryTerms);
  return `(${terms.map((term) => `\"${term}\"`).join(' OR ')}) sourcelang:english`;
}

function parsePublishedAt(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;

  const compactMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (compactMatch) {
    const [, year, month, day, hour, minute, second] = compactMatch;
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toCandidate(article: GdeltArticle): StoryRadarCandidate | null {
  if (typeof article.url !== 'string' || typeof article.title !== 'string') return null;
  const title = article.title.replace(/\s+/g, ' ').trim();
  if (title.length < 24) return null;

  const categoryMatch = classifyStoryHeadline(title);
  if (!categoryMatch) return null;

  let sourceUrl: string;
  try {
    sourceUrl = canonicalizeStoryUrl(article.url);
  } catch {
    return null;
  }

  const parsedDomain = normalizeStoryDomain(
    typeof article.domain === 'string' && article.domain ? article.domain : new URL(sourceUrl).hostname
  );
  const imageUrl =
    typeof article.socialimage === 'string' && article.socialimage.startsWith('https://') ? article.socialimage : null;
  const publishedAt = parsePublishedAt(article.seendate);

  return {
    provider: 'gdelt',
    sourceUrl,
    sourceTitle: title.slice(0, 500),
    sourceDomain: parsedDomain,
    sourceImageUrl: imageUrl,
    category: categoryMatch.category,
    matchedTerms: categoryMatch.matchedTerms,
    relevanceScore: scoreStoryCandidate({
      domain: parsedDomain,
      imageUrl,
      matchedTerms: categoryMatch.matchedTerms,
      publishedAt,
    }),
    publishedAt,
  };
}

export async function fetchStoryRadarCandidates(): Promise<StoryRadarCandidate[]> {
  const url = new URL(GDELT_DOC_ENDPOINT);
  url.searchParams.set('query', buildGdeltQuery());
  url.searchParams.set('mode', 'ArtList');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', '250');
  url.searchParams.set('sort', 'datedesc');
  url.searchParams.set('timespan', '48h');

  let response: Response | null = null;

  for (let attempt = 1; attempt <= MAX_REQUEST_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('Story radar request timed out')), FETCH_TIMEOUT_MS);

    try {
      response = await fetch(url, {
        headers: { 'User-Agent': 'ScoopRYM-Story-Radar/1.0' },
        signal: controller.signal,
        cache: 'no-store',
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status !== 429 || attempt === MAX_REQUEST_ATTEMPTS) break;
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
  }

  if (!response?.ok) {
    throw new Error(`GDELT request failed with ${response?.status ?? 'no response'}`);
  }

  try {
    const payload = (await response.json()) as GdeltResponse;
    const deduplicated = new Map<string, StoryRadarCandidate>();

    for (const article of payload.articles ?? []) {
      const candidate = toCandidate(article);
      if (!candidate) continue;

      const existing = deduplicated.get(candidate.sourceUrl);
      if (!existing || candidate.relevanceScore > existing.relevanceScore) {
        deduplicated.set(candidate.sourceUrl, candidate);
      }
    }

    return [...deduplicated.values()].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 80);
  } catch (error) {
    throw new Error('GDELT returned an invalid response', { cause: error });
  }
}
