// 本地开发复用官方 QStash 服务；不把云端队列投递到 localhost。
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
require('@next/env').loadEnvConfig(process.cwd(), true);

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

async function queueReady(url) {
  try {
    const response = await fetch(`${url}/v2/events`, {
      headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const url = process.env.QSTASH_URL;
  if (url && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) {
    if (!(await queueReady(url))) {
      const binary = process.env.QSTASH_LOCAL_BINARY;
      if (!binary || !existsSync(binary)) {
        throw new Error('请安装官方 @upstash/qstash-cli，并在 .env.development.local 设置 QSTASH_LOCAL_BINARY。');
      }
      queue = spawn(binary, ['dev', '-port', new URL(url).port || '8080'], {
        windowsHide: true,
        stdio: 'ignore',
      });
      queue.on('error', (error) => {
        console.error('本地队列启动失败：', error.message);
        stop(1);
      });
      queue.on('exit', () => {
        if (!stopping) {
          console.error('本地队列已退出，停止开发服务器。');
          stop(1);
        }
      });
      let ready = false;
      for (let attempt = 0; attempt < 20 && !stopping; attempt++) {
        if (await queueReady(url)) {
          ready = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (!ready) throw new Error('本地队列未就绪，请检查端口和本地测试凭据。');
    }
    console.log('[开发队列] 官方 QStash 已就绪，支持多个新闻任务独立排队。');
  }
  if (stopping) return;
  next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)], {
    stdio: 'inherit',
    windowsHide: true,
    env: process.env,
  });
  next.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  next.on('exit', (code) => stop(code ?? 1));
}
main().catch((error) => {
  console.error(error.message);
  stop(1);
});
