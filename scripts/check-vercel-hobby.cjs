const fs = require('node:fs');
const path = require('node:path');

/** 当前部署套餐为 Hobby：高频任务交给 QStash，本地构建提前拦截不支持的配置。 */
function checkHobbyCrons(config) {
  const crons = config.crons || [];
  if (crons.length > 100) throw new Error('Vercel Hobby 每个项目最多配置 100 个定时任务。');
  for (const cron of crons) {
    const fields = cron.schedule.trim().split(/\s+/);
    if (
      fields.length !== 5 ||
      !/^\d+$/.test(fields[0]) ||
      !/^\d+$/.test(fields[1]) ||
      Number(fields[0]) > 59 ||
      Number(fields[1]) > 23
    ) {
      throw new Error(`${cron.path} 的频率 ${cron.schedule} 不符合 Hobby 每日限制，请使用 QStash 调度。`);
    }
  }
}

module.exports = { checkHobbyCrons };
if (require.main === module) {
  checkHobbyCrons(JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8')));
  console.log('Vercel Hobby 定时配置检查通过。');
}
