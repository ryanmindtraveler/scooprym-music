import 'server-only';
import { getDb } from '@/db';
import { generationAttempt, song, story, storyCandidate } from '@/db/schema';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

/** 同时兼容雷达关联的新闻和从工作台按同一来源链接创作的历史歌曲。 */
export async function getRadarGeneratedSongs(candidateIds?: string[]) {
  if (candidateIds?.length === 0) return [];
  const db = await getDb();
  return db
    .select({
      candidateId: storyCandidate.id,
      id: song.id,
      title: song.title,
      audioUrl: song.audioUrl,
      isPublished: song.isPublished,
    })
    .from(storyCandidate)
    .innerJoin(story, or(eq(story.id, storyCandidate.storyId), eq(story.sourceUrl, storyCandidate.sourceUrl)))
    .innerJoin(song, eq(song.storyId, story.id))
    .where(
      and(
        candidateIds ? inArray(storyCandidate.id, candidateIds) : undefined,
        sql`${song.audioUrl} ~ '^https?://'`,
        // 必须检查最新制作结果，不能把已写歌词、音频中间产物或失败任务当成完成。
        sql`coalesce((select ${generationAttempt.processingStatus} from ${generationAttempt}
        where ${generationAttempt.songId} = ${song.id}
        order by ${generationAttempt.createdAt} desc, ${generationAttempt.id} desc limit 1),
        case when ${song.isPublished} then 'completed' else '' end) = 'completed'`
      )
    )
    .orderBy(desc(song.createdAt), desc(song.id));
}
