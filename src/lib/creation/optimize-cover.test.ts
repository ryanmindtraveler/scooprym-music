// @vitest-environment node
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { createCoverVariants, optimizeCover } from './optimize-cover';

describe('封面上传前压缩', () => {
  it('分别生成160、480和1024像素封面，实际像素与描述一致', async () => {
    const input = await sharp({ create: { width: 2048, height: 2048, channels: 3, background: '#aabbcc' } })
      .png()
      .toBuffer();
    const variants = await createCoverVariants(input);
    expect(variants.map((image) => image.dimensions.width)).toEqual([160, 480, 1024]);
    for (const image of variants) expect((await sharp(image.buffer).metadata()).width).toBe(image.dimensions.width);
  });
  it('已有合适尺寸的WebP不再次有损编码', async () => {
    const input = await sharp({ create: { width: 800, height: 800, channels: 3, background: '#aabbcc' } })
      .webp()
      .toBuffer();
    expect((await optimizeCover(input)).buffer).toEqual(input);
  });
  it('大图转为 WebP，限制尺寸并保留比例', async () => {
    const input = await sharp({ create: { width: 2048, height: 1536, channels: 3, background: '#f58732' } })
      .png()
      .toBuffer();
    const result = await optimizeCover(input);
    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe('webp');
    expect(result.dimensions).toEqual({ width: 1024, height: 768 });
    expect(result.buffer.length).toBeLessThan(input.length);
  });

  it('小图不放大，透明通道保留', async () => {
    const input = await sharp({ create: { width: 120, height: 80, channels: 4, background: '#00000000' } })
      .png()
      .toBuffer();
    const result = await optimizeCover(input);
    expect(result.dimensions).toEqual({ width: 120, height: 80 });
    expect((await sharp(result.buffer).metadata()).hasAlpha).toBe(true);
  });

  it('损坏内容不会作为有效封面上传', async () => {
    await expect(optimizeCover(Buffer.from('invalid image'))).rejects.toThrow();
  });
});
