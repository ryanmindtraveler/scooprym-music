import { getDb } from '@/db';
import { generationAttempt } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

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
