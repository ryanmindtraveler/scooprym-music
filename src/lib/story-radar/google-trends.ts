import { load } from 'cheerio';
import { canonicalizeStoryUrl, classifyStoryHeadline, normalizeStoryDomain, scoreStoryCandidate } from './classifier';
import { describeFeedError, requestFeed } from './feed-request';
import type { GoogleTrendSignal, RadarSourceBatch, StoryRadarCandidate } from './types';

function feedUrl(region: string) {
  return `https://trends.google.com/trending/rss?geo=${encodeURIComponent(region)}`;
}

/** 顶层 item 是热搜，只有嵌套 news_item 才是可供编辑选材的媒体报道。 */
export function parseGoogleTrendsFeed(xml: string, region: string, now = new Date()): RadarSourceBatch {
  const $ = load(xml, { xmlMode: true });
  if (!$('rss > channel').length) throw new Error('Response is not a Trends RSS feed');
  const report: RadarSourceBatch['report'] = {
    name: `Google Trends (${region})`,
    url: feedUrl(region),
    status: 'empty',
    topics: 0,
    fetched: 0,
    accepted: 0,
    needsReview: 0,
    older: 0,
    invalid: 0,
    latestPublishedAt: null,
    durationMs: 0,
  };
  const byUrl = new Map<string, StoryRadarCandidate>();
  $('channel > item').each((_index, element) => {
    report.topics = (report.topics ?? 0) + 1;
    const item = $(element);
    const term = item.children('title').text().trim().slice(0, 500);
    const started = new Date(item.children('pubDate').text().trim());
    const signal: GoogleTrendSignal = {
      term,
      region,
      approximateTraffic: item.children('ht\\:approx_traffic').text().trim().slice(0, 50) || null,
      startedAt: Number.isFinite(started.getTime()) ? started.toISOString() : null,
      observedAt: now.toISOString(),
    };
    item.find('ht\\:news_item').each((_newsIndex, newsElement) => {
      report.fetched++;
      const news = $(newsElement);
      try {
        const title = news.children('ht\\:news_item_title').text().replace(/\s+/g, ' ').trim();
        if (!title || !term) throw new Error('Missing headline or trend');
        const sourceUrl = canonicalizeStoryUrl(news.children('ht\\:news_item_url').text().trim());
        const sourceDomain = normalizeStoryDomain(new URL(sourceUrl).hostname);
        // 不将 Google 搜索结果页当作原始新闻。
        if (sourceDomain === 'google.com' || sourceDomain.endsWith('.google.com'))
          throw new Error('Not an article URL');
        const previous = byUrl.get(sourceUrl);
        if (previous) {
          if (!previous.trendSignals?.some((entry) => entry.term === term && entry.region === region))
            previous.trendSignals?.push(signal);
          return;
        }
        const snippet = load(news.children('ht\\:news_item_snippet').text()).text().slice(0, 1500);
        const match = classifyStoryHeadline(`${title} ${snippet}`);
        const picture = news.children('ht\\:news_item_picture').text().trim();
        const imageUrl = picture.startsWith('https://') ? picture : null;
        byUrl.set(sourceUrl, {
          provider: 'google-trends',
          sourceUrl,
          sourceTitle: title.slice(0, 500),
          sourceDomain,
          sourceImageUrl: imageUrl,
          category: match?.category ?? 'internet_chaos',
          matchedTerms: match?.matchedTerms ?? [],
          // RSS 只提供热搜开始时间，不能伪造关联报道的发表日期。
          publishedAt: null,
          trendSignals: [signal],
          relevanceScore: match
            ? scoreStoryCandidate({
                domain: sourceDomain,
                imageUrl,
                matchedTerms: match.matchedTerms,
                publishedAt: null,
              })
            : 0,
        });
      } catch {
        report.invalid++;
      }
    });
  });
  const candidates = [...byUrl.values()];
  report.accepted = candidates.length;
  report.needsReview = candidates.filter((candidate) => !candidate.matchedTerms.length).length;
  report.status = candidates.length ? 'ok' : report.fetched ? 'failed' : 'empty';
  if (report.status === 'failed') report.error = 'No valid related news articles in this feed';
  return { candidates, report };
}

export function getGoogleTrendsRegions() {
  // 保留旧的单地区配置；每地区独立健康报告，单个地区失败不影响其他渠道。
  const regions = [
    ...new Set(
      (process.env.STORY_RADAR_GOOGLE_TRENDS_REGIONS || process.env.STORY_RADAR_GOOGLE_TRENDS_GEO || 'US')
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean)
    ),
  ].slice(0, 8);
  return regions.length ? regions : ['US'];
}

export async function fetchGoogleTrendsBatches() {
  return Promise.all(getGoogleTrendsRegions().map((region) => fetchGoogleTrendsBatch(region)));
}

export async function fetchGoogleTrendsBatch(
  region = (process.env.STORY_RADAR_GOOGLE_TRENDS_GEO || 'US').trim().toUpperCase()
): Promise<RadarSourceBatch> {
  const started = Date.now();
  const report: RadarSourceBatch['report'] = {
    name: `Google Trends (${region})`,
    url: feedUrl(region),
    status: 'disabled',
    fetched: 0,
    accepted: 0,
    needsReview: 0,
    older: 0,
    invalid: 0,
    latestPublishedAt: null,
    durationMs: 0,
  };
  if (process.env.STORY_RADAR_GOOGLE_TRENDS_ENABLED === 'false') return { candidates: [], report };
  try {
    if (!/^[A-Z]{2}$/.test(region)) throw new Error('Invalid Trends region');
    const response = await requestFeed(report.url);
    const batch = parseGoogleTrendsFeed(response.text, region);
    return { ...batch, report: { ...batch.report, httpStatus: response.status, durationMs: Date.now() - started } };
  } catch (error) {
    console.warn('[story-radar] Google Trends unavailable', describeFeedError(error));
    return {
      candidates: [],
      report: { ...report, status: 'failed', durationMs: Date.now() - started, ...describeFeedError(error) },
    };
  }
}
