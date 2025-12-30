# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 开发命令

### 核心开发

- `pnpm dev` - 启动开发服务器（包含内容集合）
- `pnpm build` - 构建应用程序和内容集合
- `pnpm start` - 启动生产服务器
- `pnpm lint` - 运行 Biome 代码检查器（用于代码质量检查）
- `pnpm format` - 使用 Biome 格式化代码

### 数据库操作 (Drizzle ORM)

- `pnpm db:generate` - 根据模式变更生成新的迁移文件
- `pnpm db:migrate` - 将待处理的迁移应用到数据库
- `pnpm db:push` - 直接将模式变更同步到数据库（仅限开发环境）
- `pnpm db:studio` - 打开 Drizzle Studio 进行数据库检查和管理

### 内容和邮件

- `pnpm content` - 处理 MDX 内容集合
- `pnpm email` - 在端口 3333 上启动邮件模板开发服务器

## 项目概述

这是一个基于 MkSaaS 模板创建的 AI 音乐生成 SaaS 平台，核心功能是将当下热议的新闻八卦娱乐内容通过 AI 模型转化为很上头的神曲。

### 核心业务逻辑

**新闻八卦 → AI 神曲转换流程：**

1. **内容输入**：用户输入新闻链接或直接描述八卦内容
2. **歌词生成**：基于热点内容生成结构化的歌词
3. **音乐生成**：将歌词转换为 AI 生成的音乐
4. **封面生成**：自动为歌曲生成专辑封面
5. **存储管理**：将生成的音乐和元数据保存到数据库

### AI 模型与提供商

**音乐生成：**

- **主要提供商**：MiniMaxi API (`music-2.0`模型)
- **API端点**：`https://api.minimaxi.com/v1/music_generation`
- **支持格式**：MP3、WAV、PCM
- **输出格式**：URL或HEX

**歌词生成：**

- **支持提供商**：OpenAI (GPT-4o-mini)、Google Gemini、DeepSeek、OpenRouter
- **默认使用**：OpenRouter
- **功能特色**：实时歌词编辑、段落重写

**封面图片生成：**

- **提供商**：OpenRouter + Google Gemini 2.5 Flash Image Preview
- **格式**：1:1 方形专辑封面

### 支持的风格类型

- **音乐风格**：Hip-Hop、Rap、Pop、Rock、Electronic等
- **情绪标签**：Energetic、Chill、Sad、Romantic等
- **节奏标签**：Fast、Slow、Upbeat等

## 项目架构

这是一个基于 Next.js 15 的全栈 AI 音乐生成 SaaS 应用程序，包含以下关键架构组件：

### 核心技术栈

- **框架**: Next.js 15 与 App Router
- **数据库**: PostgreSQL 与 Drizzle ORM
- **认证**: Better Auth 与社交提供商（Google、GitHub）
- **支付**: Stripe 集成，支持订阅和一次性支付
- **UI**: Radix UI 组件与 TailwindCSS
- **状态管理**: Zustand 用于客户端状态
- **国际化**: next-intl 支持英文和中文语言环境
- **内容**: Fumadocs 用于文档，MDX 用于内容
- **代码质量**: Biome 用于格式化和代码检查

### 关键目录结构

- `src/app/` - Next.js app router 与国际化路由
- `src/components/` - 按功能组织的可复用 React 组件
- `src/lib/` - 工具函数和共享代码
- `src/db/` - 数据库模式和迁移
- `src/actions/` - API 操作的服务器动作
- `src/stores/` - Zustand 状态管理
- `src/hooks/` - 自定义 React 钩子
- `src/config/` - 应用程序配置文件
- `src/i18n/` - 国际化设置
- `src/mail/` - 邮件模板和邮件功能
- `src/payment/` - Stripe 支付集成
- `src/credits/` - 积分系统实现
- `content/` - 文档和博客的 MDX 内容文件
- `messages/` - 国际化翻译文件 (en.json, zh.json)

### 详细的 src 目录结构

#### 🎯 **核心应用目录**

**`/app/`** - Next.js 15 应用路由

- **`/[locale]/`** - 国际化路由结构
  - **`/(marketing)/`** - 营销页面（首页、定价、博客等）
  - **`/(protected)/`** - 受保护的用户页面（仪表板、设置、歌曲管理等）
  - **`/auth/`** - 认证页面（登录、注册、密码重置）
  - **`/docs/`** - 文档系统
- **`/api/`** - AI 功能的 API 路由（音乐、歌词、图片、聊天等）

**`/components/`** - React 组件库

- **`/ui/`** (324个文件) - 完整的 Radix UI 组件系统
- **`/blocks/`** - 页面区块组件（英雄区块、功能展示、定价、用户评价）
- **`/animate-ui/`** - 动画 UI 组件
- **`/magicui/`** - 特效 UI 组件
- **`/tailark/`** - 主题化组件库
- **功能组件**：设置、仪表板、认证、布局组件

#### 🔧 **核心功能模块**

**`/actions/`** - 服务器动作

- 支付会话创建、积分消费、用户管理、消息发送

**`/ai/`** - AI 功能模块

- **`/chat/`** - 聊天功能
- **`/image/`** - 图片生成
- **`/text/`** - 文本处理

**`/db/`** - 数据库层

- `schema.ts` - 完整的数据库表结构
- `migrations/` - 数据库迁移文件

#### 💰 **业务系统模块**

**`/payment/`** - 支付系统

- Stripe 集成，支持订阅和一次性支付

**`/credits/`** - 积分系统

- 积分管理、分发和消费逻辑

**`/storage/`** - 存储系统

- S3 集成，文件上传和管理

**`/mail/`** - 邮件系统

- 邮件模板和发送功能

#### 🛠️ **辅助功能模块**

**`/config/`** - 配置管理

- 网站配置、积分配置、价格配置等

**`/i18n/`** - 国际化

- 路由、消息、导航的多语言支持

**`/hooks/`** - React Hooks

- 认证、积分、支付等自定义 Hooks

**`/stores/`** - 状态管理

- Zustand 状态管理（本地化状态等）

**`/lib/`** - 工具库

- 认证配置、价格计划、元数据生成等工具函数

#### 📦 **资源目录**

**`/assets/`** - 静态资源

- 字体文件等

**`/styles/`** - 样式文件

- 全局样式配置

### 认证与用户管理

- 使用 Better Auth 与 PostgreSQL 适配器
- 支持邮箱/密码和社交登录（Google、GitHub）
- 包含用户管理、邮箱验证和密码重置
- 管理员插件用于用户管理和封禁
- 用户创建时自动订阅新闻通讯

### 支付系统

- Stripe 集成，支持订阅和一次性支付
- 三个定价层级：免费、专业版（月/年）、终身版
- 积分系统，支持按使用付费功能的积分包
- 客户门户用于订阅管理

### 功能模块

- **博客**: 基于 MDX 的博客，支持分页和分类
- **文档**: Fumadocs 驱动的文档系统
- **AI 音乐生成**: 音乐生成功能，支持多个 AI 提供商
- **AI 歌词生成**: 智能歌词创作功能
- **AI 图片生成**: 专辑封面和音乐相关图片生成
- **新闻通讯**: 邮件订阅系统
- **分析**: 支持多个分析提供商
- **存储**: S3 集成用于音乐文件上传

### 开发工作流程

1. 所有新代码使用 TypeScript
2. 遵循 Biome 格式化规则（单引号、尾随逗号）
3. 在 `src/actions/` 中编写服务器动作
4. 使用 Zustand 进行客户端状态管理
5. 通过 Drizzle 迁移实现数据库变更
6. 使用 Radix UI 组件保持 UI 一致性
7. 遵循既定的目录结构
8. 使用适当的错误处理（error.tsx 和 not-found.tsx）
9. 利用 Next.js 15 功能，如 Server Actions
10. 使用 `next-safe-action` 进行安全的表单提交

### 配置

- 主配置在 `src/config/website.tsx`
- 环境变量模板在 `env.example`
- 数据库配置在 `drizzle.config.ts`
- Biome 配置在 `biome.json`，包含特定的忽略模式
- TypeScript 配置包含路径别名 (`@/*` 指向 `src/*`)

### 测试与质量

- 使用 Biome 进行代码检查和格式化
- TypeScript 确保类型安全
- 环境变量用于配置
- 适当的错误边界和未找到页面
- Zod 用于运行时验证

## 开发指南

### 编码风格与命名约定

- **Biome 配置** (`biome.json`) 强制使用：
  - 2个空格缩进
  - 单引号
  - ES5 尾随逗号
  - 必需的分号

- **文件命名**：
  - 模块文件名使用 kebab-case (`dashboard-sidebar.tsx`)
  - 钩子使用 `use-` 前缀 (`use-session.ts`)
  - 工具函数默认使用命名导出

- **样式管理**：
  - Tailwind 工具类位于 `src/styles` 目录
  - 在此处扩展令牌，而不是分散使用魔法值

- **服务器代码**：
  - 服务器专用代码放在标记有 `"use server"` 的文件中
  - 避免将客户端钩子引入这些模块

### 测试指南

- 自动化测试尚未集成到包脚本中
- 通过以下方式验证变更：
  - `pnpm dev` 开发服务器
  - 代码检查
  - 围绕认证、计费和AI流程的重点手动测试

- **添加测试运行器时**：
  - 将测试文件与功能代码放在一起
  - 使用 `.test.ts(x)` 或 `.spec.ts(x)` 后缀
  - 在 PR 中记录测试命令

- **数据库变更**：
  - 当需要数据变更供评审时，更新 `src/db/migrations` 中的测试数据

### 提交与 Pull Request 指南

#### 提交规范

- 遵循 Conventional Commit 风格 (`feat:`、`fix:`、`chore:`)
- 保持提交范围明确
- 在提交正文中引用问题ID
- 环境变量变更时更新 `env.example`

#### Pull Request 要求

- 包含简洁的摘要
- 测试说明（命令 + 结果）
- UI 更新的截图
- 文档或配置变更的特别说明
- 检查通过后请求评审
- 尽早突出破坏性变更

### 配置与密钥管理

- 在运行命令前将 `env.example` 复制为 `.env`
- 将生产凭据存储在部署提供商处（Vercel、Cloudflare）
- **绝不提交密钥**
- 为 `opennextjs-cloudflare` 或 `wrangler` 使用范围限定的 API 密钥
- 轮换 `src/ai` 中绑定的提供商密钥
- 在合并前移除临时调试日志

## 重要说明

- 项目使用 pnpm 作为包管理器
- 数据库模式在 `src/db/schema.ts` 中，包含认证、支付和积分表
- 邮件模板在 `src/mail/templates/` 中
- 应用支持浅色和深色主题
- 内容通过 `content/` 目录中的 MDX 文件管理
- 项目包含全面的国际化支持
