# Hobby 部署与高频任务

2026-09-10 核实：生产项目使用 Vercel Hobby。`vercel.json` 中的高频任务会在构建开始前被拒绝，导致 GitHub 已更新而线上仍是旧版本。

- 每日出刊、夏令时/冬令时归档保留在 Vercel Cron。
- 音乐中断巡检由 QStash 每 12 小时 POST `/api/cron/music-recovery`。
- 新闻采集由 QStash 每 12 小时 POST `/api/cron/story-radar`。
- POST 使用现有 QStash 当前/下一把签名密钥，验证有效期、正文和目标 URL；GET 保留原有 CRON_SECRET 校验。调度迁移不改变工作流、并发锁或付费生成边界。

两项任务均在 UTC 00:00、12:00 执行（北京时间 08:00、20:00），Cron 为 `0 */12 * * *`。这是用户明确指定的运营频率。

## 发布顺序

1. 运行 `pnpm build`，其中 prebuild 会检查 Hobby 定时任务限制。
2. 推送 master，确认 Vercel 自动创建对应提交的生产部署并达到 Ready。
3. 运行 `node scripts/sync-qstash-schedules.cjs` 预览。这使用 Next.js 的生产环境变量加载顺序，只允许线上 Upstash；目标固定为 scooprym.app，不输出凭据。
4. 运行 `node scripts/sync-qstash-schedules.cjs --apply` 创建或更新两个任务，并回读确认启用。已有目标使用原 ID，发现重复则停止，不删除其他调度。
5. 检查 QStash 投递结果和生产端实际响应；检查英文路由及歌曲 404/308 HTTP 回归。

同步脚本不在 build 中执行，避免预览部署、重复构建或构建失败时修改生产调度。首次迁移必须在新代码上线后执行；后续部署复用现有调度。

迁移调度不改变 Vercel 函数本身的资源消耗，也不解除 CPU 额度限制。每日两项调度基线为 4 次投递，失败重试及后续音乐队列消息另计。

参考：[Vercel Cron 套餐限制](https://vercel.com/docs/cron-jobs/usage-and-pricing)、[QStash 调度配置](https://upstash.com/docs/qstash/api-reference/schedules/create-a-schedule)。
