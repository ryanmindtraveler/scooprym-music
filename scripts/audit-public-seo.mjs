import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { load } from 'cheerio';

// 只读全量验收：并发限制为 3，不访问站点地图以外的私人页面。
const [origin, output] = process.argv.slice(2);
assert(origin && output, '用法：node scripts/audit-public-seo.mjs <origin> <报告.json>');
const sitemapResponse = await fetch(new URL('/sitemap.xml', origin));
assert.equal(sitemapResponse.status, 200, '站点地图无法访问');
const xml = load(await sitemapResponse.text(), { xmlMode: true });
const urls = xml('loc')
  .map((_, node) => xml(node).text())
  .get();
assert(urls.length > 0 && urls.length <= 5000, '站点地图数量异常');
let cursor = 0;
const results = [];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (cursor < urls.length) {
      const expected = new URL(urls[cursor++]);
      const request = new URL(expected.pathname + expected.search, origin);
      try {
        const response = await fetch(request, { redirect: 'manual', signal: AbortSignal.timeout(60_000) });
        const $ = load(await response.text());
        const canonical = $('link[rel="canonical"]').attr('href');
        const robots = `${$('meta[name="robots"]').attr('content') || ''} ${response.headers.get('x-robots-tag') || ''}`;
        const issues = [];
        if (response.status !== 200) issues.push(`HTTP ${response.status}`);
        if (
          !canonical ||
          new URL(canonical).origin !== expected.origin ||
          new URL(canonical).pathname !== expected.pathname ||
          new URL(canonical).search !== expected.search
        )
          issues.push('canonical 不匹配');
        if (/noindex/i.test(robots)) issues.push('被禁止索引');
        const title = $('title').text();
        if (!title) issues.push('缺失标题');
        results.push({
          url: expected.href,
          status: response.status,
          canonical,
          title,
          description: $('meta[name="description"]').attr('content'),
          h1: $('h1')
            .map((_, node) => $(node).text())
            .get(),
          issues,
        });
      } catch (error) {
        results.push({ url: expected.href, issues: [error.message] });
      }
      if (results.length % 40 === 0) console.log(`已检查 ${results.length}/${urls.length}`);
    }
  })
);
const failures = results.filter((result) => result.issues.length);
await writeFile(
  output,
  JSON.stringify({ checkedAt: new Date().toISOString(), total: results.length, failures, results }, null, 2),
  'utf8'
);
console.log(JSON.stringify({ total: results.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
