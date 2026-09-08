import { getDb } from '@/db';
import { generationAttempt as attempt, song, songCreationRun, songCreationStep } from '@/db/schema';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { enqueueMusicContinuation } from './music-continuation';
import { RECOVERABLE_MUSIC_STATUSES, STALLED_MUSIC_MINUTES, planStalledMusicRecovery } from './recovery-policy';

export async function recoverStalledMusicJobs(now = new Date()) {
  const db = await getDb();
  const cutoff = new Date(now.getTime() - STALLED_MUSIC_MINUTES * 60_000);
  const rows = await db
    .select({
      id: attempt.id,
      songId: attempt.songId,
      status: attempt.processingStatus,
      version: sql<string>`${attempt.updatedAt}::text`,
    })
    .from(attempt)
    .innerJoin(song, eq(song.id, attempt.songId))
    .where(
      and(
        eq(song.isAdminGenerated, true),
        eq(attempt.generationBillingMode, 'internal_admin'),
        inArray(attempt.processingStatus, [...RECOVERABLE_MUSIC_STATUSES]),
        lt(attempt.updatedAt, cutoff),
        sql`${attempt.id} = (select ga.id from scooprym.generation_attempt ga where ga.song_id = ${song.id} order by ga.created_at desc, ga.id desc limit 1)`
      )
    )
    .orderBy(attempt.updatedAt)
    .limit(10);
  let resumed = 0;
  let stopped = 0;
  let deliveryFailed = 0;
  for (const row of rows) {
    const plan = planStalledMusicRecovery(row.status || 'processing');
    const claimed = await db.transaction(async (tx) => {
      const [saved] = await tx
        .update(attempt)
        .set({ processingStatus: plan.status, processingError: plan.error, updatedAt: now })
        .where(
          and(
            eq(attempt.id, row.id),
            eq(attempt.processingStatus, row.status!),
            sql`${attempt.updatedAt}::text = ${row.version}`,
            sql`${attempt.id} = (select ga.id from scooprym.generation_attempt ga where ga.song_id = ${row.songId} order by ga.created_at desc, ga.id desc limit 1)`
          )
        )
        .returning({ id: attempt.id });
      if (saved && !plan.dispatch) {
        const runs = await tx
          .update(songCreationRun)
          .set({ status: 'failed', lastError: plan.error, updatedAt: now })
          .where(and(eq(songCreationRun.songId, row.songId), inArray(songCreationRun.status, ['running', 'queued'])))
          .returning({ id: songCreationRun.id });
        if (runs.length)
          await tx
            .update(songCreationStep)
            .set({ status: 'failed', error: plan.error, completedAt: now })
            .where(
              and(
                inArray(
                  songCreationStep.runId,
                  runs.map((run) => run.id)
                ),
                eq(songCreationStep.status, 'running')
              )
            );
      }
      return !!saved;
    });
    if (!claimed) continue;
    if (!plan.dispatch) {
      stopped++;
      continue;
    }
    try {
      await enqueueMusicContinuation(row.songId, row.id, `recovery-${now.getTime()}`);
      resumed++;
    } catch (error) {
      // 保持可领取边界，下次巡检可以补投；不把投递故障升级为重新生成音乐。
      deliveryFailed++;
      console.error('[music-recovery] Continuation delivery failed', row.id, error);
    }
  }
  return { inspected: rows.length, resumed, stopped, deliveryFailed };
}
