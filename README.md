# ScoopRYM 🎵 —— 把互联网热点唱成梗歌

**把热点新闻、娱乐八卦和网络闹剧，改编成值得收听、让人发笑、乐于分享的 Meme Songs。**

ScoopRYM 是一个以新闻内容为入口的音乐娱乐消费平台，面向关注热门新闻、娱乐八卦和互联网文化的用户。编辑团队从公开报道中筛选事件，借助 AI 制作带有明确戏仿属性的歌曲，让用户快速了解事件、听到音乐化的趣味解读，并参与讨论和分享。

平台的核心体验是收听与参与；AI 生成能力服务于后台内容生产。成功标准是用户愿意持续收听、表达反应和分享。当前产品定位与业务边界以 [PRODUCT.md](./PRODUCT.md) 为准。

---

## ✨ 核心亮点

### 1. 热点与歌曲一起看
- 每条内容（Drop）结合事件标题、摘要、原始报道链接和原创 AI 歌曲。
- 首页展示最新发布内容，Weekly Hits 按最近七天的真实播放量排行，Gallery 提供历史内容浏览。
- 内容属于娱乐和音乐评论；用户可通过原始来源了解完整报道。

### 2. 先听，再参与
- 用户可以收听歌曲、表达反应、分享内容；登录后可以评论和参与选题投票。
- 通过 Send a Story 提交公开链接或事件说明，为编辑部提供选题线索。
- 投票为选题提供参考，编辑团队决定最终制作与发布内容。

### 3. 编辑主导的内容生产
- Story Radar 发现公开报道，编辑筛选适合改编的事件。
- 管理员在制作后台完成素材准备、歌词创作、音乐与封面生成、成品检查和发布。
- 生成工作流支持阶段记录与失败恢复；内容在来源审核和歌曲准备完成后发布，不承诺固定每日产量。

### 4. 有分寸的娱乐表达
- 品牌气质鲜活、机灵，围绕公开事件的荒诞性创作，避免围攻个人或编造事实。
- 播放、反应和排行使用真实数据，不用虚假热度制造社交证明。
- 仓库保留 Stripe 和积分基础设施；其存在不代表当前产品采用付费生成工具的商业定位。

---

## 🛠️ 技术架构

### 后端与基础设施
- **框架**: [Next.js 15 (App Router)](https://nextjs.org/) —— 利用 React Server Components 实现极致性能。
- **数据库**: [Drizzle ORM](https://orm.drizzle.team/) + [PostgreSQL](https://www.postgresql.org/) —— 类型安全的数据库操作。
- **认证**: [Better Auth](https://better-auth.com/) —— 简洁且强大的社交/邮箱登录系统。
- **存储**: [Cloudflare R2 (S3 Compatible)](https://www.cloudflare.com/products/r2/) —— 极速且低成本的音频/图片托存。

### AI 核心能力
- **音频服务**: MiniMaxi (music-2.0) API。
- **文本/图像服务**: 主要通过 OpenRouter 调用，具体模型与备选配置见 [模型配置](./src/ai/config/models.ts)。

---

## 📂 项目结构深度分布

```text
├── content/              # 由 Fumadocs 管理的 MDX 文档与博客
├── src/
│   ├── app/              # 核心路由
│   │   ├── [locale]/     # 国际化页面路由
│   │   │   ├── (marketing)/ # 内容首页、歌曲详情、Gallery 等公开页面
│   │   │   ├── (protected)/ # 用户仪表板、收藏、投票、评论与设置
│   │   │   └── (admin)/     # 选题雷达、歌曲制作与内容管理
│   │   └── api/          # 歌词生成、音乐生成、Webhook 处理器
│   ├── ai/               # AI 封装层 (文本转换、音频生成、封面绘图)
│   ├── components/       # 基础 UI (Radix) 与 业务区块 (Blocks)
│   ├── db/               # 数据库 Schema 定义与迁移脚本
│   ├── lib/              # 核心中间件、Auth 配置及工作流逻辑
│   ├── payment/          # Stripe 具体实现与 Server Actions
│   └── credits/          # 积分扣除、分发与配额管理
├── drizzle.config.ts     # 数据库链接配置
└── next.config.ts        # Next.js 运行配置
```

---

## 🚦 快速开始指南

### 1. 准备环境
确保本地已安装 Node.js 18+ 和 `pnpm`：
```bash
git clone <repository-url>
cd scooprym_music
pnpm install
```

### 2. 环境变量设置
复制 `env.example` 到 `.env`：
- `DATABASE_URL`: 你的 PostgreSQL 链接字符串。
- `BETTER_AUTH_SECRET`: 使用 `openssl rand -base64 32` 生成。
- `MINIMAX_API_KEY`: 连接 MiniMax 官方 `music-2.0` API；音乐生成不使用第三方回退渠道。
- `OPENROUTER_API_KEY`: 连接主流 LLM (歌词/图像)。
- `STRIPE_SECRET_KEY`: 处理支付流水。

### 3. 数据库初始化
```bash
pnpm db:push # 同步 Schema 到数据库
```

### 4. 启动开发服务器
```bash
pnpm dev
```
访问 `http://localhost:3000` 浏览内容首页。歌曲制作需要管理员账号，通过管理后台进入。

---

## 📜 更多深度文档

如果您需要深入了解底层逻辑，请访问：
- 📕 [项目开发全手册](./docs/开发手册.md) —— 必读：涵盖了核心生成流、Stripe 状态同步机制及架构细节。
- 🎯 [产品定位](./PRODUCT.md) —— 目标用户、用户价值与业务边界。
- 🎵 [歌曲生成工作流](./docs/song-generation-workflow.md) —— 后台内容生产阶段与恢复机制。
- 📚 [文档索引](./docs/README.md) —— 当前基准与其他开发资料。

---
> **ScoopRYM** —— 看懂热点，听到笑点，分享你的态度。
