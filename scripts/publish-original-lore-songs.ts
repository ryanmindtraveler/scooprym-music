import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { getDb } from '@/db';
import { song } from '@/db/schema';
import { historicalLoreSongIds } from '@/lib/internet-lore/song-catalog';
import { setSongPublication, setSongPublicationPlacement } from '@/lib/songs/publication-service';
/** 用户已指定的九首原歌恢复；默认事务回滚预检，--apply 才提交。 */
import { loadEnvConfig } from '@next/env';
import { inArray, sql } from 'drizzle-orm';

loadEnvConfig(process.cwd(), true);
const db = getDb();
const apply = process.argv.includes('--apply');
const topic = 'absurd-social-phenomena';
const ids = [...historicalLoreSongIds[topic]].sort();
const directory = 'F:/CodexHome/audits/lore-publication-2026-10-14';
const rollback = new Error('ROLLBACK_PREFLIGHT');
let report: unknown;

async function main() {
  if (ids.length !== 9 || new Set(ids).size !== 9) throw new Error('原歌名单不是预期的九首');
  // 共用线上数据库时，先确认生产应用已支持栏目隔离，防止旧版本将专题歌混入 Gallery。
  if (apply && !['localhost', '127.0.0.1', '::1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
    const response = await fetch(`https://scooprym.app/api/public/gallery?page=1&publication-check=${Date.now()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok || (await response.json()).publicationChannelsVersion !== 1) {
      throw new Error('生产应用尚未支持发布栏目隔离；请先上线已验证的新版本，再公开原歌。');
    }
  }
  await mkdir(directory, { recursive: true });
  const original = JSON.parse(await readFile(`${directory}/before.json`, 'utf8')).songs as {
    id: string;
    audio_hash: string;
    lyrics_hash: string;
    cover_hash: string;
  }[];
  try {
    await db.transaction(async (tx) => {
      const before = await tx
        .select({
          id: song.id,
          title: song.title,
          isPublished: song.isPublished,
          publicationChannel: song.publicationChannel,
          loreTopicSlug: song.loreTopicSlug,
          publishedAt: song.publishedAt,
          scheduledAt: song.scheduledAt,
          updatedAt: song.updatedAt,
          audioHash: sql<string>`md5(${song.audioUrl})`,
          lyricsHash: sql<string>`md5(coalesce(${song.lyrics}, ''))`,
          coverHash: sql<string>`md5(coalesce(${song.coverImageUrl}, ''))`,
        })
        .from(song)
        .where(inArray(song.id, ids))
        .orderBy(song.id)
        .for('update');
      if (before.length !== 9) throw new Error('原歌数量发生变化');
      for (const row of before) {
        const baseline = original.find((item) => item.id === row.id);
        if (
          !baseline ||
          baseline.audio_hash !== row.audioHash ||
          baseline.lyrics_hash !== row.lyricsHash ||
          baseline.cover_hash !== row.coverHash
        )
          throw new Error('原歌曲内容发生变化，停止恢复');
        if (
          row.scheduledAt ||
          (row.isPublished && (row.publicationChannel !== 'internet_lore' || row.loreTopicSlug !== topic))
        )
          throw new Error('原歌发布或排期被修改，停止恢复');
      }
      if (apply) await writeFile(`${directory}/publication-backup.json`, JSON.stringify(before, null, 2), 'utf8');
      const changed = [];
      const now = new Date();
      for (const id of ids) {
        await setSongPublicationPlacement(tx, id, { publicationChannel: 'internet_lore', loreTopicSlug: topic }, now);
        const published = await setSongPublication(tx, id, true, now);
        if (published) changed.push(published.id);
      }
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(song)
        .where(
          sql`${song.id} in (${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `
          )}) and ${song.isPublished} and ${song.publicationChannel} = 'internet_lore' and ${song.loreTopicSlug} = ${topic}`
        );
      if (count !== 9) throw new Error('九首原歌的栏目或公开状态不正确');
      report = { apply, topic, originalSongs: count, changed, audioLyricsCoverUnchanged: true };
      if (!apply) throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  await writeFile(
    `${directory}/${apply ? 'published' : 'publication-preflight'}.json`,
    JSON.stringify(report, null, 2),
    'utf8'
  );
  console.log(JSON.stringify(report));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : '原歌恢复失败');
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end({ timeout: 5 });
  });
