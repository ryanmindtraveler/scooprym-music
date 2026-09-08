import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRssSource, fetchRssStoryCandidates, parseRssFeed } from './rss';

const source = { name: 'Test', url: 'https://example.com/feed/', defaultCategory: 'internet_chaos' as const };
afterEach(() => vi.unstubAllGlobals());

describe('新闻源采集', () => {
  it('保留短标题和未命中关键词的有效报道，留给人工审核', () => {
    const { candidates, report } = parseRssFeed(
      '<rss><channel><item><title>Awards night</title><link>https://example.com/a</link></item></channel></rss>',
      source
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ matchedTerms: [], relevanceScore: 0 });
    expect(report).toMatchObject({ accepted: 1, needsReview: 1, status: 'ok' });
  });
  it('摘要补充分类上下文，兼容 Atom 链接及发布时间', () => {
    const { candidates } = parseRssFeed(
      '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>A creator changes everything</title><link rel="alternate" href="/article"/><summary>A TikTok prank went wrong</summary><published>2026-09-07T00:00:00Z</published></entry></feed>',
      source
    );
    expect(candidates[0]).toMatchObject({ sourceUrl: 'https://example.com/article', category: 'internet_chaos' });
    expect(candidates[0].matchedTerms).toContain('tiktok');
    expect(candidates[0].publishedAt?.toISOString()).toBe('2026-09-07T00:00:00.000Z');
  });
  it('旧闻保留并计数，不把缺失日期当作今天', () => {
    const { report, candidates } = parseRssFeed(
      '<rss><channel><item><title>Bizarre old story</title><link>https://example.com/old</link><pubDate>2026-01-01</pubDate></item><item><title>Another old story</title><link>https://example.com/unknown</link></item></channel></rss>',
      source,
      new Date('2026-09-07')
    );
    expect(report.older).toBe(1);
    expect(candidates[1].publishedAt).toBeNull();
  });
  it('拒绝伪装成成功的 HTML 页面，区分空订阅与无效条目', () => {
    expect(() => parseRssFeed('<html>Blocked</html>', source)).toThrow();
    expect(parseRssFeed('<rss><channel/></rss>', source).report.status).toBe('empty');
    expect(
      parseRssFeed('<rss><item><title>Invalid story</title><link>javascript:alert(1)</link></item></rss>', source)
        .report.status
    ).toBe('failed');
  });
  it('403 渠道不影响其他结果，并保留明确的故障报告', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', request);
    const result = await fetchRssSource(source);
    expect(result.report).toMatchObject({ status: 'failed', httpStatus: 403 });
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('所有渠道失败时仍返回逐源失败报告', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response(null, { status: 403 }))
    );
    const batches = await fetchRssStoryCandidates();
    expect(batches).toHaveLength(7);
    expect(batches.every((batch) => batch.report.status === 'failed')).toBe(true);
  });
});
