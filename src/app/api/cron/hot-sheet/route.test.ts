import { afterEach, describe, expect, it, vi } from 'vitest';
const archive = vi.hoisted(() => vi.fn());
vi.mock('@/lib/stories/hot-sheet-archive', () => ({ archiveDailyHotSheet: archive }));
import { GET } from './route';

describe('归档定时接口认证', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });
  it('缺少服务端密钥时拒绝请求', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(new Request('https://example.com'))).status).toBe(401);
    expect(archive).not.toHaveBeenCalled();
  });
  it('错误密钥不触发抓取', async () => {
    vi.stubEnv('CRON_SECRET', 'test');
    expect((await GET(new Request('https://example.com', { headers: { authorization: 'Bearer wrong' } }))).status).toBe(
      401
    );
    expect(archive).not.toHaveBeenCalled();
  });
  it('有效认证执行归档', async () => {
    vi.stubEnv('CRON_SECRET', 'test');
    archive.mockResolvedValue({ day: '2026-09-04', count: 10 });
    expect((await GET(new Request('https://example.com', { headers: { authorization: 'Bearer test' } }))).status).toBe(
      200
    );
  });
});
