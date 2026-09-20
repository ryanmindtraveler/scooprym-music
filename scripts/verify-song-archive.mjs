import assert from 'node:assert/strict';
import { load } from 'cheerio';

// 沿真实分页链接遍历原始 HTML；无需 JavaScript 点击，也不能越界抓取。
const origin = process.argv[2];
assert(origin, '用法：node scripts/verify-song-archive.mjs <origin>');
const ids = new Set();
const visited = new Set();
let path = '/songs';
while (path) {
  assert(!visited.has(path), '分页出现循环');
  assert(visited.size < 100, '超过检查上限');
  visited.add(path);
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(60_000) });
  assert.equal(response.status, 200, `${path} 无法访问`);
  const $ = load(await response.text());
  const canonical = new URL($('link[rel="canonical"]').attr('href'));
  assert.equal(canonical.pathname + canonical.search, path, '分页 canonical 错误');
  assert(!($('meta[name="robots"]').attr('content') || '').includes('noindex'), '公开分页被禁止收录');
  const links = new Set(
    $('main a[href*="/songs/"]')
      .map((_, node) => $(node).attr('href'))
      .get()
  );
  for (const link of links) {
    const id = new URL(link, origin).pathname.slice(-36);
    assert(!ids.has(id), '不同分页重复出现歌曲');
    ids.add(id);
  }
  console.log(`通过 ${path}：${links.size} 首`);
  const next = $('nav[aria-label="Song archive pages"] a')
    .filter((_, node) => $(node).text() === 'Next')
    .attr('href');
  path = next || '';
}
for (const id of ['e64e85ac-19ff-4ca2-bc06-8429c9a569e4', '35801181-3fd9-45c4-b170-d411ead20d1c']) {
  assert(!ids.has(id), '未发布歌曲进入公开曲库');
}
const invalid = await fetch(new URL('/songs?page=0', origin));
assert.equal(invalid.status, 404, '非法页码应返回 404');
const overflow = await fetch(new URL(`/songs?page=${visited.size + 1}`, origin));
assert.equal(overflow.status, 404, '越界页码应返回 404');
console.log(`曲库检查通过：${visited.size} 页，${ids.size} 首，无重复。`);
