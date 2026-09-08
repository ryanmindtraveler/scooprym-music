import { canonicalizeStoryUrl, classifyStoryHeadline, normalizeStoryDomain, scoreStoryCandidate } from './classifier';
import { STORY_RADAR_CATEGORY_CONFIG } from './config';
import { describeFeedError, requestFeed } from './feed-request';
import type { RadarSourceBatch, StoryRadarCandidate } from './types';

const GDELT_DOC_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const FETCH_TIMEOUT_MS = 15_000;
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
  if (!article || typeof article !== 'object') return null;
  if (typeof article.url !== 'string' || typeof article.title !== 'string') return null;
  const title = article.title.replace(/\s+/g, ' ').trim();
  if (title.length < 5) return null;

  const categoryMatch = classifyStoryHeadline(title);

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
    category: categoryMatch?.category ?? 'internet_chaos',
    matchedTerms: categoryMatch?.matchedTerms ?? [],
    relevanceScore: categoryMatch
      ? scoreStoryCandidate({
          domain: parsedDomain,
          imageUrl,
          matchedTerms: categoryMatch.matchedTerms,
          publishedAt,
        })
      : 0,
    publishedAt,
  };
}

export async function fetchGdeltBatch(): Promise<RadarSourceBatch> {
  const started = Date.now();
  const url = new URL(GDELT_DOC_ENDPOINT);
  url.searchParams.set('query', buildGdeltQuery());
  url.searchParams.set('mode', 'ArtList');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', '250');
  url.searchParams.set('sort', 'datedesc');
  url.searchParams.set('timespan', '48h');

  const report: RadarSourceBatch['report'] = {
    name: 'GDELT',
    url: GDELT_DOC_ENDPOINT,
    status: 'disabled',
    fetched: 0,
    accepted: 0,
    needsReview: 0,
    older: 0,
    invalid: 0,
    latestPublishedAt: null,
    durationMs: 0,
  };
  if (process.env.STORY_RADAR_GDELT_ENABLED !== 'true') return { candidates: [], report };
  try {
    const response = await requestFeed(url.toString(), FETCH_TIMEOUT_MS, MAX_REQUEST_ATTEMPTS, 6000);
    const payload = JSON.parse(response.text) as GdeltResponse;
    if (!Array.isArray(payload.articles)) throw new Error('Missing GDELT article list');
    const deduplicated = new Map<string, StoryRadarCandidate>();
    for (const article of payload.articles) {
      const candidate = toCandidate(article);
      if (!candidate) continue;

      const existing = deduplicated.get(candidate.sourceUrl);
      if (!existing || candidate.relevanceScore > existing.relevanceScore) {
        deduplicated.set(candidate.sourceUrl, candidate);
      }
    }

    const candidates = [...deduplicated.values()];
    const dates = candidates
      .flatMap((candidate) => (candidate.publishedAt ? [candidate.publishedAt.toISOString()] : []))
      .sort();
    return {
      candidates,
      report: {
        ...report,
        status: candidates.length ? 'ok' : payload.articles.length ? 'failed' : 'empty',
        httpStatus: response.status,
        fetched: payload.articles.length,
        accepted: candidates.length,
        invalid: payload.articles.length - candidates.length,
        needsReview: candidates.filter((candidate) => candidate.matchedTerms.length === 0).length,
        latestPublishedAt: dates.at(-1) ?? null,
        durationMs: Date.now() - started,
      },
    };
  } catch (error) {
    console.warn('[story-radar] GDELT unavailable', describeFeedError(error));
    return {
      candidates: [],
      report: { ...report, status: 'failed', durationMs: Date.now() - started, ...describeFeedError(error) },
    };
  }
}
