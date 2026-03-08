/**
 * @file models.ts
 * @description 统一的 AI 模型配置
 */

// --- 核心功能模型 ---

/** 歌词/文本生成使用的模型（默认通过 OpenRouter） */
export const TEXT_MODEL = 'google/gemini-3-flash-preview';

/** 封面图片生成使用的模型 */
export const IMAGE_MODEL = 'google/gemini-3.1-flash-image-preview';

/** 音乐生成使用的模型 */
export const MUSIC_MODEL = 'music-2.0';

// --- 内容分析模型 ---
export const ANALYZER_MODEL = 'google/gemini-3.1-flash-lite-preview';

/** 内容分析通过 OpenRouter 使用的模型 */
export const ANALYZER_OPENROUTER_MODEL = 'google/gemini-3.1-flash-lite-preview';

// --- 聊天模型 ---
export const CHAT_MODEL = 'google/gemini-3.1-flash-lite-preview';

// --- 提供商配置 ---

export type TextProvider = 'openai' | 'google' | 'anthropic' | 'deepseek' | 'openrouter';

/** 各提供商的模型配置 */
export const textProviderConfig: Record<TextProvider, { model: string }> = {
  openai: {
    model: 'openai/gpt-5.4',
  },
  google: {
    model: TEXT_MODEL,
  },
  anthropic: {
    model: 'anthropic/claude-sonnet-4.6',
  },
  deepseek: {
    model: 'deepseek-chat',
  },
  openrouter: {
    model: TEXT_MODEL,
  },
};

/** 内容分析提供商的模型配置 */
export const analyzerProviderConfig = {
  openai: {
    model: ANALYZER_MODEL,
  },
  gemini: {
    model: ANALYZER_MODEL,
  },
  deepseek: {
    model: 'deepseek-chat',
  },
  openrouter: {
    model: ANALYZER_OPENROUTER_MODEL,
  },
};

/** 聊天功能可用的模型列表 */
export const chatModels = [
  {
    name: 'google/gemini-3.1-flash-lite-preview',
    value: CHAT_MODEL,
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
] as const;
