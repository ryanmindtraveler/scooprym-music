# AI 功能模块说明文档

## 1. 概述
`src/ai` 是本项目的核心 AI 基础设施目录。它采用模块化设计，将不同类型的 AI 能力（文本、图片、音乐、聊天）进行了解耦，并提供了统一的错误处理、性能监控和资源管理机制。

## 2. 目录结构与功能模块

### 🎵 音乐生成 (`/music`)
负责处理 AI 音乐生成的底层逻辑。
-   **lib/**:
    *   `generation.ts`: 封装了对接 MiniMax API 的核心逻辑。
-   **types.ts**: [NEW] 共享的 AI 音乐生成接口定义。
-   **hooks/**:
    *   `use-music-generation.ts`: 核心 Hook，管理音乐生成状态、API 调用和后台轮询。
-   **components/**:
    *   (计划中) 音乐生成相关的特定 UI 组件。

### 🖼️ 图片生成 (`/image`)
一套完整的图片/封面生成系统。
-   **components/**:
    *   `ImageGenerator.tsx`: 核心容器组件。
    *   ...
-   **lib/**:
    *   `cover-generation.ts`: 封面生成逻辑。
-   **hooks/**:
    *   `use-image-generation.ts`: 图片生成 Hook。

### 📝 文本处理与分析 (`/text`)
-   **lib/**:
    *   `generation.ts`: [NEW] 统一的 AI 文本生成库 (OpenAI, Gemini, DeepSeek)，复用于歌词生成和重写。
-   **types.ts**: [NEW] 共享的 AI 文本生成接口定义。
-   **hooks/**:
    *   `use-lyrics-generation.ts`: 歌词生成与重写管理 Hook。
-   **utils/**:
    *   `lyrics-parser.ts`: LRC 歌词解析工具。
    *   `web-content-analyzer.ts`: 网页内容提取器。
    *   `error-handling.ts` & `performance.ts`: 错误处理与监控。
-   **components/**:
    *   `WebContentAnalyzer.tsx`: 内容分析组件。

### 🧩 共享组件 (`/shared`)
-   **components/**:
    *   包含了通用 AI 交互组件（原 `ai-elements`），如 `PromptInput`, `Conversation`, `Message`, `Reasoning` 等，供所有 AI 模块复用。

### 💬 聊天交互 (`/chat`)
-   **components/**:
    *   `ChatBot.tsx`: 基础 AI 聊天界面（已更新引用至 shared 组件）。

## 3. 技术栈与核心驱动

| 领域 | 核心技术 / 提供商 | 备注 |
| :--- | :--- | :--- |
| **基础框架** | Vercel AI SDK | 统一的 AI 模型调用规范 |
| **文本分析** | Firecrawl | 高质量网页爬取与内容净化 |
| **音乐生成** | MiniMax (`music-2.0`) | 专业的 AI 编曲与演唱能力 |
| **图片封面** | OpenRouter + Gemini 2.5 Flash | 高速、高质量的视觉生成 |
| **多样化图片** | Fal.ai, Replicate, OpenAI | 灵活的第三方模型集成 |

## 4. 关键机制说明

### 🛡️ 错误处理 (Reliability)
位于 `src/ai/text/utils/error-handling.ts`。它能识别网络抖动、模型超载、鉴权失败等多种情况，并提供：
-   **自动重试**：对可重试的错误执行多达 3 次的指数退避重试。
-   **用户友好性**：将技术错误代码转换为易于理解的中文建议。

### ⚡ 性能监控 (Performance)
位于 `src/ai/text/utils/performance.ts`。系统会自动记录每一次请求的耗时，通过 `[Performance]` 日志标记，方便开发者在控制台追踪生成效率。

## 5. 开发者指南

### 如何添加新的 AI 供应商？
1.  在 `src/ai/image/lib/provider-config.ts` (图片) 或相关配置中注册供应商名称。
2.  在 API 路由中导入对应的供应商 SDK。
3.  确保环境变量（API KEY）已正确配置。

### 标准响应结构与类型定义
所有 AI 服务都应遵循在 `src/ai/text/types.ts` 和 `src/ai/music/types.ts` 中定义的共享接口（如 `GenerateLyricsResponse`, `GenerateMusicApiResponse`）。这确保了：
1.  **类型安全**: 前后端使用同一套 TS 定义。
2.  **一致性**: UI 层（Hooks）能统一处理 success/error 状态。

