/**
 * @file models.ts
 * @description 统一的 AI 模型配置
 */

// --- 核心功能模型 ---

/** 歌词/文本生成使用的模型（默认通过 OpenRouter） */
export const TEXT_MODEL = 'deepseek-v4-flash';

/** OpenAI 直连文本模型 */
export const OPENAI_TEXT_MODEL = 'gpt-5.6-luna';

/** OpenRouter 结构化歌词与文本主模型：支持严格 JSON Schema，兼顾成本与稳定性。 */
export const OPENROUTER_TEXT_MODEL = 'z-ai/glm-5.3-flash';

/** OpenRouter 模型级备选：仅保留支持 structured_outputs 的低成本模型。 */
export const OPENROUTER_TEXT_FALLBACK_MODELS = ['deepseek/deepseek-v4-flash-0731', 'qwen/qwen3.8-flash'] as const;

/** OpenRouter 新闻解析与轻量文本处理模型：与全局最低成本主模型保持一致。 */
export const OPENROUTER_ANALYZER_MODEL = OPENROUTER_TEXT_MODEL;

/** OpenRouter 歌曲封面主模型：Qwen Image 3 Pro。 */
export const QWEN_IMAGE_PRO_MODEL = 'qwen/qwen-image-3-pro';

/** OpenRouter 歌曲封面第一质量兜底：Nano Banana 2。 */
export const NANO_BANANA_IMAGE_MODEL = 'google/gemini-3.1-flash-image';

/** OpenRouter 歌曲封面第二质量兜底：Seedream 5.0 Pro。 */
export const SEEDREAM_IMAGE_PRO_MODEL = 'bytedance-seed/seedream-5-0-pro';

/** 最终跨提供商兜底模型，避免 Google 暂时不可用时中断歌曲流程。 */
export const IMAGE_FALLBACK_MODEL = 'black-forest-labs/flux-schnell';

/** 封面图片生成使用的默认模型（兼容旧引用）。 */
export const IMAGE_MODEL = QWEN_IMAGE_PRO_MODEL;

/** 音乐生成严格使用 MiniMax 官方 Music 2.0。 */
export const MINIMAX_MUSIC_MODEL = 'music-2.0';

/** 音乐生成使用的默认模型（兼容旧引用）。 */
export const MUSIC_MODEL = MINIMAX_MUSIC_MODEL;

// --- 内容分析模型 ---
export const ANALYZER_MODEL = 'deepseek-v4-flash';

/** 内容分析通过 OpenRouter 使用的模型。 */
export const ANALYZER_OPENROUTER_MODEL = OPENROUTER_ANALYZER_MODEL;

// --- 聊天模型 ---
export const CHAT_MODEL = OPENROUTER_TEXT_MODEL;

// --- 提供商配置 ---

export type TextProvider = 'openai' | 'google' | 'anthropic' | 'deepseek' | 'openrouter';

/** 各提供商的模型配置 */
export const textProviderConfig: Record<TextProvider, { model: string }> = {
  openai: {
    model: OPENAI_TEXT_MODEL,
  },
  google: {
    model: 'gemini-3-flash',
  },
  anthropic: {
    model: 'anthropic/claude-sonnet-4.6',
  },
  deepseek: {
    model: TEXT_MODEL,
  },
  openrouter: {
    model: OPENROUTER_TEXT_MODEL,
  },
};

/** 内容分析提供商的模型配置 */
export const analyzerProviderConfig = {
  openai: {
    model: OPENAI_TEXT_MODEL,
  },
  gemini: {
    model: 'gemini-3.1-flash-lite',
  },
  deepseek: {
    model: ANALYZER_MODEL,
  },
  openrouter: {
    model: ANALYZER_OPENROUTER_MODEL,
  },
};

/** 聊天功能可用的模型列表 */
export const chatModels = [
  {
    name: 'GLM 5.3 Flash',
    value: CHAT_MODEL,
  },
  {
    name: 'Gemini 3.1 Flash Lite',
    value: 'google/gemini-3.1-flash-lite-preview',
  },
  {
    name: 'DeepSeek R1',
    value: 'deepseek/deepseek-r1',
  },
] as const;
