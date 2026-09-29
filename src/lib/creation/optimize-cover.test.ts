// @vitest-environment node
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { optimizeCover } from './optimize-cover';

describe('封面上传前压缩', () => {
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
