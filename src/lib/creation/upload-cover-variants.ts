import { createHash } from 'node:crypto';
import { createCoverVariants } from '@/lib/creation/optimize-cover';
import { COVER_CACHE_CONTROL } from '@/lib/images/cover-variants';
import type { uploadFile } from '@/storage';

/** 主图最后上传并返回，避免页面引用尚未完成的缩略图；重试复用确定性对象地址。 */
export async function uploadCoverVariants(buffer: Buffer, prefix: string, upload: typeof uploadFile) {
  const variants = await createCoverVariants(buffer);
  const main = variants[variants.length - 1];
  const digest = createHash('sha256').update(main.buffer).digest('hex');
  const family = `${prefix}/cover-v1-${digest}`;
  let uploaded: Awaited<ReturnType<typeof uploadFile>> | undefined;
  for (const image of variants) {
    uploaded = await upload(image.buffer, 'cover.webp', image.mime, undefined, {
      objectKey: `${family}/w${image.dimensions.width}.webp`,
      cacheControl: COVER_CACHE_CONTROL,
      requestTimeoutMs: 20_000,
    });
  }
  if (!uploaded) throw new Error('Cover variants are missing.');
  return { ...uploaded, dimensions: main.dimensions };
}
