import nextEnv from '@next/env';
import postgres from 'postgres';

// 仅纠正已核实的错配；不改歌词、音频、发布状态，也不编造新闻来源。
// 默认只读，确认输出后使用 --apply。原记录保留，便于恢复关联。
nextEnv.loadEnvConfig(process.cwd());
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const songId = '8155fdcb-1ef0-456e-9a9b-a7b4c7a52d68';
const incorrectStoryId = '2eb4b9cc-aee9-4ca7-8829-578e7f5f5a89';

try {
  await sql.begin(async (tx) => {
    const [song] = await tx`select id, title, story_id, is_published from scooprym.song where id=${songId} for update`;
    if (!song) throw new Error('目标歌曲不存在');
    if (song.story_id === songId) {
      console.log('关联已修复，无须重复执行');
      return;
    }
    if (song.story_id !== incorrectStoryId || song.title !== 'Bond’s Bold Blonde') {
      throw new Error('数据已变化，停止修复');
    }
    console.log(
      JSON.stringify({
        songId,
        previousStoryId: incorrectStoryId,
        correctedStoryId: songId,
        isPublished: song.is_published,
      })
    );
    if (!process.argv.includes('--apply')) return;
    // 新建无来源记录，使用页面真实歌名兜底；原新闻仍供其对应的另一首歌曲使用。
    await tx`insert into scooprym.story (id) values (${songId})`;
    await tx`update scooprym.song set story_id=${songId}, updated_at=now() where id=${songId} and story_id=${incorrectStoryId}`;
    console.log('已解除错误新闻关联，发布状态未修改');
  });
} finally {
  await sql.end();
}
