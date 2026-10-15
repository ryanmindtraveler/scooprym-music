// @vitest-environment node
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { uploadCoverVariants } from './upload-cover-variants';

describe('封面派生资源上传', () => {
  const input = () =>
    sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#123456' } })
      .png()
      .toBuffer();
  it('缩略图先于主图上传，所有对象均带不可变缓存与相同内容版本', async () => {
    const upload = vi.fn().mockImplementation(async (_file, _name, _mime, _folder, options) => ({
      key: options.objectKey,
      url: `https://covers.example.com/${options.objectKey}`,
    }));
    const result = await uploadCoverVariants(await input(), 'song-covers/one', upload);
    expect(upload.mock.calls.map((call) => call[4].objectKey.match(/w\d+\.webp$/)[0])).toEqual([
      'w160.webp',
      'w480.webp',
      'w1024.webp',
    ]);
    expect(result.key).toMatch(/\/cover-v1-[a-f0-9]{64}\/w1024\.webp$/);
    expect(upload.mock.calls.every((call) => call[4].cacheControl === 'public, max-age=31536000, immutable')).toBe(
      true
    );
  });
  it('缩略图上传失败不发布主图，重试使用相同的对象地址', async () => {
    const upload = vi
      .fn()
      .mockRejectedValueOnce(new Error('storage failed'))
      .mockImplementation(async (_file, _name, _mime, _folder, options) => ({
        key: options.objectKey,
        url: `https://covers.example.com/${options.objectKey}`,
      }));
    const buffer = await input();
    await expect(uploadCoverVariants(buffer, 'song-covers/one', upload)).rejects.toThrow('storage failed');
    expect(upload).toHaveBeenCalledOnce();
    await uploadCoverVariants(buffer, 'song-covers/one', upload);
    expect(upload.mock.calls[0][4].objectKey).toBe(upload.mock.calls[1][4].objectKey);
  });
});
