# Scooprym Music 🎵

**全球首个 AI 驱动的新闻娱乐嘻哈神曲工厂** —— 将每日最离谱的新闻八卦，一键转化为洗脑的 Diss 神曲。

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Auth-Better--Auth-yellow?style=flat-square)](https://better-auth.com/)

---

## 🚀 项目概述

Scooprym Music 是一个专注于“非正经”音乐创作的 SaaS 平台。我们通过 AI 技术，让普通用户也能瞬间将枯燥的新闻文字转化为极具张力和节奏感的嘻哈歌曲。

### 核心特色
- **新闻荒诞解读**：自动抓取链接或输入文本，AI 生成幽默讽刺的歌词。
- **模块化生成**：支持单曲一键生成，后期将支持分段模块化拼接。
- **魔性效果**：集成 Auto-Tune 让讲话变说唱，自带“洗脑”属性。
- **并发优化**：音频合成与封面生成并行执行，极速交付。

## ✨ 核心功能

- [x] **AI 歌词创作**：支持 OpenAI, Gemini, DeepSeek 多模型驱动，自动押韵。
- [x] **AI 音乐合成**：集成 MiniMaxi 2.0 音乐模型，生成高品质 Rap/Trap 轨道。
- [x] **自动封面设计**：基于歌曲主题，AI 自动生成 1:1 专辑插画。
- [x] **作品分享广场**：发现并收听全球社区创作的高热度神曲。
- [x] **个人创作空间**：管理你的所有“Diss 作品”，支持一键下载与分享。
- [x] **积分系统**：完善的积分消费与充值链路（Stripe 集成）。

## 🛠️ 技术架构

### 核心栈
- **框架**: [Next.js 15 (App Router)](https://nextjs.org/)
- **端侧**: [React 19](https://react.dev/) / [Tailwind CSS 4.0](https://tailwindcss.com/)
- **认证**: [Better Auth](https://better-auth.com/) (支持 Google 一键登录)
- **数据库**: [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- **内容管理**: [Fumadocs](https://fumadocs.com/) (处理博客与文档)
- **UI 组件**: [Radix UI](https://www.radix-ui.com/) / [Lucide React](https://lucide.dev/)

### AI 能力
- **音频**: [MiniMaxi](https://api.minimax.chat/) (music-2.0)
- **文本/图像**: [OpenRouter](https://openrouter.ai/) / [Google Gemini](https://ai.google.dev/)

---

## 📂 项目结构

```text
├── content/              # MDX 内容库 (文档、博客、更新日志)
├── src/
│   ├── app/              # Next.js 页面与 API 路由
│   ├── components/       # 业务组件与 Shadcn UI 基础组件
│   ├── db/               # 数据库 Schema 与 Drizzle 配置
│   ├── hooks/            # 自定义 React Hooks (生成逻辑、积分管理)
│   ├── storage/          # 文件存储工具类 (R2/S3)
│   └── lib/              # 工具函数与配置
├── public/               # 静态资源 (Logo, Icons)
├── drizzle.config.ts     # Drizzle 配置文件
└── next.config.ts        # Next.js 配置文件
```

## 🚥 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd scooprym-music
```

### 2. 安装依赖
建议使用 `pnpm` 以获得最佳性能：
```bash
pnpm install
```

### 3. 环境配置
复制 `.env.example` 并重命名为 `.env`，填入必要的 API Keys:
- `BETTER_AUTH_SECRET`
- `DATABASE_URL`
- `MINIMAX_API_KEY`
- `OPENROUTER_API_KEY`

### 4. 运行项目
```bash
pnpm dev
```
访问 `http://localhost:3000` 即可开始创作。

---

## 📜 许可证

本项目基于商业授权协议执行。详细信息请参阅 [LICENSE](LICENSE) 文件。

---

> **Scooprym Music** —— 让每一条新闻都开口唱歌。🕺🔥
