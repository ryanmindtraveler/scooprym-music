import { COVER_WIDTHS } from '@/lib/images/cover-variants';
import sharp from 'sharp';

/** 上传前一次性压缩；保留比例与透明度，不放大小图，避免访问时重复转换。 */
export async function optimizeCover(buffer: Buffer) {
  const metadata = await sharp(buffer, { limitInputPixels: 40_000_000 }).metadata();
  if (
    metadata.format === 'webp' &&
    metadata.width &&
    metadata.height &&
    metadata.width <= 1024 &&
    metadata.height <= 1024 &&
    (!metadata.orientation || metadata.orientation === 1) &&
    (!metadata.pages || metadata.pages === 1)
  ) {
    return {
      buffer,
      mime: 'image/webp',
      extension: 'webp',
      dimensions: { width: metadata.width, height: metadata.height },
    };
  }
  const { data, info } = await sharp(buffer, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return {
    buffer: data,
    mime: 'image/webp',
    extension: 'webp',
    dimensions: { width: info.width, height: info.height },
  };
}

/** 从同一张主图派生尺寸，不放大小图，返回真实宽度供浏览器选择。 */
export async function createCoverVariants(buffer: Buffer) {
  const main = await optimizeCover(buffer);
  const thumbnails = await Promise.all(
    COVER_WIDTHS.filter((width) => width < main.dimensions.width).map(async (width) => {
      const { data, info } = await sharp(main.buffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      return {
        buffer: data,
        mime: main.mime,
        extension: main.extension,
        dimensions: { width: info.width, height: info.height },
      };
    })
  );
  return [...thumbnails, main];
}
