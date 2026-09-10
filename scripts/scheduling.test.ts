// @vitest-environment node
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire(import.meta.url);
const { checkHobbyCrons } = require('./check-vercel-hobby.cjs');
const { planSchedules } = require('./sync-qstash-schedules.cjs');

describe('部署调度边界', () => {
  it('当前生产配置符合 Hobby 限制', () => {
    expect(() => checkHobbyCrons(require('../vercel.json'))).not.toThrow();
  });
  it.each(['*/10 * * * *', '15,45 * * * *', '0 */2 * * *', '0 1,13 * * *'])(
    '在本地构建就拦截高频配置：%s',
    (schedule) => {
      expect(() => checkHobbyCrons({ crons: [{ path: '/api/cron/test', schedule }] })).toThrow('QStash');
    }
  );
  it('同步复用现有 ID，不改变其他项目调度', () => {
    const plans = planSchedules([
      { scheduleId: 'existing-id', destination: 'https://scooprym.app/api/cron/music-recovery' },
      { scheduleId: 'unrelated', destination: 'https://example.com/task' },
    ]);
    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({ scheduleId: 'existing-id', method: 'POST', cron: '*/10 * * * *' });
    expect(plans[1]).toMatchObject({ cron: '15,45 * * * *' });
  });
  it('同地址重复调度或 ID 被其他地址占用时停止', () => {
    expect(() =>
      planSchedules([
        { scheduleId: 'a', destination: 'https://scooprym.app/api/cron/music-recovery' },
        { scheduleId: 'b', destination: 'https://scooprym.app/api/cron/music-recovery' },
      ])
    ).toThrow('调度冲突');
    expect(() =>
      planSchedules([{ scheduleId: 'scooprym-music-recovery', destination: 'https://example.com/task' }])
    ).toThrow('调度冲突');
  });
});
