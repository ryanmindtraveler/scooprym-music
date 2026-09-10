const { Client } = require('@upstash/qstash');

const definitions = [
  { scheduleId: 'scooprym-music-recovery', path: '/api/cron/music-recovery', cron: '*/10 * * * *' },
  { scheduleId: 'scooprym-story-radar', path: '/api/cron/story-radar', cron: '15,45 * * * *' },
];

/** 复用已有 ID，避免重复运行迁移脚本后同一任务被多次调度。 */
function planSchedules(existing) {
  return definitions.map(({ path, ...definition }) => {
    const destination = `https://scooprym.app${path}`;
    const matches = existing.filter(
      (item) => item.destination === destination || item.scheduleId === definition.scheduleId
    );
    if (matches.length > 1 || (matches[0] && matches[0].destination !== destination)) {
      throw new Error(`调度冲突：${destination}，请先核对已有任务。`);
    }
    return {
      ...definition,
      scheduleId: matches[0]?.scheduleId || definition.scheduleId,
      destination,
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
      retries: 2,
      retryDelay: '60000',
    };
  });
}

async function main() {
  require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const apply = process.argv.includes('--apply');
  const baseUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  const host = new URL(baseUrl);
  if (host.protocol !== 'https:' || !host.hostname.endsWith('.upstash.io')) {
    throw new Error('仅允许连接线上 Upstash；不会向本地开发队列创建生产调度。');
  }
  if (!process.env.QSTASH_TOKEN || !process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
    throw new Error('缺少生产 QStash token 或签名配置。');
  }
  const client = new Client({ token: process.env.QSTASH_TOKEN, baseUrl });
  const plans = planSchedules(await client.schedules.list());
  for (const plan of plans) {
    console.log({ mode: apply ? '应用' : '预览', id: plan.scheduleId, destination: plan.destination, cron: plan.cron });
    if (!apply) continue;
    const { scheduleId } = await client.schedules.create(plan);
    await client.schedules.resume({ schedule: scheduleId });
    const saved = await client.schedules.get(scheduleId);
    if (
      saved.destination !== plan.destination ||
      saved.cron !== plan.cron ||
      saved.method !== 'POST' ||
      saved.isPaused
    ) {
      throw new Error(`调度回读不一致：${scheduleId}`);
    }
    console.log({ id: scheduleId, active: true, cron: saved.cron });
  }
}

module.exports = { planSchedules };
if (require.main === module) {
  main().catch((error) => {
    // SDK 异常可能包含请求细节，只输出状态，避免把凭据写入日志。
    console.error('调度同步失败', error.status || error.name);
    process.exitCode = 1;
  });
}
