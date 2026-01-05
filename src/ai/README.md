# AI 功能模块说明文档 (src/ai)

## 1. 概述
`src/ai` 是本项目的核心 AI 基础设施目录，负责连接各种底层 AI 模型并将其转化为产品功能。该目录采用高度模块化的设计，确保了模型切换的灵活性和功能的可扩展性。

## 2. 核心子模块介绍

### 🎵 2.1 音乐生成 (`/music`)
实现 AI 编曲、演唱与音频合成的核心逻辑。
- **核心能力**: 对接 **MiniMax (`music-2.0`)** 模型。
- **关键文件**:
  - `lib/generation.ts`: 封装了音频生成的 API 调用与 HEX/URL 转换。
  - `hooks/use-music-generation.ts`: 驱动前端“生成中”状态、结果轮询及错误反馈。
  - `api-types.ts`: 定义了音乐生成的标准输入输出协议。

### 🖼️ 2.2 视觉生成 (`/image`)
为歌曲提供专属的专辑封面和背景视觉。
- **核心能力**: 集成 **OpenRouter (Gemini 2.5 Flash)**, **Fal.ai**, **Replicate** 等多家引擎。
- **关键文件**:
  - `lib/cover-generation.ts`: 专门针对歌词内容生成 1:1 方形封面的提示词工程与逻辑。
  - `lib/provider-config.ts`: 多模型供应商的配置中枢。
  - `components/ImageGenerator.tsx`: 提供用户手动生成/调整封面的交互界面。

### 📝 2.3 文本与语义分析 (`/text`)
负责从新闻热点到洗脑歌词的转换过程。
- **核心能力**: 支持 **OpenAI**, **Gemini**, **DeepSeek**, **OpenRouter** 等主流 LLM。
- **关键文件**:
  - `lib/generation.ts`: 统一的文本生成接口，支持流式输出和段落重写。
  - `lib/url-content-extractor.ts`: 基于 **Firecrawl** 的网页内容提取器，将各种新闻链接净化为 AI 可理解的文本。
  - `utils/lyrics-parser.ts`: 处理 LRC 标准歌词格式的同步解析。

### 🧩 2.4 共享 AI 组件 (`/shared`)
存放可在不同 AI 场景下通用的 UI 原子组件。
- **组件库**: 包含 `PromptInput` (输入框), `Conversation` (对话流), `Message` (气泡), `Reasoning` (思考状态) 等。
- **目的**: 确保全站 AI 交互体验的一致性，减少组件碎片化。

### 💬 2.5 快速对话 (`/chat`)
- **功能**: 提供基础的 AI 问答交互，用于辅助用户理解功能或寻找灵感。
- **实现**: `components/ChatBot.tsx`。

## 3. 技术路线图 (Technology Stack)

| 领域 | 技术方案 | 优势 |
| :--- | :--- | :--- |
| **模型对接** | Vercel AI SDK (Core) | 统一的 Promise 接口，支持多种 Provider |
| **内容抓取** | Firecrawl / Cheerio | 解决跨域与动态 JS 加载问题，提取核心新闻正文 |
| **音乐引擎** | MiniMax `music-2.0` | 极高的人声还原度与风格适应性 |
| **容错机制** | 指数退避重试 (Exponential Backoff) | 在 API 抖动时确保生成流程不中断 |

## 4. 关键共享机制

- **类型安全**: 全局 AI 类型定义在各自模块的 `types.ts` 或 `api-types.ts` 中，严格对齐 API 响应结构。
- **性能埋点**: 在 `text/utils/performance.ts` 中集成了耗时统计，帮助开发者分析 AI 生成的延迟瓶颈。
- **错误映射**: 自定义错误处理器将复杂的 AI 服务商错误（如 Quota Exceeded）映射为友好的中文提示。

## 5. 开发建议
- 增加新模型时，优先在 `lib/provider-config.ts` 中进行配置化扩展。
- 生成提示词（Prompts）建议集中放在 `lib/` 下的逻辑文件中，避免在业务页面直接硬编码 Prompt。
