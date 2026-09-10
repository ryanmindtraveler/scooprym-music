// @vitest-environment node
import { createHash, createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withScheduledRequest } from './scheduled-request';

const url = 'https://scooprym.app/api/cron/music-recovery';
function signedRequest(key = 'current-test-key', target = url, body = '{}', expired = false) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const content = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    iss: 'Upstash',
    sub: target,
    exp: Math.floor(Date.now() / 1000) + (expired ? -60 : 60),
    body: createHash('sha256').update('{}').digest('base64url'),
  })}`;
  const signature = `${content}.${createHmac('sha256', key).update(content).digest('base64url')}`;
  return new Request(url, { method: 'POST', body, headers: { 'upstash-signature': signature } });
}

beforeEach(() => {
  vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'current-test-key');
  vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'next-test-key');
});
afterEach(() => vi.unstubAllEnvs());

describe('高频调度签名校验', () => {
  it.each(['current-test-key', 'next-test-key'])('当前或轮换密钥可以触发业务：%s', async (key) => {
    const handler = vi.fn(async () => Response.json({ ok: true }));
    expect((await withScheduledRequest(handler)(signedRequest(key))).status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });
  it('匿名、伪造、过期、正文篡改和跨接口请求均不执行业务', async () => {
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const requests = [
      new Request(url, { method: 'POST' }),
      signedRequest('wrong-key'),
      signedRequest('current-test-key', url, '{}', true),
      signedRequest('current-test-key', url, '{"changed":true}'),
      signedRequest('current-test-key', 'https://scooprym.app/api/cron/story-radar'),
    ];
    for (const request of requests) expect((await withScheduledRequest(handler)(request)).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
  it('缺少签名配置时明确返回暂不可用', async () => {
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', '');
    const handler = vi.fn(async () => Response.json({ ok: true }));
    expect((await withScheduledRequest(handler)(signedRequest())).status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
  });
});
