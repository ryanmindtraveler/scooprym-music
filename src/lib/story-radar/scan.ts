import 'server-only';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { storyCandidate, storyRadarScan } from '@/db/schema';
import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { collectStoryRadarCandidates } from './index';
import type { RadarScanSummary } from './types';

export class RadarScanInProgressError extends Error {
  constructor() {
    super('A radar scan is already running. Please wait for it to finish.');
  }
}

export async function getLatestRadarScan(): Promise<RadarScanSummary | null> {
  const db = await getDb();
  const [scan] = await db.select().from(storyRadarScan).orderBy(desc(storyRadarScan.startedAt)).limit(1);
  if (!scan) return null;
  const abandoned = scan.status === 'running' && Date.now() - scan.startedAt.getTime() > 10 * 60_000;
  return {
    ...scan,
    status: abandoned ? 'failed' : (scan.status as RadarScanSummary['status']),
    error: abandoned ? 'The previous scan stopped before completion. Run a new scan.' : scan.error,
    startedAt: scan.startedAt.toISOString(),
    completedAt: scan.completedAt?.toISOString() ?? null,
  };
}

export async function getRecentSuccessfulRadarScan(now = new Date()) {
  const db = await getDb();
  const [scan] = await db
    .select()
    .from(storyRadarScan)
    .where(
      and(
        inArray(storyRadarScan.status, ['completed', 'partial']),
        gte(storyRadarScan.completedAt, new Date(now.getTime() - 60 * 60_000))
      )
    )
    .orderBy(desc(storyRadarScan.completedAt))
    .limit(1);
  return scan ?? null;
}

export async function scanAndStoreRadar(now = new Date()) {
  const db = await getDb();
  const id = randomUUID();
  // 部分唯一索引保证手动扫描与定时采集不会同时轰炸上游；超时租约可由下一轮接管。
  const claimed = await db.transaction(async (tx) => {
    await tx
      .update(storyRadarScan)
      .set({ status: 'failed', completedAt: now, error: 'Scan timed out before completion' })
      .where(
        and(eq(storyRadarScan.status, 'running'), lt(storyRadarScan.startedAt, new Date(now.getTime() - 10 * 60_000)))
      );
    return tx
      .insert(storyRadarScan)
      .values({ id, startedAt: now })
      .onConflictDoNothing()
      .returning({ id: storyRadarScan.id });
  });
  if (!claimed.length) throw new RadarScanInProgressError();
  const ownsScan = and(eq(storyRadarScan.id, id), eq(storyRadarScan.status, 'running'));
  try {
    const collection = await collectStoryRadarCandidates();
    let inserted = 0;
    let updated = 0;
    await db.transaction(async (tx) => {
      // 验证租约并锁住扫描记录，避免旧执行者覆盖接管后的结果。
      const [lease] = await tx.select({ id: storyRadarScan.id }).from(storyRadarScan).where(ownsScan).for('update');
      if (!lease) throw new Error('Scan lease expired');
      for (let start = 0; start < collection.candidates.length; start += 100) {
        const batch = collection.candidates.slice(start, start + 100).map((candidate) => ({
          ...candidate,
          id: randomUUID(),
          matchedTerms: JSON.stringify(candidate.matchedTerms),
          updatedAt: now,
        }));
        const created = await tx
          .insert(storyCandidate)
          .values(batch)
          .onConflictDoNothing({ target: storyCandidate.sourceUrl })
          .returning({ sourceUrl: storyCandidate.sourceUrl });
        const createdUrls = new Set(created.map((row) => row.sourceUrl));
        const existing = batch.filter((row) => !createdUrls.has(row.sourceUrl));
        inserted += created.length;
        if (existing.length) {
          const keepDirectSource = sql`excluded.provider = 'google-trends' and ${storyCandidate.provider} <> 'google-trends'`;
          const sameTitle = sql`(${keepDirectSource} or excluded.source_title = ${storyCandidate.sourceTitle}) and excluded.source_domain = ${storyCandidate.sourceDomain}`;
          const keepAssessment = sql`${sameTitle} and ${storyCandidate.aiScreening}->>'status' = 'completed'`;
          await tx
            .insert(storyCandidate)
            .values(existing)
            .onConflictDoUpdate({
              target: storyCandidate.sourceUrl,
              set: {
                provider: sql`case when ${keepDirectSource} then ${storyCandidate.provider} else excluded.provider end`,
                trendSignals: sql`coalesce(excluded.trend_signals, ${storyCandidate.trendSignals})`,
                sourceTitle: sql`case when ${keepDirectSource} then ${storyCandidate.sourceTitle} else excluded.source_title end`,
                sourceDomain: sql`excluded.source_domain`,
                sourceImageUrl: sql`coalesce(excluded.source_image_url, ${storyCandidate.sourceImageUrl})`,
                category: sql`case when ${keepDirectSource} or ${keepAssessment} then ${storyCandidate.category} else excluded.category end`,
                aiScreening: sql`case when ${sameTitle} then ${storyCandidate.aiScreening} else null end`,
                matchedTerms: sql`case when ${keepDirectSource} then ${storyCandidate.matchedTerms} else excluded.matched_terms end`,
                relevanceScore: sql`case when ${keepDirectSource} or ${keepAssessment} then ${storyCandidate.relevanceScore} else excluded.relevance_score end`,
                publishedAt: sql`coalesce(excluded.published_at, ${storyCandidate.publishedAt})`,
                updatedAt: now,
              },
            });
          updated += existing.length;
        }
      }
      await tx
        .update(storyRadarScan)
        .set({
          status: collection.status,
          completedAt: new Date(),
          sources: collection.sources,
          discovered: collection.candidates.length,
          inserted,
          updated,
          error: collection.status === 'failed' ? 'All enabled sources failed. No articles were collected.' : null,
        })
        .where(ownsScan);
    });
    return {
      scanId: id,
      status: collection.status,
      sources: collection.sources,
      discovered: collection.candidates.length,
      inserted,
      updated,
      stored: inserted + updated,
    };
  } catch (error) {
    await db
      .update(storyRadarScan)
      .set({ status: 'failed', completedAt: new Date(), error: 'Scan could not be saved. Check server logs.' })
      .where(ownsScan);
    throw error;
  }
}
