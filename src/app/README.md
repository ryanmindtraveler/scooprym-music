# App

## 概述
Next.js 15 App Router 主目录，包含所有页面路由和 API 端点。

## 目录结构

### `/api` - API 路由
- **`/analyze-content`** - 内容分析 API
- **`/auth`** - 认证相关 API
- **`/chat`** - AI 聊天 API
- **`/distribute-credits`** - 积分分发 API
- **`/generate-images`** - 图片生成 API
- **`/generate-lyrics`** - 歌词生成 API
- **`/generate-lyrics-stream`** - 流式歌词生成 API
- **`/generate-music`** - 音乐生成 API
- **`/ping`** - 健康检查 API
- **`/rewrite-lyrics`** - 歌词重写 API
- **`/search`** - 搜索功能 API
- **`/songs`** - 歌曲管理 API
- **`/storage`** - 存储相关 API
- **`/webhooks`** - Webhook 处理

### `/[locale]` - 国际化路由
- **`/(marketing)/`** - 营销页面（首页、定价、博客等）
- **`/(protected)/`** - 受保护的用户页面（仪表板、设置、歌曲管理等）
- **`/auth/`** - 认证页面（登录、注册、密码重置）
- **`/docs/`** - 文档系统

## 核心功能
- 完整的国际化支持（英文和中文）
- 基于角色的访问控制
- 服务器端渲染和静态生成
- 错误边界处理
- 加载状态管理

## 技术特性
- 使用 Next.js 15 App Router
- 支持服务器组件和客户端组件
- 内置国际化路由
- 错误处理和未找到页面
- 元数据生成和 SEO 优化