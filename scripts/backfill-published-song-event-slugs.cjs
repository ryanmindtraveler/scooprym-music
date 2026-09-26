// 将缺事件摘要的早期已发布歌曲切换为事件词 slug；旧 slug 在路由层保留 308 跳转。
const { loadEnvConfig } = require('@next/env');
const postgres = require('postgres');
const slugs = require('../src/lib/songs/legacy-story-song-slugs.json');

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('缺少 DATABASE_URL');
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
  try {
    let changed = 0;
    await sql.begin(async (tx) => {
      const targetSlugs = slugs.map(({ slug }) => slug);
      if (new Set(targetSlugs).size !== targetSlugs.length) {
        throw new Error('目标 slug 有重复');
      }

      const conflicts = await tx`
        SELECT id, seo_slug FROM scooprym.song
        WHERE seo_slug IN ${tx(targetSlugs)}
          AND id NOT IN ${tx(slugs.map(({ id }) => id))}
      `;
      if (conflicts.length) {
        throw new Error(`目标 slug 已被其他歌曲占用：${conflicts.map((row) => row.seo_slug).join(', ')}`);
      }

      for (const { id, old, slug } of slugs) {
        const rows = await tx`
          SELECT seo_slug, is_published FROM scooprym.song WHERE id = ${id} FOR UPDATE
        `;
        if (rows.length !== 1 || !rows[0].is_published) {
          throw new Error(`找不到对应已发布歌曲：${id}`);
        }
        if (rows[0].seo_slug === slug) continue;
        if (rows[0].seo_slug !== old) {
          throw new Error(`原 slug 与预期不一致：${id} (${rows[0].seo_slug})`);
        }
        await tx`UPDATE scooprym.song SET seo_slug = ${slug}, updated_at = now() WHERE id = ${id}`;
        changed += 1;
      }
    });
    console.log(`共核对 ${slugs.length} 首歌曲，本次更新 ${changed} 个事件词 slug。`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
