import { getDb } from '@/db';
import { generationAttempt, song as songTable, story as storyTable } from '@/db/schema';
import type { SongRecordingVersion } from '@/lib/songs/song-seo';
import { getSourceUrl } from '@/lib/urls/source-url';
import { and, asc, desc, eq, notInArray, sql } from 'drizzle-orm';

/**
 * 每首歌曲只暴露最近一次生成记录，避免一首歌重试后在列表查询中出现多行。
 */
export function createLatestGenerationAttemptQuery(db: ReturnType<typeof getDb>) {
  return db
    .select({
      id: generationAttempt.id,
      songId: generationAttempt.songId,
      prompt: generationAttempt.prompt,
      generationPrompt: generationAttempt.generationPrompt,
      coverArtPrompt: generationAttempt.coverArtPrompt,
      outputFormat: generationAttempt.outputFormat,
      audioFormat: generationAttempt.audioFormat,
      generationRequestHash: generationAttempt.generationRequestHash,
      generationBillingMode: generationAttempt.generationBillingMode,
      processingStatus: generationAttempt.processingStatus,
      processingError: generationAttempt.processingError,
      creditsDeducted: generationAttempt.creditsDeducted,
      creditError: generationAttempt.creditError,
      createdAt: generationAttempt.createdAt,
      updatedAt: generationAttempt.updatedAt,
      rowNumber: sql<number>`row_number() over (
        partition by ${generationAttempt.songId}
        order by ${generationAttempt.createdAt} desc, ${generationAttempt.id} desc
      )`.as('row_number'),
    })
    .from(generationAttempt)
    .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
    .as('latest_generation_attempt');
}

/** 同一新闻、同名的公开录音按首次发布时间稳定编号，避免向搜索引擎发布重复元数据。 */
export async function getPublishedSongRecordingVersion(
  db: ReturnType<typeof getDb>,
  current: {
    id: string;
    storyId: string;
    title: string;
    sourceUrl?: string | null;
    newsSummary?: string | null;
  }
): Promise<SongRecordingVersion | undefined> {
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const sourceUrl = getSourceUrl(current.sourceUrl) ? current.sourceUrl?.trim() : undefined;
  const sameStory = sourceUrl
    ? eq(storyTable.sourceUrl, sourceUrl)
    : current.newsSummary
      ? eq(storyTable.newsSummary, current.newsSummary)
      : eq(songTable.storyId, current.storyId);
  const rows = await db
    .select({ id: songTable.id })
    .from(songTable)
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        sameStory,
        eq(songTable.title, current.title),
        eq(songTable.isPublished, true),
        notInArray(latestAttempt.processingStatus, [
          'failed_generation',
          'processing_queue_failed',
          'failed_audio_upload',
          'failed_credit_deduction',
        ])
      )
    )
    .orderBy(asc(songTable.publishedAt), asc(songTable.createdAt), asc(songTable.id));

  if (rows.length < 2) return undefined;
  const index = rows.findIndex((row) => row.id === current.id);
  return index < 0 ? undefined : { number: index + 1, total: rows.length };
}
