/** 已有音频的封面恢复工具；默认只读，显式 --execute 后才生成封面，不发布歌曲。 */
import postgres from 'postgres';
import { processMusicJob } from '../src/lib/song-workflow';

async function main() {
  const execute = process.argv.includes('--execute');
  const ids = process.argv.slice(2).filter((arg) => arg !== '--execute');
  if (!ids.length || ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))) {
    throw new Error('请提供需要恢复的歌曲 UUID；默认只读，执行时增加 --execute。');
  }
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, connect_timeout: 15 });
  let failed = false;
  try {
    for (const songId of ids) {
      const [song] = await sql`
        select s.id, s.title, s.audio_url, s.audio_key, s.cover_image_key,
          a.id as attempt_id, a.processing_status
        from scooprym.song s
        join lateral (select id, processing_status from scooprym.generation_attempt
          where song_id=s.id order by created_at desc, id desc limit 1) a on true
        where s.id=${songId} and s.is_admin_generated=true`;
      if (
        !song?.audio_url ||
        !song.audio_key ||
        song.cover_image_key ||
        !song.processing_status?.startsWith('failed')
      ) {
        console.log(JSON.stringify({ songId, skipped: true, reason: '不满足已有音频、缺失封面且任务已失败的条件' }));
        continue;
      }
      console.log(JSON.stringify({ songId, title: song.title, action: execute ? '仅恢复封面' : '只读检查通过' }));
      if (!execute) continue;
      const claimed = await sql`
        update scooprym.generation_attempt set processing_status='audio_uploaded', processing_error=null, updated_at=now()
        where id=${song.attempt_id} and processing_status=${song.processing_status}
          and exists (select 1 from scooprym.song where id=${songId} and audio_key=${song.audio_key}
            and audio_url=${song.audio_url} and cover_image_key is null)
        returning id`;
      if (!claimed.length) throw new Error('歌曲状态已改变，停止恢复以避免重复任务。');
      const result = await processMusicJob(songId, { coverOnly: true });
      const [verified] = await sql`select audio_key, audio_url, cover_image_key from scooprym.song where id=${songId}`;
      const audioUnchanged = verified.audio_key === song.audio_key && verified.audio_url === song.audio_url;
      console.log(
        JSON.stringify({
          songId,
          success: result.success,
          status: result.processingStatus,
          audioUnchanged,
          coverStored: !!verified.cover_image_key,
          error: result.error,
        })
      );
      if (!result.success || !audioUnchanged || !verified.cover_image_key) failed = true;
    }
  } finally {
    await sql.end();
  }
  return failed ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : '恢复失败');
    process.exit(1);
  });
