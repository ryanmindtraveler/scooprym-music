import { createHash, randomUUID } from 'node:crypto';
import { dataUrlToImageBuffer, generateCoverWithRetry } from '@/ai/image/lib/cover-generation';
import { getDb } from '@/db';
import { coverAssetCheckpoint } from '@/db/schema';
import { readImageDimensions } from '@/lib/creation/song-product-check';
import { uploadFile } from '@/storage';
import { and, eq, isNull, lt, or } from 'drizzle-orm';

type CoverInput = {
  songId: string;
  userId: string;
  title: string;
  lyrics: string;
  sourceText: string;
  artPrompt?: string;
  previousCoverKey?: string | null;
};

// 图片只保存在服务端专用表；工作流查询不携带大体积 base64。
// 输入不变时恢复原图片，明确更换已有封面时使用新的恢复点。
export async function prepareCoverAsset(input: CoverInput) {
  const db = await getDb();
  const id = createHash('sha256')
    .update(
      JSON.stringify([
        input.songId,
        input.title,
        input.lyrics,
        input.sourceText,
        input.artPrompt || '',
        input.previousCoverKey || '',
      ])
    )
    .digest('hex');
  const token = randomUUID();
  const now = new Date();
  const lease = { leaseToken: token, leaseUntil: new Date(now.getTime() + 360_000), updatedAt: now };
  const [checkpoint] = await db
    .insert(coverAssetCheckpoint)
    .values({ id, songId: input.songId, ...lease })
    .onConflictDoUpdate({
      target: coverAssetCheckpoint.id,
      set: lease,
      setWhere: or(isNull(coverAssetCheckpoint.leaseUntil), lt(coverAssetCheckpoint.leaseUntil, now)),
    })
    .returning();
  if (!checkpoint) throw new Error('Cover recovery is already running. Please wait before retrying.');
  const owned = and(eq(coverAssetCheckpoint.id, id), eq(coverAssetCheckpoint.leaseToken, token));
  async function save(values: Partial<typeof coverAssetCheckpoint.$inferInsert>) {
    const rows = await db
      .update(coverAssetCheckpoint)
      .set({ ...values, updatedAt: new Date() })
      .where(owned)
      .returning({ id: coverAssetCheckpoint.id });
    if (!rows.length) throw new Error('Cover checkpoint ownership changed. Please retry later.');
  }
  let stage = 'generation';
  try {
    if (checkpoint.uploadedAsset) return checkpoint.uploadedAsset;
    const signal = AbortSignal.timeout(220_000);
    let source = checkpoint.imageSource;
    if (!source) {
      source = await generateCoverWithRetry({ ...input, signal });
      if (!source) throw new Error('The image provider returned no cover image.');
      stage = 'checkpoint';
      await save({ imageSource: source });
    }
    stage = 'download';
    const { buffer, mime, extension } = await dataUrlToImageBuffer(source, signal);
    const dimensions = readImageDimensions(buffer, mime);
    // 远程地址可能过期；下载后保存原始字节，上传失败不会再次调用模型。
    stage = 'checkpoint';
    if (!source.startsWith('data:')) {
      await save({ imageSource: `data:${mime};base64,${buffer.toString('base64')}` });
    }
    stage = 'upload';
    const asset = await uploadFile(buffer, `cover.${extension}`, mime, undefined, {
      objectKey: `song-covers/${input.userId}/${id}.${extension}`,
      requestTimeoutMs: 20_000,
    });
    const result = { ...asset, dimensions };
    stage = 'checkpoint';
    // 上传成功后移除大字段，保留结果供歌曲最终写库失败时恢复。
    await save({ imageSource: null, uploadedAsset: result });
    return result;
  } catch (error) {
    // 数据库异常可能包含 SQL 参数（图片正文），只对外报告安全摘要。
    const detail =
      stage === 'checkpoint'
        ? 'Unable to save the cover recovery checkpoint. Please retry later.'
        : error instanceof Error
          ? error.message
          : 'Unknown error';
    throw new Error(`Cover ${stage} failed: ${detail}`, { cause: error });
  } finally {
    await db
      .update(coverAssetCheckpoint)
      .set({ leaseToken: null, leaseUntil: null })
      .where(owned)
      .catch(() => console.warn('[cover-asset] 封面恢复锁释放失败，将在租约到期后恢复。'));
  }
}
