import type { SharedV2ProviderOptions } from '@ai-sdk/provider';

import { OPENROUTER_TEXT_FALLBACK_MODELS, OPENROUTER_TEXT_MODEL } from '@/ai/config/models';
import type { TextProvider } from './provider-config';

// OpenAI 直连模型成本较高，仅保留为最后一级灾备，不进入常规调用路径。
const DEFAULT_PROVIDER_ORDER: TextProvider[] = ['openrouter', 'google', 'deepseek', 'openai'];
type TextProviderEnvironment = Readonly<Record<string, string | undefined>>;

type ProviderError = {
  finishReason?: string;
  name?: string;
  statusCode?: number;
  message?: string;
  responseBody?: string;
  cause?: ProviderError;
  errors?: ProviderError[];
};

type ProviderErrorSummary = {
  finishReason?: string;
  name: string;
  statusCode?: number;
  message: string;
};

function collectProviderErrors(error: unknown, seen = new Set<unknown>()): ProviderError[] {
  if (!error || typeof error !== 'object' || seen.has(error)) return [];

  seen.add(error);
  const candidate = error as ProviderError;
  return [
    candidate,
    ...collectProviderErrors(candidate.cause, seen),
    ...(candidate.errors || []).flatMap((item) => collectProviderErrors(item, seen)),
  ];
}

/**
 * 仅记录排障所需的错误类型、状态码和短消息；不记录请求、提示词、响应正文或密钥。
 */
export function summarizeProviderError(error: unknown): ProviderErrorSummary[] {
  return collectProviderErrors(error)
    .map((item) => ({
      name: item.name || 'Error',
      statusCode: item.statusCode,
      ...(item.finishReason ? { finishReason: item.finishReason } : {}),
      message: /JSONParse|TypeValidation/.test(item.name || '')
        ? 'Structured response is incomplete or invalid.'
        : (item.message || 'Unknown provider error').replace(/\s+/g, ' ').slice(0, 240),
    }))
    .filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.name === item.name &&
            candidate.statusCode === item.statusCode &&
            candidate.message === item.message
        ) === index
    );
}

function providerHasApiKey(provider: TextProvider, environment: TextProviderEnvironment) {
  switch (provider) {
    case 'openrouter':
      return !!environment.OPENROUTER_API_KEY;
    case 'google':
      return !!environment.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'deepseek':
      return !!environment.DEEPSEEK_API_KEY;
    case 'openai':
      return !!environment.OPENAI_API_KEY;
    default:
      return false;
  }
}

export function getConfiguredTextProviderOrder(
  preferred?: TextProvider,
  environment: TextProviderEnvironment = process.env
) {
  const ordered = [preferred, ...DEFAULT_PROVIDER_ORDER].filter(Boolean) as TextProvider[];
  return Array.from(new Set(ordered)).filter((provider) => providerHasApiKey(provider, environment));
}

export function shouldFallbackTextProvider(error: unknown) {
  const causes = collectProviderErrors(error);
  const statusCodes = causes.map((item) => item.statusCode).filter((status): status is number => !!status);
  const diagnostic = causes
    .flatMap((item) => [item.name, item.message, item.responseBody])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (statusCodes.some((status) => [401, 402, 403, 408, 429].includes(status) || status >= 500)) {
    return true;
  }

  return [
    'incorrect api key',
    'invalid_api_key',
    'rate limit',
    'quota',
    'insufficient_quota',
    'authentication',
    'unauthorized',
    'no object generated',
    'could not parse the response',
    'failed to parse',
    'did not match the schema',
    'invalid json',
    'invalid lyric finalization',
    'response_format',
    'model not found',
    'invalid model',
    'fetch failed',
    'network error',
    'timed out',
    'timeout',
    'econnreset',
    'socket hang up',
  ].some((fragment) => diagnostic.includes(fragment));
}

/**
 * 推理模型的 reasoning token 与最终 JSON 共用输出预算。OpenRouter 当前候选支持采样温度，
 * 因此保留各创作阶段的差异化温度；OpenAI 直连灾备继续只发送推理参数。
 */
type StructuredOutputSettings = {
  maxRetries: number;
  temperature?: number;
  providerOptions?: SharedV2ProviderOptions;
};

export function getStructuredOutputSettings(provider: TextProvider, temperature: number): StructuredOutputSettings {
  return getStructuredOutputSettingsWithReasoning(provider, temperature, 'low');
}

export function getStructuredOutputSettingsWithReasoning(
  provider: TextProvider,
  temperature: number,
  reasoningEffort: 'low' | 'medium' | 'high'
): StructuredOutputSettings {
  if (provider === 'openrouter') {
    const reasoningTokenBudget = {
      low: 256,
      medium: 512,
      high: 768,
    }[reasoningEffort];

    return {
      // 外层已经按模型和提供商降级；关闭 SDK 内部三连重试，避免一次故障等待数分钟。
      maxRetries: 0,
      temperature,
      providerOptions: {
        openrouter: {
          provider: {
            require_parameters: true,
          },
          // 推理 token 与最终 JSON 共用输出额度，必须预留足够空间给完整结构化结果。
          reasoning: { max_tokens: reasoningTokenBudget, exclude: true },
        },
      },
    };
  }

  if (provider === 'openai') {
    return {
      maxRetries: 0,
      providerOptions: {
        openai: {
          reasoningEffort,
        },
      },
    };
  }

  return { maxRetries: 0, temperature };
}

export async function runWithTextProviderFallback<T>({
  provider,
  execute,
  scope,
  attemptTimeoutMs = 180_000,
  totalTimeoutMs = 360_000,
  maxAttempts = 3,
}: {
  provider?: TextProvider;
  execute: (activeProvider: TextProvider, activeModel: string | undefined, signal: AbortSignal) => Promise<T>;
  scope: string;
  attemptTimeoutMs?: number;
  totalTimeoutMs?: number;
  maxAttempts?: number;
}) {
  const providerOrder = getConfiguredTextProviderOrder(provider);
  let lastError: unknown;
  const startedAt = Date.now();
  let attempts = 0;

  if (providerOrder.length === 0) {
    throw new Error('No configured text model provider is available');
  }

  for (const activeProvider of providerOrder) {
    const modelOrder =
      activeProvider === 'openrouter' ? [OPENROUTER_TEXT_MODEL, ...OPENROUTER_TEXT_FALLBACK_MODELS] : [undefined];

    for (const activeModel of modelOrder) {
      const remainingMs = totalTimeoutMs - (Date.now() - startedAt);
      if (attempts >= maxAttempts || remainingMs <= 0) break;
      attempts += 1;
      const controller = new AbortController();
      const timeoutMs = Math.min(attemptTimeoutMs, remainingMs);
      const attemptStartedAt = Date.now();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        console.info(`[${scope}] Text attempt started`, {
          provider: activeProvider,
          model: activeModel,
          attempt: attempts,
        });
        const result = await Promise.race([
          Promise.resolve().then(() => execute(activeProvider, activeModel, controller.signal)),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              const error = Object.assign(
                new Error(`Text generation timed out in ${scope}. Resume the saved workflow to retry this step.`),
                { name: 'TextGenerationTimeoutError', statusCode: 504 }
              );
              controller.abort(error);
              reject(error);
            }, timeoutMs);
          }),
        ]);
        console.info(`[${scope}] Text attempt completed`, {
          elapsedMs: Date.now() - attemptStartedAt,
          attempt: attempts,
        });
        return result;
      } catch (error) {
        lastError = error;
        if (!shouldFallbackTextProvider(error)) {
          throw error;
        }

        const target = activeModel ? `${activeProvider}/${activeModel}` : activeProvider;
        console.warn(`[${scope}] ${target} failed.`, {
          elapsedMs: Date.now() - attemptStartedAt,
          attempt: attempts,
          errors: summarizeProviderError(error),
        });
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All configured text model providers failed');
}
