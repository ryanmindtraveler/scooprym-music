import sharp from 'sharp';

/** 上传前一次性压缩；保留比例与透明度，不放大小图，避免访问时重复转换。 */
export async function optimizeCover(buffer: Buffer) {
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
