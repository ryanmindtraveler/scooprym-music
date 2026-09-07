import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { radarCreationJob, storyCandidate } from '@/db/schema';
import { canUseQStash, getWorkerUrl, qstash } from '@/lib/infrastructure/queue';
import { getEditorialStyleProfileById } from '@/lib/music/editorial-styles';
import { recommendEditorialStyleId } from '@/lib/music/production-recipe';
import { and, eq, isNull } from 'drizzle-orm';

/** 后台队列必须可达；禁止以浏览器生命周期或after长请求伪装可靠队列。 */
export async function dispatchRadarCreation(candidateId: string, sequence: number) {
  if (!canUseQStash())
    throw new Error('Background queue is not configured. Configure QStash and a public worker URL first.');
  await qstash.publishJSON({
    url: getWorkerUrl('/api/worker/radar-creation'),
    body: { candidateId },
    deduplicationId: `radar-${candidateId}-${sequence}`,
    flowControl: { key: 'scooprym-radar-lyrics', parallelism: 2 },
    retries: 8,
    retryDelay: '60000',
  });
}

export async function enqueueRadarCreation(candidateId: string, userId: string) {
  if (!canUseQStash())
    throw new Error('Background queue is not configured. Configure QStash and a public worker URL first.');
  const db = await getDb();
  const [candidate] = await db.select().from(storyCandidate).where(eq(storyCandidate.id, candidateId)).limit(1);
  if (!candidate) throw new Error('Story candidate not found');
  if (candidate.status === 'dismissed') throw new Error('Restore this story before creating a song');
  const direction = getEditorialStyleProfileById(recommendEditorialStyleId(candidate.sourceTitle)).tags.join(', ');
  await db
    .insert(radarCreationJob)
    .values({
      candidateId,
      userId,
      runId: randomUUID(),
      songId: randomUUID(),
      sourceUrl: candidate.sourceUrl,
      sourceTitle: candidate.sourceTitle,
      direction,
    })
    .onConflictDoNothing();
  let [job] = await db.select().from(radarCreationJob).where(eq(radarCreationJob.candidateId, candidateId)).limit(1);
  if (!job) throw new Error('Unable to persist creation job');
  if (job.status === 'failed') {
    const [retry] = await db
      .update(radarCreationJob)
      .set({ status: 'queued', sequence: job.sequence + 1, error: null, updatedAt: new Date() })
      .where(
        and(
          eq(radarCreationJob.candidateId, candidateId),
          eq(radarCreationJob.status, 'failed'),
          isNull(radarCreationJob.leaseId)
        )
      )
      .returning();
    if (retry) job = retry;
  }
  if (job.status === 'queued') {
    try {
      await dispatchRadarCreation(candidateId, job.sequence);
    } catch (error) {
      // 保存任务不等于投递成功；只更新尚未被 Worker 领取的这一轮任务。
      await db
        .update(radarCreationJob)
        .set({
          status: 'failed',
          error: 'Queue delivery failed. Retry this story.',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(radarCreationJob.candidateId, candidateId),
            eq(radarCreationJob.status, 'queued'),
            eq(radarCreationJob.sequence, job.sequence),
            isNull(radarCreationJob.leaseId)
          )
        );
      throw error;
    }
  }
  const nextStatus = candidate.status === 'shortlisted' ? 'shortlisted' : 'adopted';
  await db
    .update(storyCandidate)
    .set({ status: nextStatus, adoptedAt: candidate.adoptedAt ?? new Date(), updatedAt: new Date() })
    .where(eq(storyCandidate.id, candidateId));
  return { candidateId, runId: job.runId, songId: job.songId, status: job.status };
}
