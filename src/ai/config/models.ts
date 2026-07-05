/**
 * @file models.ts
 * @description 统一的 AI 模型配置
 */

// --- 核心功能模型 ---

/** 歌词/文本生成使用的模型（默认通过 OpenRouter） */
export const TEXT_MODEL = 'deepseek-v4-flash';

export const OPENROUTER_TEXT_MODEL = 'deepseek/deepseek-v4-flash';

/** 封面图片生成使用的模型 */
export const IMAGE_MODEL = 'black-forest-labs/flux-schnell';

/** 音乐生成使用的模型 */
export const MUSIC_MODEL = 'music-2.0';

// --- 内容分析模型 ---
export const ANALYZER_MODEL = 'deepseek-v4-flash';

/** 内容分析通过 OpenRouter 使用的模型 */
export const ANALYZER_OPENROUTER_MODEL = 'deepseek/deepseek-v4-flash';

// --- 聊天模型 ---
export const CHAT_MODEL = 'deepseek/deepseek-v4-flash';

// --- 提供商配置 ---

export type TextProvider = 'openai' | 'google' | 'anthropic' | 'deepseek' | 'openrouter';

/** 各提供商的模型配置 */
export const textProviderConfig: Record<TextProvider, { model: string }> = {
  openai: {
    model: 'openai/gpt-5.4',
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
    model: 'openai/gpt-5.4',
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
    name: 'DeepSeek V4 Flash',
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
