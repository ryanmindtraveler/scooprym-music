import { load } from 'cheerio';
import {
  canonicalizeStoryUrl,
  classifyStoryHeadline,
  getStoryFreshness,
  normalizeStoryDomain,
  scoreStoryCandidate,
} from './classifier';
import { STORY_RADAR_RSS_SOURCES } from './config';
import { describeFeedError, requestFeed } from './feed-request';
import type { RadarSourceBatch, RadarSourceReport, StoryRadarCandidate, StoryRadarCategory } from './types';

interface RssSource {
  name: string;
  url: string;
  defaultCategory: StoryRadarCategory;
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function parseRssFeed(xml: string, source: RssSource, now = new Date()): RadarSourceBatch {
  const $ = load(xml, { xmlMode: true });
  if (!$('rss, feed, rdf\\:RDF').length) throw new Error('Response is not RSS or Atom');
  const candidates: StoryRadarCandidate[] = [];
  const report: RadarSourceReport = {
    name: source.name,
    url: source.url,
    status: 'empty',
    fetched: 0,
    accepted: 0,
    needsReview: 0,
    older: 0,
    invalid: 0,
    latestPublishedAt: null,
    durationMs: 0,
  };
  const seen = new Set<string>();
  $('item, entry').each((_index, element) => {
    report.fetched++;
    const item = $(element);
    const title = item.find('title').first().text().replace(/\s+/g, ' ').trim();
    const atomLink = item.find('link[rel="alternate"][href], link:not([rel])[href]').first().attr('href');
    const rawUrl = atomLink || item.find('link').first().text().trim() || item.find('guid, id').first().text().trim();
    try {
      if (title.length < 5 || !rawUrl) throw new Error('Missing article title or URL');
      const sourceUrl = canonicalizeStoryUrl(new URL(rawUrl, source.url).toString());
      if (seen.has(sourceUrl)) return;
      seen.add(sourceUrl);
      const publishedAt = parseDate(item.find('pubDate, published, dc\\:date').first().text().trim());
      if (publishedAt && (!report.latestPublishedAt || publishedAt > new Date(report.latestPublishedAt))) {
        report.latestPublishedAt = publishedAt.toISOString();
      }
      // 摘要只用于补足标题上下文；正文 HTML 不入库，不直接渲染。
      const description = load(item.find('description, summary').first().text()).text().slice(0, 1500);
      const match = classifyStoryHeadline(`${title} ${description}`);
      const sourceDomain = normalizeStoryDomain(new URL(sourceUrl).hostname);
      const media =
        item
          .find('media\\:content[medium="image"], media\\:thumbnail, enclosure[type^="image/"]')
          .first()
          .attr('url') || item.find('media\\:content[type^="image/"]').first().attr('url');
      const sourceImageUrl = media?.startsWith('https://') ? media : null;
      const matchedTerms = match?.matchedTerms ?? [];
      if (!match) report.needsReview++;
      if (getStoryFreshness(publishedAt, now) === 'older') report.older++;
      candidates.push({
        provider: 'rss',
        sourceUrl,
        sourceTitle: title.slice(0, 500),
        sourceDomain,
        sourceImageUrl,
        category: match?.category ?? source.defaultCategory,
        matchedTerms,
        publishedAt,
        relevanceScore: match
          ? scoreStoryCandidate({ domain: sourceDomain, imageUrl: sourceImageUrl, matchedTerms, publishedAt })
          : 0,
      });
    } catch {
      report.invalid++;
    }
  });
  report.accepted = candidates.length;
  // 有条目但全部格式错误不能伪装成正常的空订阅源。
  report.status = candidates.length ? 'ok' : report.fetched ? 'failed' : 'empty';
  if (report.status === 'failed') report.error = 'No valid article entries in this feed';
  return { candidates, report };
}

export async function fetchRssSource(source: RssSource): Promise<RadarSourceBatch> {
  const started = Date.now();
  try {
    const response = await requestFeed(source.url);
    const batch = parseRssFeed(response.text, source);
    return { ...batch, report: { ...batch.report, durationMs: Date.now() - started, httpStatus: response.status } };
  } catch (error) {
    console.warn('[story-radar] Source unavailable', source.name, describeFeedError(error));
    return {
      candidates: [],
      report: {
        name: source.name,
        url: source.url,
        status: 'failed',
        fetched: 0,
        accepted: 0,
        needsReview: 0,
        older: 0,
        invalid: 0,
        latestPublishedAt: null,
        durationMs: Date.now() - started,
        ...describeFeedError(error),
      },
    };
  }
}

export async function fetchRssStoryCandidates() {
  return Promise.all(STORY_RADAR_RSS_SOURCES.map(fetchRssSource));
}
