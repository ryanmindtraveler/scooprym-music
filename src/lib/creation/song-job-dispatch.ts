import { getDb } from '@/db/index';
import { generationAttempt, song as songTable } from '@/db/schema';
import { failWorkflowStep, getWorkflowRunBySongId, startWorkflowStage } from '@/lib/creation/song-creation-workflow';
import { processMusicJob } from '@/lib/creation/song-workflow';
import { canUseQStash, getWorkerUrl, qstash } from '@/lib/infrastructure/queue';
import { and, desc, eq, inArray } from 'drizzle-orm';
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
    .where(
      and(
        eq(generationAttempt.id, attempt.id),
        inArray(generationAttempt.processingStatus, ['queued', 'audio_generated', 'audio_uploaded'])
      )
    );

  const run = await getWorkflowRunBySongId(songId).catch(() => undefined);
  if (run) {
    const stepId = await startWorkflowStage(run.id, 'queued_audio', { runStatus: 'queued' });
    await failWorkflowStep(run.id, stepId, error);
  }
}

/** 生产环境必须使用持久队列；after() 仅供本地开发降级。 */
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
        body: { songId, attemptId: attempt.id },
        // 同一尝试的重复提交必须去重；显式重试会创建新的 attempt，因此仍能正常入队。
        deduplicationId: `scooprym-music-${attempt.id}`,
        flowControl: { key: 'scooprym-music-production', parallelism: 2 },
        retries: 3,
      });
      console.log(`[generate-music] Queued ${songId} in QStash (${response.messageId})`);
      return 'qstash';
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        await markMusicQueueFailure(songId, userId, error);
        throw error;
      }
      console.error(`[generate-music] QStash publish failed for ${songId}; using Next.js after().`, error);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const error = new Error('Persistent music queue is not configured. Please check QStash settings and retry.');
    await markMusicQueueFailure(songId, userId, error);
    throw error;
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
