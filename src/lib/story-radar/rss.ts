import { load } from 'cheerio';
import { canonicalizeStoryUrl, classifyStoryHeadline, normalizeStoryDomain, scoreStoryCandidate } from './classifier';
import { STORY_RADAR_RSS_SOURCES } from './config';
import type { StoryRadarCandidate } from './types';

const RSS_TIMEOUT_MS = 12_000;

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getItemImageUrl(item: ReturnType<ReturnType<typeof load>>) {
  const mediaUrl = item.find('media\\:content').first().attr('url');
  const thumbnailUrl = item.find('media\\:thumbnail').first().attr('url');
  const enclosure = item.find('enclosure').first();
  const enclosureUrl = enclosure.attr('type')?.startsWith('image/') ? enclosure.attr('url') : undefined;
  const candidate = mediaUrl || thumbnailUrl || enclosureUrl;
  return candidate?.startsWith('https://') ? candidate : null;
}

async function fetchRssSource(source: (typeof STORY_RADAR_RSS_SOURCES)[number]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`${source.name} RSS timed out`)), RSS_TIMEOUT_MS);

  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'ScoopRYM-Story-Radar/1.0' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`${source.name} RSS failed with ${response.status}`);

    const xml = await response.text();
    const $ = load(xml, { xmlMode: true });
    const candidates: StoryRadarCandidate[] = [];

    $('item').each((_index, element) => {
      const item = $(element);
      const title = item.find('title').first().text().replace(/\s+/g, ' ').trim();
      const rawUrl = item.find('link').first().text().trim() || item.find('guid').first().text().trim();
      if (title.length < 24 || !rawUrl) return;

      const categoryMatch =
        'defaultCategory' in source && source.defaultCategory
          ? { category: source.defaultCategory, matchedTerms: ['oddity editorial feed'] }
          : classifyStoryHeadline(title);
      if (!categoryMatch) return;

      try {
        const sourceUrl = canonicalizeStoryUrl(rawUrl);
        const sourceDomain = normalizeStoryDomain(new URL(sourceUrl).hostname);
        const sourceImageUrl = getItemImageUrl(item);
        const publishedAt = parseDate(item.find('pubDate').first().text().trim());

        candidates.push({
          provider: 'rss',
          sourceUrl,
          sourceTitle: title.slice(0, 500),
          sourceDomain,
          sourceImageUrl,
          category: categoryMatch.category,
          matchedTerms: categoryMatch.matchedTerms,
          relevanceScore: scoreStoryCandidate({
            domain: sourceDomain,
            imageUrl: sourceImageUrl,
            matchedTerms: categoryMatch.matchedTerms,
            publishedAt,
          }),
          publishedAt,
        });
      } catch {
        return;
      }
    });

    return candidates;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRssStoryCandidates() {
  const results = await Promise.allSettled(STORY_RADAR_RSS_SOURCES.map(fetchRssSource));
  const candidates = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const deduplicated = new Map<string, StoryRadarCandidate>();

  for (const candidate of candidates) {
    const existing = deduplicated.get(candidate.sourceUrl);
    if (!existing || candidate.relevanceScore > existing.relevanceScore) {
      deduplicated.set(candidate.sourceUrl, candidate);
    }
  }

  return [...deduplicated.values()].sort((a, b) => b.relevanceScore - a.relevanceScore);
}
