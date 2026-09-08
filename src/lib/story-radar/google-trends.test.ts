import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchGoogleTrendsBatch,
  fetchGoogleTrendsBatches,
  getGoogleTrendsRegions,
  parseGoogleTrendsFeed,
} from './google-trends';
import { mergeRadarBatches } from './index';

const now = new Date('2026-09-07T06:00:00Z');
const news = (url: string, title = 'Singer announces surprise album') =>
  `<ht:news_item><ht:news_item_title>${title}</ht:news_item_title><ht:news_item_url>${url}</ht:news_item_url><ht:news_item_snippet>A viral TikTok clip sparked the announcement</ht:news_item_snippet><ht:news_item_picture>https://example.com/image.jpg</ht:news_item_picture></ht:news_item>`;
const topic = (term: string, articles: string) =>
  `<item><title>${term}</title><link>https://trends.google.com/trending?geo=US</link><pubDate>Mon, 07 Sep 2026 00:00:00 GMT</pubDate><ht:approx_traffic>20,000+</ht:approx_traffic>${articles}</item>`;
const feed = (items: string) =>
  `<rss xmlns:ht="https://trends.google.com/trending/rss" version="2.0"><channel>${items}</channel></rss>`;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Google Trends 关联新闻', () => {
  it('多地区配置去重，失败地区不影响成功地区', async () => {
    vi.stubEnv('STORY_RADAR_GOOGLE_TRENDS_REGIONS', ' us, TW,us,HK ');
    expect(getGoogleTrendsRegions()).toEqual(['US', 'TW', 'HK']);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        String(url).includes('geo=HK')
          ? new Response('Denied', { status: 403 })
          : new Response(feed(topic('test', news('https://example.com/a'))))
      )
    );
    const batches = await fetchGoogleTrendsBatches();
    expect(batches.map((batch) => batch.report.status)).toEqual(['ok', 'ok', 'failed']);
    expect(mergeRadarBatches(batches).candidates[0].trendSignals?.map((signal) => signal.region)).toEqual(['US', 'TW']);
  });
  it('展开关联报道，保留热搜词和热度，不把趋势时间当新闻日期', () => {
    const batch = parseGoogleTrendsFeed(
      feed(topic('surprise album', news('https://example.com/a?utm_source=google') + news('https://example.com/b'))),
      'US',
      now
    );
    expect(batch.report).toMatchObject({ topics: 1, fetched: 2, accepted: 2, status: 'ok', latestPublishedAt: null });
    expect(batch.candidates[0]).toMatchObject({
      sourceUrl: 'https://example.com/a',
      publishedAt: null,
      matchedTerms: expect.arrayContaining(['tiktok']),
      trendSignals: [
        {
          term: 'surprise album',
          region: 'US',
          approximateTraffic: '20,000+',
          startedAt: '2026-09-07T00:00:00.000Z',
          observedAt: now.toISOString(),
        },
      ],
    });
  });
  it('同篇新闻关联多个热搜时只保存一条报道和多个线索', () => {
    const batch = parseGoogleTrendsFeed(
      feed(topic('first', news('https://example.com/a')) + topic('second', news('https://example.com/a'))),
      'US',
      now
    );
    expect(batch.candidates).toHaveLength(1);
    expect(batch.candidates[0].trendSignals?.map((signal) => signal.term)).toEqual(['first', 'second']);
    expect(batch.report.invalid).toBe(0);
  });
  it('拒绝无效链接，空热搜不生成虚构新闻，非RSS页面失败', () => {
    const batch = parseGoogleTrendsFeed(
      feed(topic('test', news('javascript:alert(1)') + news('https://trends.google.com/trending'))),
      'US',
      now
    );
    expect(batch.report).toMatchObject({ status: 'failed', invalid: 2, accepted: 0 });
    expect(parseGoogleTrendsFeed(feed(topic('empty', '')), 'US', now).report.status).toBe('empty');
    expect(() => parseGoogleTrendsFeed('<html>blocked</html>', 'US', now)).toThrow();
  });
  it('与媒体RSS重合时保留原始日期、来源并附加Trends线索，顺序无关', () => {
    const trends = parseGoogleTrendsFeed(feed(topic('album', news('https://example.com/a'))), 'US', now);
    const direct = {
      ...trends,
      candidates: [
        {
          ...trends.candidates[0],
          provider: 'rss' as const,
          publishedAt: new Date('2026-09-06'),
          trendSignals: undefined,
          relevanceScore: 1,
        },
      ],
    };
    for (const batches of [
      [direct, trends],
      [trends, direct],
    ]) {
      const result = mergeRadarBatches(batches);
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0]).toMatchObject({
        provider: 'rss',
        publishedAt: new Date('2026-09-06'),
        trendSignals: trends.candidates[0].trendSignals,
      });
    }
  });
  it('默认使用美国区且可关闭；上游拒绝作为渠道失败返回', async () => {
    vi.stubEnv('STORY_RADAR_GOOGLE_TRENDS_ENABLED', 'true');
    vi.stubEnv('STORY_RADAR_GOOGLE_TRENDS_GEO', '');
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 403 }));
    vi.stubGlobal('fetch', fetcher);
    expect((await fetchGoogleTrendsBatch()).report).toMatchObject({
      name: 'Google Trends (US)',
      status: 'failed',
      httpStatus: 403,
    });
    expect(fetcher.mock.calls[0][0]).toBe('https://trends.google.com/trending/rss?geo=US');
    vi.stubEnv('STORY_RADAR_GOOGLE_TRENDS_ENABLED', 'false');
    expect((await fetchGoogleTrendsBatch()).report.status).toBe('disabled');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
