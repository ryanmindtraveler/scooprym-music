import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('@upstash/qstash', () => ({ Client: class {} }));
vi.mock('./urls/urls', () => ({ getBaseUrl: () => 'http://localhost:3000' }));
import { canUseQStash } from './queue';

afterEach(() => vi.unstubAllEnvs());
describe('本地队列边界', () => {
  function credentials() {
    vi.stubEnv('QSTASH_TOKEN', 'local-test-token');
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'current');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'next');
  }
  it('开发模式允许本地 QStash 回调本地应用', () => {
    credentials();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('QSTASH_URL', 'http://127.0.0.1:8080');
    expect(canUseQStash()).toBe(true);
  });
  it('云端队列仍然不能回调本地应用', () => {
    credentials();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('QSTASH_URL', 'https://qstash.upstash.io');
    expect(canUseQStash()).toBe(false);
  });
  it('生产模式不能使用本地例外', () => {
    credentials();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('QSTASH_URL', 'http://127.0.0.1:8080');
    expect(canUseQStash()).toBe(false);
  });
  it('本地也必须有完整签名密钥', () => {
    credentials();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('QSTASH_URL', 'http://127.0.0.1:8080');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', '');
    expect(canUseQStash()).toBe(false);
  });
});
