# Scooprym Music 🎵 —— 全球首个 AI 嘻哈神曲工厂

**将每日最离谱的新闻八卦，一键转化为洗脑的 Diss 神曲。**

Scooprym Music 是一款专注于“非正经”音乐创作的 SaaS 平台。我们利用顶尖的 AI 音乐生成技术，让任何用户都能瞬间将枯燥的新闻链接或社交媒体文本转化为极具张力、节奏感十足且自带幽默属性的嘻哈歌曲。

---

## ✨ 核心亮点

### 1. 荒诞新闻解读 (Lyrics Generation)
- **多模型支持**：集成 OpenAI, Google Gemini, DeepSeek 及 OpenRouter，自动提取新闻核心冲突并转化为押韵歌词。
- **互动编辑**：支持歌词段落重写、实时预览与手动微调。

### 2. 专业级音乐合成 (Music Synthesis)
- **MiniMaxi 2.0 驱动**：采用业界领先的音乐生成模型，支持高质量的 Rap & Trap 轨道。
- **Auto-Tune 魔力**：内置人声优化，让普通文本朗读瞬间拥有说唱灵魂。

### 3. 全自动化视觉配套
- **AI 动态封面**：根据歌曲主题自动生成 1:1 风格化专辑插画，实现“曲、词、画”三位一体。

### 4. 商业闭环链路
- **积分系统 (Credits)**：基于消费模式的计费，支持按需充值。
- **订阅模型 (Subscription)**：集成 Stripe 支付，支持月/年付及终身版会员权益。

---

## 🛠️ 技术架构

### 后端与基础设施
- **框架**: [Next.js 15 (App Router)](https://nextjs.org/) —— 利用 React Server Components 实现极致性能。
- **数据库**: [Drizzle ORM](https://orm.drizzle.team/) + [PostgreSQL](https://www.postgresql.org/) —— 类型安全的数据库操作。
- **认证**: [Better Auth](https://better-auth.com/) —— 简洁且强大的社交/邮箱登录系统。
- **存储**: [Cloudflare R2 (S3 Compatible)](https://www.cloudflare.com/products/r2/) —— 极速且低成本的音频/图片托存。

### AI 核心能力
- **音频服务**: MiniMaxi (music-2.0) API。
- **文本/图像服务**: OpenRouter, Gemini Pro/Flash。

---

## 📂 项目结构深度分布

```text
├── content/              # 由 Fumadocs 管理的 MDX 文档与博客
├── src/
│   ├── app/              # 核心路由
│   │   ├── (marketing)/  # 英雄页、定价、博客、法律条款
│   │   ├── (protected)/  # 仪表板、我的作品、创作页 (Create)
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
复制 `.env.example` 到 `.env`：
- `DATABASE_URL`: 你的 PostgreSQL 链接字符串。
- `BETTER_AUTH_SECRET`: 使用 `openssl rand -base64 32` 生成。
- `MINIMAX_API_KEY`: 连接 MiniMax 官方 Music 2.6 API；音乐生成不使用第三方回退渠道。
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
访问 `http://localhost:3000` 即可开始创作。

---

## 📜 更多深度文档

如果您需要深入了解底层逻辑，请访问：
- 📕 [项目开发全手册](./docs/开发手册.md) —— 必读：涵盖了核心生成流、Stripe 状态同步机制及架构细节。
- 💰 [支付系统实现指南](./docs/支付系统.md) —— 计费、Webhooks 与订阅状态流转。
- 📦 [存储系统说明](./docs/存储系统.md) —— S3 配置与上传模型解析。

---
> **Scooprym Music** —— 给乏味的新闻注入节拍，让八卦成为流行。🕺🔥
