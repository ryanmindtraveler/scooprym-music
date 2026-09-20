import assert from 'node:assert/strict';
import { load } from 'cheerio';

// 不执行现用写接口；POST 仅发送到已经退出的四个端点。
const origin = process.argv[2];
assert(origin, '用法：node scripts/verify-retired-routes.mjs <origin>');
const pages = [
  '/features/gossip-roast',
  '/blog',
  '/blog/category/test',
  '/changelog',
  '/docs',
  '/docs/intro',
  '/waitlist',
  '/roadmap',
  '/ai/text',
  '/ai/chat',
  '/ai/image',
  '/ai/audio',
  '/ai/video',
  '/magicui',
  '/blocks/features',
  '/preview/features/one',
  '/zh/docs',
  '/en/roadmap',
];
const apis = ['/api/chat', '/api/analyze-content', '/api/search', '/api/generate/image'];
for (const path of pages) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual' });
  assert.equal(response.status, 410, path);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  assert(!(await response.text()).includes('rel="canonical"'), '弃用页不应声明规范地址');
}
for (const path of apis) {
  for (const method of ['GET', 'POST', 'OPTIONS']) {
    const response = await fetch(new URL(path, origin), { method, redirect: 'manual' });
    assert.equal(response.status, 410, `${method} ${path}`);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    assert.equal((await response.json()).error, 'This endpoint has been retired.');
  }
}
const pricing = await fetch(new URL('/pricing', origin), { redirect: 'manual' });
assert([307, 308].includes(pricing.status), '未登录定价页必须服务端跳转');
assert.equal(new URL(pricing.headers.get('location'), origin).pathname, '/auth/login');
const sitemap = load(await (await fetch(new URL('/sitemap.xml', origin))).text(), { xmlMode: true });
for (const url of sitemap('loc')
  .map((_, element) => sitemap(element).text())
  .get()) {
  assert(!/^\/(features|blog|docs|ai|pricing|roadmap|waitlist|changelog)(\/|$)/.test(new URL(url).pathname), url);
}
for (const path of ['/', '/songs', '/about', '/contact']) {
  assert.equal((await fetch(new URL(path, origin), { redirect: 'manual' })).status, 200, path);
}
console.log(`通过：${pages.length} 个旧页面、4 个旧 API × 3 种方法均 410；定价页登录限制、sitemap 和现用页面正常。`);
