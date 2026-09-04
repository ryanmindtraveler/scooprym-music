// 仅输出表结构和配置是否存在，绝不输出凭据。
require('@next/env').loadEnvConfig(process.cwd());
const postgres = require('postgres');
const fs = require('node:fs');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
(async () => {
  console.log({ databaseHost: new URL(process.env.DATABASE_URL).hostname,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    queueToken: !!process.env.QSTASH_TOKEN,
    signingKeys: !!process.env.QSTASH_CURRENT_SIGNING_KEY && !!process.env.QSTASH_NEXT_SIGNING_KEY });
  console.log(await sql`select to_regclass('scooprym.radar_creation_job') as queue_table,
    to_regclass('scooprym.hot_sheet_edition') as archive_table,
    to_regclass('drizzle.__drizzle_migrations') as migration_table`);
  if (process.argv.includes('--apply')) {
    // 仅补齐此功能的表，不推进迁移游标，避免跳过其他尚未执行的迁移。
    await sql.begin(async (tx) => {
      await tx.unsafe(fs.readFileSync('src/db/migrations/0034_radar_creation_jobs.sql', 'utf8'));
    });
    console.log(await sql`select column_name, data_type from information_schema.columns
      where table_schema = 'scooprym' and table_name = 'radar_creation_job' order by ordinal_position`);
    console.log(await sql`select count(*)::int as queued_records from scooprym.radar_creation_job`);
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => sql.end());
