// 定点清理截图歌曲的原始网页素材，不修改作品或其他新闻。
require('@next/env').loadEnvConfig(process.cwd());
const sql = require('postgres')(process.env.DATABASE_URL, { prepare: false, max: 1 });
const id = '9daf2bb1-5d24-408e-810f-f5cf85fe7e6a';
(async () => {
  const rows = await sql`select s.id, s.title, t.id as story_id, t.news_summary, t.source_url, length(t.source_text) as source_length,
    (select count(*)::int from scooprym.song x where x.story_id = t.id) as linked_songs
    from scooprym.song s join scooprym.story t on t.id = s.story_id where s.id = ${id}`;
  console.log(rows);
  if (rows.length !== 1 || rows[0].title !== 'Haywire' || !rows[0].source_url?.includes('viral-game-makes-you-find-a-needle')) {
    throw new Error('歌曲身份不匹配，停止修改');
  }
  if (process.argv.includes('--apply')) {
    await sql.begin(async (tx) => {
      if (rows[0].linked_songs !== 1) throw new Error('新闻素材由多首歌共享，停止修改');
      const updated = await tx`update scooprym.story set source_text = null
        where id = ${rows[0].story_id} and source_url = ${rows[0].source_url}
        returning id, source_text, news_summary, source_url`;
      if (updated.length !== 1) throw new Error('更新数量不符');
      console.log(updated);
    });
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => sql.end());
