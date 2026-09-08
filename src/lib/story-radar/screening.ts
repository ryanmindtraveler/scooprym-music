import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { storyCandidate as candidate } from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { screenStoryCandidatesWithAI } from './ai-screener';
import type { ScreeningState } from './screening-state';

export const screeningRequestSchema = z
  .object({
    candidateIds: z.array(z.string().uuid()).min(1).max(45).optional(),
    autoDismiss: z.boolean().default(true),
    limit: z.number().int().min(1).max(45).default(30),
    retryFailed: z.boolean().default(false),
  })
  .strict();

export async function screenRadar(input: z.infer<typeof screeningRequestSchema>) {
  const db = await getDb();
  const now = new Date();
  const expiry = new Date(now.getTime() - 10 * 60_000).toISOString();
  const eligible = and(
    eq(candidate.status, 'new'),
    input.candidateIds ? inArray(candidate.id, input.candidateIds) : undefined,
    input.retryFailed
      ? sql`${candidate.aiScreening}->>'status' = 'failed'`
      : sql`not coalesce((${candidate.aiScreening}->>'status' = 'completed' and ${candidate.aiScreening}->>'title' = ${candidate.sourceTitle} and ${candidate.aiScreening}->>'domain' = ${candidate.sourceDomain}), false)`,
    sql`(${candidate.aiScreening} is null or (${candidate.aiScreening}->>'attemptedAt')::timestamptz < ${expiry}::timestamptz or (${input.retryFailed} and ${candidate.aiScreening}->>'status' = 'failed'))`
  );
  const rows = await db
    .select({
      id: candidate.id,
      title: candidate.sourceTitle,
      domain: candidate.sourceDomain,
      category: candidate.category,
      // PostgreSQL 原始文本保留微秒精度，不能用 JS Date 截断后的值做版本比较。
      version: sql<string>`${candidate.updatedAt}::text`,
    })
    .from(candidate)
    .where(eligible)
    .orderBy(sql`${candidate.aiScreening}->>'attemptedAt' asc nulls first`, candidate.createdAt, candidate.id)
    .limit(input.limit);
  const claimed: Array<(typeof rows)[number] & { state: ScreeningState }> = [];
  for (const row of rows) {
    const state: ScreeningState = {
      token: randomUUID(),
      status: 'running',
      title: row.title,
      domain: row.domain,
      attemptedAt: now.toISOString(),
    };
    const [saved] = await db
      .update(candidate)
      .set({ aiScreening: state })
      .where(and(eligible, eq(candidate.id, row.id), sql`${candidate.updatedAt}::text = ${row.version}`))
      .returning({ id: candidate.id });
    if (saved) claimed.push({ ...row, state });
  }
  const batch = await screenStoryCandidatesWithAI(claimed);
  const results = new Map(batch.evaluations.map((item) => [item.id, item]));
  const failures = new Map(batch.failures.map((item) => [item.id, item.error]));
  let processedCount = 0;
  let failedCount = 0;
  let skippedCount = rows.length - claimed.length;
  let dismissedCount = 0;
  let highMatchCount = 0;
  for (const row of claimed) {
    const result = results.get(row.id);
    const error = failures.get(row.id) || (!result ? 'AI returned no evaluation' : undefined);
    const dismiss = !!result && input.autoDismiss && (result.action === 'dismiss' || result.relevanceScore < 20);
    const completedAt = new Date();
    const state: ScreeningState = {
      ...row.state,
      status: error ? 'failed' : 'completed',
      completedAt: completedAt.toISOString(),
      ...(error ? { error } : { reason: result!.fitReason.slice(0, 500) }),
    };
    const owns = and(eq(candidate.id, row.id), sql`${candidate.aiScreening}->>'token' = ${row.state.token}`);
    const [saved] = await db
      .update(candidate)
      .set({
        aiScreening: state,
        ...(!error && result
          ? {
              relevanceScore: result.relevanceScore,
              category: result.category,
              status: dismiss ? 'dismissed' : 'new',
              updatedAt: completedAt,
            }
          : {}),
      })
      .where(and(owns, eq(candidate.status, 'new'), sql`${candidate.updatedAt}::text = ${row.version}`))
      .returning({ id: candidate.id });
    if (!saved) {
      skippedCount++;
      await db
        .update(candidate)
        .set({
          aiScreening: {
            ...row.state,
            status: 'skipped',
            error: 'Story changed during assessment',
            completedAt: completedAt.toISOString(),
          },
        })
        .where(owns);
    } else if (error) failedCount++;
    else {
      processedCount++;
      if (dismiss) dismissedCount++;
      if (result!.relevanceScore >= 80) highMatchCount++;
    }
  }
  return {
    success: failedCount === 0 || processedCount > 0,
    partial: failedCount > 0 && processedCount > 0,
    processedCount,
    failedCount,
    skippedCount,
    dismissedCount,
    highMatchCount,
    ...(failedCount && !processedCount
      ? { error: 'AI screening failed. Original scores were preserved. Retry failed screening.' }
      : {}),
  };
}
