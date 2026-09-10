import assert from 'node:assert/strict';

// 只读回归检查：传入待验证环境和一条已发布歌曲的规范路径。
const [origin, songPath] = process.argv.slice(2);
assert(
  origin && songPath?.startsWith('/songs/'),
  '用法：node scripts/verify-song-http-seo.mjs <origin> </songs/canonical-slug>'
);
const id = songPath.slice(-36);
assert(/^[0-9a-f-]{36}$/i.test(id), '歌曲路径必须包含 UUID');

async function check(path, status) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(60_000) });
  const html = await response.text();
  assert.equal(response.status, status, `${path} HTTP 状态错误`);
  console.log(`通过：${status} ${path}`);
  return { response, html };
}

const missing = await check('/songs/missing-00000000-0000-0000-0000-000000000000', 404);
assert(!/rel="canonical"/.test(missing.html), '404 不应输出规范页面链接');
assert(/name="robots" content="[^"]*noindex/.test(missing.html), '404 必须禁止索引');
const old = await check(`/songs/old-title-${id}`, 308);
assert.equal(new URL(old.response.headers.get('location'), origin).pathname, songPath, '旧标题未跳转至规范地址');
const current = await check(songPath, 200);
assert(current.html.includes(`rel="canonical" href="${new URL(songPath, origin).href}"`), '正式页面 canonical 不正确');
assert(!/name="robots" content="[^"]*noindex/.test(current.html), '正式页面不应禁止索引');
const localized = await check(`/zh${songPath}`, 308);
assert.equal(new URL(localized.response.headers.get('location'), origin).pathname, songPath, '语言别名未合并');
