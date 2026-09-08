import { afterEach, describe, expect, it, vi } from 'vitest';
const scan = vi.hoisted(() => vi.fn());
vi.mock('@/lib/story-radar/scan', () => ({
  scanAndStoreRadar: scan,
  RadarScanInProgressError: class extends Error {},
}));
import { RadarScanInProgressError } from '@/lib/story-radar/scan';
import { GET } from './route';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
const request = () =>
  new Request('https://example.com/api/cron/story-radar', { headers: { authorization: 'Bearer test-secret' } });
describe('定时采集接口', () => {
  it('未配置密钥时拒绝调用，不启动采集', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(request())).status).toBe(401);
    expect(scan).not.toHaveBeenCalled();
  });
  it('部分成功为200，全部失败为502，并发扫描安全跳过', async () => {
    vi.stubEnv('CRON_SECRET', 'test-secret');
    scan
      .mockResolvedValueOnce({ status: 'partial' })
      .mockResolvedValueOnce({ status: 'failed' })
      .mockRejectedValueOnce(new RadarScanInProgressError());
    expect((await GET(request())).status).toBe(200);
    expect((await GET(request())).status).toBe(502);
    expect(await (await GET(request())).json()).toMatchObject({ skipped: true });
  });
});
