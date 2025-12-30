# Scooprym Music - 开发者手册 (README_DEV)

本文档是针对 **Scooprym Music** 项目的深度技术指南，合并了原有的开发指南与结构说明，并根据项目最新状态（如并发优化逻辑）进行了完整调整。

---

## 📋 1. 项目核心愿景

**全球首个 AI 驱动的新闻娱乐嘻哈神曲工厂** —— 专注于将每日最离谱的新闻八卦，通过 AI 转化为洗脑、幽默且具有传播力的嘻哈歌曲（Diss Tracks）。

- **内容策略**：聚焦荒诞性与幽默感，严格遵循内容安全边界（避开宗教、极端政治等敏感话题）。
- **技术定位**：高性能 SaaS 架构，追求极速的生成体验（并发处理）与完善的积分/支付生态。

---

## 📁 2. 根目录结构详述

### 2.1 根目录配置文件详述 (根目录文件全解)
根目录下包含了大量的配置文件，它们负责项目的构建、环境、代码规范及部署。

#### **核心开发与构建**
- **`package.json`**: 项目的“身份证”。定义了所有依赖包、版本信息以及 `dev`, `build`, `lint` 等核心运行脚本。
- **`pnpm-lock.yaml`**: 依赖锁定文件。确保所有开发者安装的库版本完全一致，由 pnpm 自动生成。
- **`pnpm-workspace.yaml`**: pnpm 工作区配置。用于管理单仓库多项目（Monorepo）结构。
- **`tsconfig.json`**: TypeScript 编译配置。定义了代码检查规则、路径别名（如 `@/*` 指向 `src/*`）等。
- **`tsconfig.tsbuildinfo`**: TS 编译缓存文件。用于加速增量编译，通常不手动修改。
- **`next.config.ts`**: Next.js 核心配置。管理路由、国际化、图片白名单以及 MDX 插件的加载。
- **`next-env.d.ts` / `global.d.ts`**: 全局类型声明。前者由 Next.js 维护，后者用于配置 `next-intl` 等第三方库的全局类型自动补全。

#### **数据库与后端**
- **`drizzle.config.ts`**: 数据库 ORM 配置。定义连接字符串、表定义文件位置 (`src/db/schema.ts`) 和迁移文件存放地。
- **`source.config.ts`**: Fumadocs 专用配置。用于对 `content/` 目录下的 Markdown/MDX 内容进行数据格式建模。
- **`test-minimaxi.js`**: 临时测试脚本。专门用于调试 MiniMaxi 音乐生成 API 的连通性。

#### **样式与 UI**
- **`postcss.config.mjs`**: CSS 后处理配置。目前主要负责加载 Tailwind CSS v4 引擎。
- **`components.json`**: shadcn/ui 的配置文件。记录了 UI 组件的安装目录和样式风格，供 CLI 自动下载代码时使用。

#### **环境与安全 (Keys)**
- **`.env`**: **极度重要**。存放所有敏感 API 密钥（数据库、AI、支付等）。**严禁提交到 Git**。
- **`.env.backup`**: 本地环境变量的备份文件。
- **`env.example`**: 环境变量模板。告知新开发者需要配置哪些变量，但不包含具体密钥。

#### **代码规范与标准**
- **`biome.json`**: 代码格式化与静态检查配置。它替代了 ESLint + Prettier，速度极快。
- **`.editorconfig`**: 编辑器通用配置。确保不同 IDE (Cursor, VSCode) 下的缩进、换行符保持一致。

#### **部署与容器化**
- **`Dockerfile`**: 定义了如何将应用打包成 Docker 镜像，用于私有化或云端部署。
- **`.dockerignore`**: 规定打包镜像时需要排除的文件（如 `node_modules`），以减小体积。
- **`vercel.json`**: Vercel 部署专用配置，管理路由重写和边缘函数设置。

#### **版本控制与仓库元数据**
- **`.gitignore`**: 规定 Git 排除的文件（如 `.env`, `node_modules`, `.next`）。
- **`.gitattributes`**: 定义文件处理规则（如换行符处理、LFS 大文件管理）。
- **`LICENSE`**: 项目开源/商用许可证。
- **`CLAUDE.md` / `.claude` / `.cursor`**: AI 助手相关的角色定义、项目背景与指令配置文件。
- **`.mcp.json`**: Model Context Protocol 分别配置。用于增强 AI 助手在开发时的上下文理解能力。

### 2.2 核心业务目录 (`src/`)
- **`app/`**:
  - `(marketing)/`: 营销页面（首页 `page.tsx`, `pricing/`, `about/` 等）。
  - `(protected)/`: 核心功能区。
    - `create/`: **音乐工作室页面**，集成歌词生成、编辑与音频合成。
    - `songs/`: **我的音乐**，个人作品列表管理。
  - `api/`: 核心 API 服务。
    - `generate-lyrics/`: 基于 AI 的结构化歌词生成。
    - `generate-music/`: 并发执行音频合成与封面生成，支持重试机制。
- **`components/`**:
  - `ui/`: 基础原子组件。
  - `create/`: 创作页专用组件（`LyricsDisplay`, `CreateMusicForm`）。
  - `dashboard/`: 侧边栏与导航组件。
- **`db/`**: 定义了 `songs`, `users`, `credits` 等核心表结构。
- **`hooks/`**:
  - `use-music-generation.ts`: 管理音频生成的全生命周期（请求、轮询显示、错误处理）。
  - `use-credits.ts`: 实时管理用户积分余额。
- **`credits/`**: 积分计算与分配的核心逻辑（`credits.ts`）。

### 2.3 内容与测试
- **`content/`**: MDX 驱动的博客、文档和更新日志库。
- **`docs/`**: **内部开发文档**（Stripe 接入手册、云存储配置等）。
- **`messages/`**: `next-intl` 处理的中英文 JSON 翻译包。
- **`e2e/`**: Playwright 自动化测试脚本，验证核心流程（如歌曲详情加载）。

---

## ⚙️ 3. 核心开发逻辑：音乐生成流

项目在 `src/app/api/generate-music/route.ts` 中实现了高度优化的生成流：

1. **并行启动 (Parallel Start)**:
   - 发送调用 MiniMax 音频 API 的请求后，**立即启动**封面生成任务 (`generateCoverWithRetry`)，不相互阻塞。
2. **自动重试 (Auto-Retry)**:
   - 针对封面生成（通常使用 Gemini/OpenRouter），系统内置了 3 次失败自动重试机制（间隔 1s）。
3. **快速返回 + 后台处理**:
   - 一旦 MiniMax 返回音频 HEX/URL，接口立即向前端响应。
   - 剩余的任务（文件转储至 R2/S3、关联封面图、扣除 2 积分）均在后台异步完成。
4. **版本快照**:
   - 系统记录生成音频时的歌词快照，若用户编辑后歌词与音频不符，前端会提示“Regenerate Audio”。

---

## 🚀 4. 开发常用操作

### 增加一个数据库字段
1. 修改 `src/db/schema.ts`。
2. 运行 `pnpm db:generate` 生成迁移。
3. 运行 `pnpm db:push` 应用到数据库。

### 修改 UI 主题
- 修改 `src/styles/globals.css` 中的 CSS 变量（如 `--primary`, `--background`）。
- 调整 `tailwind.config.ts` 中的扩展配置。

### 常用命令总结
- `pnpm dev`: 启动本地开发环境。
- `pnpm lint`: 执行静态检查。
- `pnpm db:studio`: 开启 Web 端数据库管理界面。
- `npx playwright test`: 运行端到端测试。

---
*上次更新日期：2025-12-19* | *已根据最新代码实现细节进行完整校对与合并*
