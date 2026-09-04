import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ putObject: vi.fn() }));
vi.mock('s3mini', () => ({
  s3mini: class {
    putObject = mocks.putObject;
  },
}));
import { S3Provider } from './s3';

describe('存储上传重试', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.putObject.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  const provider = () =>
    new S3Provider({
      region: 'auto',
      endpoint: 'https://storage.example.com',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      bucketName: 'test',
      publicUrl: 'https://cdn.example.com',
    });
  const params = {
    file: Buffer.from('image'),
    filename: 'cover.png',
    contentType: 'image/png',
    folder: 'song-covers/admin',
  };

  it('断连后上传同一份内容到同一个 key', async () => {
    mocks.putObject
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('', { status: 200 }));
    const pending = provider().uploadFile(params);
    await vi.advanceTimersByTimeAsync(500);
    const result = await pending;
    expect(mocks.putObject).toHaveBeenCalledTimes(2);
    expect(mocks.putObject.mock.calls[0]).toEqual(mocks.putObject.mock.calls[1]);
    expect(result.key).toBe(mocks.putObject.mock.calls[0][0]);
  });
  it('权限错误不重试', async () => {
    mocks.putObject.mockResolvedValue(new Response('', { status: 403 }));
    await expect(provider().uploadFile(params)).rejects.toThrow('HTTP 403');
    expect(mocks.putObject).toHaveBeenCalledOnce();
  });
  it('服务持续故障最多上传三次', async () => {
    mocks.putObject.mockResolvedValue(new Response('', { status: 503 }));
    const assertion = expect(provider().uploadFile(params)).rejects.toThrow('HTTP 503');
    await vi.advanceTimersByTimeAsync(1500);
    await assertion;
    expect(mocks.putObject).toHaveBeenCalledTimes(3);
  });
  it('兼容存储 SDK 抛出的 status 属性', async () => {
    mocks.putObject
      .mockRejectedValueOnce(Object.assign(new Error('S3 returned 503'), { status: 503 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }));
    const pending = provider().uploadFile(params);
    await vi.advanceTimersByTimeAsync(500);
    await expect(pending).resolves.toHaveProperty('key');
    expect(mocks.putObject).toHaveBeenCalledTimes(2);
  });
});
