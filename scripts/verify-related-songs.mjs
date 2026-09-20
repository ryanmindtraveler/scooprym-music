import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import { load } from 'cheerio';
import postgres from 'postgres';

// 只读验证真实发布状态与服务器输出；不触发播放、不更改数据库。
nextEnv.loadEnvConfig(process.cwd());
const origin = process.argv[2];
assert(origin, '请提供待验证站点地址');
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  const songs = await sql`
    select s.id, s.story_id, s.title, s.is_published, s.audio_url, a.processing_status
    from scooprym.song s
    join lateral (
      select processing_status from scooprym.generation_attempt
      where song_id=s.id order by created_at desc, id desc limit 1
    ) a on true
  `;
  const eligible = (song) =>
    song.is_published &&
    song.audio_url?.trim() &&
    song.audio_url !== 'pending-stream' &&
    ['completed', 'completed_without_cover'].includes(song.processing_status);
  const normalize = (value) => value.trim().toLowerCase().replace(/[’‘]/g, "'");
  const published = songs.filter(eligible);
  const sample = published.find((song) =>
    published.some((other) => other.story_id === song.story_id && normalize(other.title) !== normalize(song.title))
  );
  assert(sample, '当前数据没有可验证的同题作品');
  const sitemap = await fetch(new URL('/sitemap.xml', origin));
  assert.equal(sitemap.status, 200);
  const xml = load(await sitemap.text(), { xmlMode: true });
  const urls = xml('loc')
    .map((_, node) => xml(node).text())
    .get();
  const sampleUrl = urls.find((url) => url.endsWith(sample.id));
  assert(sampleUrl, '候选歌曲未出现在 sitemap');
  const response = await fetch(new URL(new URL(sampleUrl).pathname, origin), { redirect: 'manual' });
  assert.equal(response.status, 200);
  const $ = load(await response.text());
  const links = $('section[aria-labelledby="related-songs-heading"] a')
    .map((_, node) => ({
      href: $(node).attr('href'),
      title: $(node).text().trim(),
    }))
    .get();
  assert(links.length > 0 && links.length <= 4, '推荐数量异常或未出现在服务器 HTML');
  const seen = new Set([normalize(sample.title)]);
  for (const link of links) {
    const related = songs.find((song) => link.href.endsWith(song.id));
    assert(related && eligible(related), '出现下架、失败或无音频作品');
    assert.equal(related.story_id, sample.story_id, '出现无关新闻作品');
    assert.notEqual(related.id, sample.id);
    assert(!seen.has(normalize(related.title)), '出现同名版本');
    seen.add(normalize(related.title));
    const target = await fetch(new URL(link.href, origin), { redirect: 'manual' });
    assert.equal(target.status, 200, '推荐地址不是直接可访问的规范页');
    await target.body?.cancel();
  }
  const home = await fetch(new URL('/', origin));
  assert.equal(home.status, 200);
  assert(!(await home.text()).includes('No news content available.'), '首页仍有旧占位文字');
  console.log(JSON.stringify({ passed: true, sample: sample.title, links }, null, 2));
} finally {
  await sql.end();
}
