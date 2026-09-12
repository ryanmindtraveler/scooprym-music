import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';

// 只在事务临时表中运行真实迁移 SQL；不读写生产歌曲，测试结束全部回滚。
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const migration = readFileSync('src/db/migrations/0040_restore_legacy_song_publication.sql', 'utf8').replaceAll(
  '"scooprym".',
  'pg_temp.'
);
const rollback = new Error('测试完成后回滚临时表');

async function main() {
  try {
    await sql.begin(async (tx) => {
      await tx.unsafe(`
        CREATE TEMP TABLE song (id text PRIMARY KEY, story_id text, is_published boolean,
          created_at timestamp DEFAULT '2026-03-01', updated_at timestamp DEFAULT '2026-03-02',
          scheduled_at timestamp, audio_url text DEFAULT 'https://example.com/song.mp3', published_at timestamp);
        CREATE TEMP TABLE story (id text PRIMARY KEY);
        CREATE TEMP TABLE song_creation_run (song_id text);
        CREATE TEMP TABLE generation_attempt (id text PRIMARY KEY, song_id text, processing_status text,
          created_at timestamp DEFAULT '2026-03-01', updated_at timestamp DEFAULT '2026-03-02');
        INSERT INTO story VALUES ('story');
      `);
      const ids = [
        'legacy',
        'without-cover',
        'already-public',
        'new',
        'recently-hidden',
        'scheduled',
        'workflow',
        'failed',
        'missing-audio',
        'missing-story',
        'retry-failed',
        'recent-attempt',
      ];
      for (const id of ids) {
        await tx`INSERT INTO pg_temp.song (id, story_id, is_published) VALUES (${id}, 'story', false)`;
        await tx`INSERT INTO pg_temp.generation_attempt (id, song_id, processing_status) VALUES (${id}, ${id}, 'completed')`;
      }
      await tx.unsafe(`
        UPDATE pg_temp.generation_attempt SET processing_status='completed_without_cover' WHERE song_id='without-cover';
        UPDATE pg_temp.song SET is_published=true WHERE id='already-public';
        UPDATE pg_temp.song SET created_at='2026-09-06',updated_at='2026-09-06' WHERE id='new';
        UPDATE pg_temp.song SET updated_at='2026-09-10' WHERE id='recently-hidden';
        UPDATE pg_temp.song SET scheduled_at='2026-09-20' WHERE id='scheduled';
        INSERT INTO pg_temp.song_creation_run VALUES ('workflow');
        UPDATE pg_temp.generation_attempt SET processing_status='failed_generation' WHERE song_id='failed';
        UPDATE pg_temp.song SET audio_url='pending-stream' WHERE id='missing-audio';
        UPDATE pg_temp.song SET story_id='absent' WHERE id='missing-story';
        INSERT INTO pg_temp.generation_attempt VALUES ('new-failure','retry-failed','failed_generation','2026-03-05','2026-03-05');
        UPDATE pg_temp.generation_attempt SET updated_at='2026-09-10' WHERE song_id='recent-attempt';
      `);
      await tx.unsafe(migration);
      const visible = await tx`SELECT id FROM pg_temp.song WHERE is_published ORDER BY id`;
      assert.deepEqual(
        visible.map((row) => row.id),
        ['already-public', 'legacy', 'without-cover']
      );
      const restored = await tx`SELECT published_at, updated_at FROM pg_temp.song WHERE id='legacy'`;
      assert.equal(restored[0].published_at, null);
      await tx.unsafe(migration);
      assert.equal(
        (await tx`SELECT updated_at FROM pg_temp.song WHERE id='legacy'`)[0].updated_at.getTime(),
        restored[0].updated_at.getTime()
      );
      // 后续明确下架，不允许重复迁移将其恢复。
      await tx`UPDATE pg_temp.song SET is_published=false WHERE id='legacy'`;
      await tx.unsafe(migration);
      assert.equal((await tx`SELECT is_published FROM pg_temp.song WHERE id='legacy'`)[0].is_published, false);
      console.log('通过：12 类边界、重复执行、下架后重跑保护和历史发布日期保留。');
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error('迁移验证失败', error.code || error.name);
  process.exitCode = 1;
});
