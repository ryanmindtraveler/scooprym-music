export type TextProvider =
  | 'openai'
  | 'google'
  | 'anthropic'
  | 'fireworks'
  | 'deepseek'
  | 'openrouter';

export const textProviderConfig = {
  openai: {
    model: 'gpt-4o',
  },
  google: {
    model: 'gemini-1.5-pro',
  },
  anthropic: {
    model: 'claude-3-5-sonnet-20240620',
  },
  fireworks: {
    model: 'accounts/fireworks/models/llama-v3-70b-instruct',
  },
  deepseek: {
    model: 'deepseek-chat',
  },
  openrouter: {
    model: 'openai/gpt-4o',
  }
};
