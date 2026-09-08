const assert = require('node:assert/strict');
const { test } = require('node:test');
const { queueReady, waitForQueue, redactQueueOutput, getNextDevEnv } = require('./dev-with-queue.cjs');

test('工作线程兼容设置仅用于 Windows 开发子进程，且保留显式配置', () => {
  const env = { PATH: 'test' };
  assert.deepEqual(getNextDevEnv(env, 'win32'), { PATH: 'test', ESBUILD_WORKER_THREADS: '0' });
  assert.deepEqual(getNextDevEnv(env, 'linux'), env);
  assert.equal(getNextDevEnv({ ESBUILD_WORKER_THREADS: '1' }, 'win32').ESBUILD_WORKER_THREADS, '1');
  assert.deepEqual(env, { PATH: 'test' });
});

test('冷启动超过十秒后仍然能就绪，并报告等待进度', async () => {
  let elapsed = 0;
  const reports = [];
  await waitForQueue('http://localhost:8080', 120_000, {
    now: () => elapsed,
    sleep: async (ms) => {
      elapsed += ms;
    },
    probe: async () => ({ ready: elapsed >= 65_000, detail: 'ECONNREFUSED' }),
    report: (message) => reports.push(message),
  });
  assert.equal(elapsed, 65_000);
  assert.ok(reports.length >= 6);
});

test('超时保留真实连接原因', async () => {
  let elapsed = 0;
  await assert.rejects(
    waitForQueue('http://localhost:8080', 1000, {
      now: () => elapsed,
      sleep: async (ms) => {
        elapsed += ms;
      },
      probe: async () => ({ ready: false, detail: 'ECONNREFUSED' }),
    }),
    /启动超时.*ECONNREFUSED/
  );
});

test('凭据错误立即报告，不作为冷启动继续等待', async () => {
  await assert.rejects(
    queueReady('http://localhost:8080', async () => new Response(null, { status: 401 })),
    /拒绝凭据.*401/
  );
});

test('连接失败可以重试，接口成功才算就绪', async () => {
  const failed = await queueReady('http://localhost:8080', async () => {
    throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
  });
  assert.deepEqual(failed, { ready: false, detail: 'ECONNREFUSED' });
  assert.equal((await queueReady('http://localhost:8080', async () => new Response(null))).ready, true);
});

test('队列已被停止时不再探测或抛出超时错误', async () => {
  await waitForQueue('http://localhost:8080', 1000, {
    isStopping: () => true,
    probe: async () => {
      throw new Error('不应执行');
    },
  });
});

test('队列诊断隐藏令牌与签名密钥', () => {
  assert.equal(
    redactQueueOutput('QSTASH_TOKEN=eyJfakeToken== QSTASH_CURRENT_SIGNING_KEY=sig_fakeKey'),
    'QSTASH_TOKEN=[已隐藏] QSTASH_CURRENT_SIGNING_KEY=[已隐藏]'
  );
});
