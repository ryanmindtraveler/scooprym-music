import { getDb } from '@/db/index';
import { generationAttempt, song as songTable } from '@/db/schema';
import { canUseQStash, getWorkerUrl, qstash } from '@/lib/queue';
import { failWorkflowStep, getWorkflowRunBySongId, startWorkflowStage } from '@/lib/song-creation-workflow';
import { processMusicJob } from '@/lib/song-workflow';
import { and, desc, eq } from 'drizzle-orm';
import { after } from 'next/server';

export async function markMusicQueueFailure(songId: string, userId: string, error: unknown) {
  const db = await getDb();
  const message = (error instanceof Error ? error.message : String(error || 'Unable to schedule generation job')).slice(
    0,
    2000
  );
  const [attempt] = await db
    .select({ id: generationAttempt.id })
    .from(generationAttempt)
    .innerJoin(songTable, eq(songTable.id, generationAttempt.songId))
    .where(and(eq(generationAttempt.songId, songId), eq(songTable.userId, userId)))
    .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
    .limit(1);
  if (!attempt) return;

  await db
    .update(generationAttempt)
    .set({ processingStatus: 'processing_queue_failed', processingError: message, updatedAt: new Date() })
    .where(and(eq(generationAttempt.id, attempt.id), eq(generationAttempt.processingStatus, 'queued')));

  const run = await getWorkflowRunBySongId(songId).catch(() => undefined);
  if (run) {
    const stepId = await startWorkflowStage(run.id, 'queued_audio', { runStatus: 'queued' });
    await failWorkflowStep(run.id, stepId, error);
  }
}

/** QStash 优先，Next.js after() 降级；创建与重试入口共用同一分发规则。 */
export async function dispatchMusicJob(songId: string, userId: string) {
  const db = await getDb();
  const [attempt] = await db
    .select({ id: generationAttempt.id })
    .from(generationAttempt)
    .innerJoin(songTable, eq(songTable.id, generationAttempt.songId))
    .where(and(eq(generationAttempt.songId, songId), eq(songTable.userId, userId)))
    .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
    .limit(1);
  if (!attempt) throw new Error('The queued generation attempt does not exist');

  if (canUseQStash()) {
    try {
      const response = await qstash.publishJSON({
        url: getWorkerUrl('/api/worker/generate-music'),
        body: { songId },
        // 同一尝试的重复提交必须去重；显式重试会创建新的 attempt，因此仍能正常入队。
        deduplicationId: `scooprym-music-${attempt.id}`,
        flowControl: { key: 'scooprym-music-production', parallelism: 2 },
        retries: 3,
      });
      console.log(`[generate-music] Queued ${songId} in QStash (${response.messageId})`);
      return 'qstash';
    } catch (error) {
      console.error(`[generate-music] QStash publish failed for ${songId}; using Next.js after().`, error);
    }
  }

  try {
    after(async () => {
      const result = await processMusicJob(songId);
      if (result.retryable) {
        await markMusicQueueFailure(songId, userId, result.error).catch((error) => {
          console.error(`[generate-music] Unable to persist local queue failure for ${songId}:`, error);
        });
      }
    });
    return 'next-after';
  } catch (error) {
    await markMusicQueueFailure(songId, userId, error);
    throw error;
  }
}
