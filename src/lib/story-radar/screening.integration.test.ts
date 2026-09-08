// @vitest-environment node
import { randomUUID } from 'node:crypto';
import * as schema from '@/db/schema';
import { loadEnvConfig } from '@next/env';
import { and, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), screen: vi.fn(), collect: vi.fn(), enqueue: vi.fn() }));
vi.mock('@/db', () => ({ getDb: mocks.getDb }));
vi.mock('./ai-screener', () => ({ screenStoryCandidatesWithAI: mocks.screen }));
vi.mock('./index', () => ({ collectStoryRadarCandidates: mocks.collect }));
vi.mock('@/lib/creation/music-continuation', () => ({ enqueueMusicContinuation: mocks.enqueue }));
import { recoverStalledMusicJobs } from '@/lib/creation/music-recovery';
import { scanAndStoreRadar } from './scan';
import { screenRadar, screeningRequestSchema } from './screening';

describe.runIf(process.env.RUN_DATABASE_TESTS === '1')('筛选数据库并发合同（事务回滚）', () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  beforeAll(() => {
    loadEnvConfig(process.cwd());
    client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, connect_timeout: 10 });
    db = drizzle(client, { schema });
  });
  afterAll(async () => {
    await client?.end();
  });
  async function fixture(check: (tx: any, ids: string[]) => Promise<void>) {
    const rollback = new Error('测试主动回滚');
    await db
      .transaction(async (tx) => {
        mocks.getDb.mockReturnValue(tx);
        const ids = [randomUUID(), randomUUID()];
        await tx
          .insert(schema.storyCandidate)
          .values(
            ids.map((id) => ({
              id,
              sourceUrl: `https://example.com/test-${id}`,
              sourceTitle: 'Test headline',
              sourceDomain: 'example.com',
              category: 'internet_chaos',
              relevanceScore: 7,
              matchedTerms: '[]',
            }))
          );
        mocks.screen
          .mockReset()
          .mockImplementation(async (items: Array<{ id: string }>) => ({
            evaluations: items.map((item) => ({
              id: item.id,
              relevanceScore: 87,
              category: 'internet_chaos',
              fitReason: 'Good fit',
              action: 'keep',
            })),
            failures: [],
          }));
        await check(tx, ids);
        throw rollback;
      })
      .catch((error) => {
        if (error !== rollback) throw error;
      });
  }
  it(
    '失败保留分数、支持单独重试、成功后不重复评估',
    async () =>
      fixture(async (tx, ids) => {
        const input = screeningRequestSchema.parse({ candidateIds: ids });
        mocks.screen.mockResolvedValueOnce({
          evaluations: [],
          failures: ids.map((id) => ({ id, error: 'Provider offline' })),
        });
        expect(await screenRadar(input)).toMatchObject({ success: false, failedCount: 2, processedCount: 0 });
        const failed = await tx.select().from(schema.storyCandidate).where(inArray(schema.storyCandidate.id, ids));
        expect(
          failed.every(
            (row: any) => row.relevanceScore === 7 && row.aiScreening.status === 'failed' && row.status === 'new'
          )
        ).toBe(true);
        expect(await screenRadar({ ...input, retryFailed: true })).toMatchObject({ processedCount: 2, failedCount: 0 });
        expect(await screenRadar(input)).toMatchObject({ processedCount: 0, failedCount: 0 });
      }),
    30_000
  );
  it(
    '模型等待期间人工精选或改分数，不会被晚到结果覆盖',
    async () =>
      fixture(async (tx, ids) => {
        mocks.screen.mockImplementationOnce(async () => {
          await tx
            .update(schema.storyCandidate)
            .set({ status: 'shortlisted' })
            .where(eq(schema.storyCandidate.id, ids[0]));
          await tx
            .update(schema.storyCandidate)
            .set({ relevanceScore: 95, updatedAt: new Date(Date.now() + 1000) })
            .where(eq(schema.storyCandidate.id, ids[1]));
          return {
            evaluations: ids.map((id) => ({
              id,
              relevanceScore: 0,
              category: 'absurd_headlines',
              fitReason: 'dismiss',
              action: 'dismiss',
            })),
            failures: [],
          };
        });
        expect(await screenRadar(screeningRequestSchema.parse({ candidateIds: ids }))).toMatchObject({
          processedCount: 0,
          dismissedCount: 0,
          skippedCount: 2,
        });
        const rows = await tx.select().from(schema.storyCandidate).where(inArray(schema.storyCandidate.id, ids));
        expect(rows.find((row: any) => row.id === ids[0]).status).toBe('shortlisted');
        expect(rows.find((row: any) => row.id === ids[1]).relevanceScore).toBe(95);
      }),
    30_000
  );
  it(
    '领取中的候选不会被第二个请求重复调用模型',
    async () =>
      fixture(async (_tx, ids) => {
        const input = screeningRequestSchema.parse({ candidateIds: ids });
        let paidBatches = 0;
        mocks.screen.mockImplementation(async (items: Array<{ id: string }>) => {
          if (items.length) {
            paidBatches++;
            expect(await screenRadar(input)).toMatchObject({ processedCount: 0 });
          }
          return {
            evaluations: items.map((item) => ({
              id: item.id,
              relevanceScore: 80,
              category: 'internet_chaos',
              fitReason: 'keep',
              action: 'keep',
            })),
            failures: [],
          };
        });
        expect(await screenRadar(input)).toMatchObject({ processedCount: 2 });
        expect(paidBatches).toBe(1);
      }),
    30_000
  );
  it(
    '采集刷新保留同标题 AI 分数，标题变化后重新进入评估',
    async () =>
      fixture(async (tx, ids) => {
        await screenRadar(screeningRequestSchema.parse({ candidateIds: ids }));
        const candidate = {
          provider: 'rss',
          sourceUrl: `https://example.com/test-${ids[0]}`,
          sourceTitle: 'Test headline',
          sourceDomain: 'example.com',
          category: 'internet_chaos',
          relevanceScore: 7,
          matchedTerms: ['viral'],
        };
        mocks.collect.mockResolvedValue({ candidates: [candidate], sources: [], status: 'completed' });
        await scanAndStoreRadar();
        const [same] = await tx.select().from(schema.storyCandidate).where(eq(schema.storyCandidate.id, ids[0]));
        expect(same.relevanceScore).toBe(87);
        expect(same.aiScreening.status).toBe('completed');
        mocks.collect.mockResolvedValue({
          candidates: [{ ...candidate, sourceTitle: 'Changed headline' }],
          sources: [],
          status: 'completed',
        });
        await scanAndStoreRadar();
        const [changed] = await tx.select().from(schema.storyCandidate).where(eq(schema.storyCandidate.id, ids[0]));
        expect(changed.aiScreening).toBeNull();
        expect(await screenRadar(screeningRequestSchema.parse({ candidateIds: [ids[0]] }))).toMatchObject({
          processedCount: 1,
        });
      }),
    60_000
  );
  it(
    '巡检查询可执行，早于系统数据的截止时间不会触碰现有任务',
    async () =>
      fixture(async () => {
        expect(await recoverStalledMusicJobs(new Date('1990-01-01'))).toEqual({
          inspected: 0,
          resumed: 0,
          stopped: 0,
          deliveryFailed: 0,
        });
        expect(mocks.enqueue).not.toHaveBeenCalled();
      }),
    30_000
  );
});
