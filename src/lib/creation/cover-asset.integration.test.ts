// @vitest-environment node
import { randomUUID } from 'node:crypto';
import * as schema from '@/db/schema';
import { loadEnvConfig } from '@next/env';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), generate: vi.fn(), upload: vi.fn() }));
vi.mock('@/db', () => ({ getDb: mocks.getDb }));
vi.mock('@/storage', () => ({ uploadFile: mocks.upload }));
vi.mock('@/ai/image/lib/cover-generation', async (original) => ({
  ...(await original<typeof import('@/ai/image/lib/cover-generation')>()),
  generateCoverWithRetry: mocks.generate,
}));
import { prepareCoverAsset } from './cover-asset';

describe.runIf(process.env.RUN_DATABASE_TESTS === '1')('封面恢复点（真实数据库、模拟模型和存储、事务回滚）', () => {
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
  async function fixture(check: (tx: any, input: Parameters<typeof prepareCoverAsset>[0]) => Promise<void>) {
    const rollback = new Error('主动回滚');
    await db
      .transaction(async (tx) => {
        const [song] = await tx.select({ id: schema.song.id, userId: schema.song.userId }).from(schema.song).limit(1);
        if (!song) throw new Error('测试需要一条现有歌曲，只读引用，不修改歌曲');
        mocks.getDb.mockReturnValue(tx);
        mocks.generate
          .mockReset()
          .mockResolvedValue(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC1sAAAAASUVORK5CYII='
          );
        mocks.upload.mockReset().mockImplementation(async (_file, _name, _mime, _folder, options) => ({
          key: options.objectKey,
          url: `https://cdn.example.com/${options.objectKey}`,
        }));
        await check(tx, {
          songId: song.id,
          userId: song.userId,
          title: randomUUID(),
          lyrics: 'Test lyrics',
          sourceText: 'Test story',
        });
        throw rollback;
      })
      .catch((error) => {
        if (error !== rollback) throw error;
      });
  }
  it(
    '上传失败后跨调用恢复同一张图片，最终写库失败也无需再次上传',
    async () =>
      fixture(async (tx, input) => {
        mocks.upload.mockRejectedValueOnce(new TypeError('fetch failed'));
        await expect(prepareCoverAsset(input)).rejects.toThrow('Cover upload failed');
        const [failed] = await tx
          .select()
          .from(schema.coverAssetCheckpoint)
          .where(eq(schema.coverAssetCheckpoint.songId, input.songId));
        expect(failed.imageSource).toMatch(/^data:image/);
        expect(failed.leaseToken).toBeNull();
        const saved = await prepareCoverAsset(input);
        expect(await prepareCoverAsset(input)).toEqual(saved);
        expect(mocks.generate).toHaveBeenCalledOnce();
        expect(mocks.upload).toHaveBeenCalledTimes(2);
        expect(mocks.upload.mock.calls[0]).toEqual(mocks.upload.mock.calls[1]);
        const [done] = await tx
          .select()
          .from(schema.coverAssetCheckpoint)
          .where(eq(schema.coverAssetCheckpoint.id, failed.id));
        expect(done.imageSource).toBeNull();
        expect(done.uploadedAsset.key).toBe(saved.key);
      }),
    20_000
  );
  it(
    '同一恢复点并发调用不重复请求模型',
    async () =>
      fixture(async (_tx, input) => {
        const image = await mocks.generate();
        mocks.generate.mockClear().mockImplementationOnce(async () => {
          await expect(prepareCoverAsset(input)).rejects.toThrow('already running');
          return image;
        });
        await prepareCoverAsset(input);
        expect(mocks.generate).toHaveBeenCalledOnce();
      }),
    20_000
  );
  it(
    '明确替换已有封面时建立新恢复点',
    async () =>
      fixture(async (_tx, input) => {
        const first = await prepareCoverAsset(input);
        const replacement = await prepareCoverAsset({ ...input, previousCoverKey: first.key });
        expect(replacement.key).not.toBe(first.key);
        expect(mocks.generate).toHaveBeenCalledTimes(2);
      }),
    20_000
  );
});
