// 本地开发复用官方 QStash 服务；不把云端队列投递到 localhost。
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');

let queue;
let next;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  next?.kill();
  queue?.kill();
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

async function queueReady(url, request = fetch) {
  try {
    const response = await request(`${url.replace(/\/$/, '')}/v2/events`, {
      headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` },
      signal: AbortSignal.timeout(1500),
    });
    await response.body?.cancel();
    if (response.status === 401 || response.status === 403) {
      throw new Error(`本地队列拒绝凭据（HTTP ${response.status}），请检查 .env.development.local 中的 QSTASH_TOKEN。`);
    }
    return { ready: response.ok, detail: `HTTP ${response.status}` };
  } catch (error) {
    if (error.message.startsWith('本地队列拒绝凭据')) throw error;
    return { ready: false, detail: error.cause?.code || error.name };
  }
}

async function waitForQueue(url, timeoutMs, options = {}) {
  const probe = options.probe || queueReady;
  const now = options.now || Date.now;
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const isStopping = options.isStopping || (() => stopping);
  const report = options.report || console.log;
  const started = now();
  let lastReport = started;
  let detail = '尚未响应';
  while (!isStopping() && now() - started < timeoutMs) {
    const result = await probe(url);
    if (result.ready) return;
    detail = result.detail;
    if (now() - lastReport >= 10_000) {
      report(`[开发队列] 正在等待 QStash 启动，已等待 ${Math.round((now() - started) / 1000)} 秒…`);
      lastReport = now();
    }
    await sleep(500);
  }
  if (!isStopping()) {
    throw new Error(
      `本地队列启动超时（${Math.round(timeoutMs / 1000)} 秒，${detail}）。可通过 QSTASH_LOCAL_START_TIMEOUT_MS 增加等待时间。`
    );
  }
}

function redactQueueOutput(output) {
  let safe = output;
  for (const name of ['QSTASH_TOKEN', 'QSTASH_CURRENT_SIGNING_KEY', 'QSTASH_NEXT_SIGNING_KEY']) {
    if (process.env[name]) safe = safe.split(process.env[name]).join('[已隐藏]');
  }
  return safe.replace(/(?:eyJ|sig_)[A-Za-z0-9_=/+.-]+/g, '[已隐藏]');
}

function getNextDevEnv(env = process.env, platform = process.platform) {
  // Windows 上 esbuild 的同步工作线程可能卡在配置编译；改用其原生同步子进程路径。
  // 仅影响本脚本启动的开发服务器，并允许调用者显式覆盖。
  return platform === 'win32' ? { ...env, ESBUILD_WORKER_THREADS: env.ESBUILD_WORKER_THREADS ?? '0' } : { ...env };
}

async function main() {
  require('@next/env').loadEnvConfig(process.cwd(), true);
  const url = process.env.QSTASH_URL;
  if (url && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) {
    if (!(await queueReady(url)).ready) {
      const timeoutMs = Number(process.env.QSTASH_LOCAL_START_TIMEOUT_MS || 120_000);
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new Error('QSTASH_LOCAL_START_TIMEOUT_MS 必须为正数（毫秒）。');
      }
      const binary = process.env.QSTASH_LOCAL_BINARY;
      if (!binary || !existsSync(binary)) {
        throw new Error('请安装官方 @upstash/qstash-cli，并在 .env.development.local 设置 QSTASH_LOCAL_BINARY。');
      }
      console.log(`[开发队列] 正在启动本地 QStash，最多等待 ${Math.round(timeoutMs / 1000)} 秒…`);
      let output = '';
      queue = spawn(binary, ['dev', '-port', new URL(url).port || '8080'], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      // 仅在失败时显示经过脱敏的诊断，避免正常启动时打印测试凭据。
      const capture = (chunk) => {
        output = (output + chunk.toString()).slice(-8000);
      };
      queue.stdout.on('data', capture);
      queue.stderr.on('data', capture);
      queue.on('error', (error) => {
        console.error('本地队列启动失败：', error.message);
        stop(1);
      });
      queue.on('exit', (code, signal) => {
        if (!stopping) {
          console.error(`本地队列已退出（${signal || code}），停止开发服务器。`);
          if (output) console.error(redactQueueOutput(output));
          stop(1);
        }
      });
      try {
        await waitForQueue(url, timeoutMs);
      } catch (error) {
        if (output) console.error(redactQueueOutput(output));
        throw error;
      }
    }
    if (stopping) return;
    console.log('[开发队列] 官方 QStash 已就绪，支持多个新闻任务独立排队。');
  }
  if (stopping) return;
  next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)], {
    stdio: 'inherit',
    windowsHide: true,
    env: getNextDevEnv(),
  });
  next.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  next.on('exit', (code) => stop(code ?? 1));
}
module.exports = { queueReady, waitForQueue, redactQueueOutput, getNextDevEnv };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    stop(1);
  });
}
