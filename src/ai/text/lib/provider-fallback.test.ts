import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getConfiguredTextProviderOrder,
  getStructuredOutputSettings,
  runWithTextProviderFallback,
  shouldFallbackTextProvider,
  summarizeProviderError,
} from './provider-fallback';

describe('文本模型降级策略', () => {
  it('坏定稿走现有输出故障降级，不当作成功歌词', () => {
    expect(
      shouldFallbackTextProvider(new Error('Invalid lyric finalization: Lyrics need at least 8 sung lines; found 4.'))
    ).toBe(true);
  });
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('默认优先 OpenRouter，并只返回已配置的提供商', () => {
    expect(
      getConfiguredTextProviderOrder(undefined, {
        OPENROUTER_API_KEY: 'configured',
        GOOGLE_GENERATIVE_AI_API_KEY: 'configured',
        DEEPSEEK_API_KEY: 'configured',
      })
    ).toEqual(['openrouter', 'google', 'deepseek']);
  });

  it('将高成本 OpenAI 直连放在所有低成本提供商之后', () => {
    expect(
      getConfiguredTextProviderOrder(undefined, {
        OPENROUTER_API_KEY: 'configured',
        OPENAI_API_KEY: 'configured',
        GOOGLE_GENERATIVE_AI_API_KEY: 'configured',
        DEEPSEEK_API_KEY: 'configured',
      })
    ).toEqual(['openrouter', 'google', 'deepseek', 'openai']);
  });

  it('结构化输出无法解析时切换到下一个提供商', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'configured');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('No object generated: could not parse the response.'))
      .mockResolvedValueOnce('ok');

    await expect(runWithTextProviderFallback({ execute, scope: 'test' })).resolves.toBe('ok');
    expect(execute).toHaveBeenNthCalledWith(1, 'openrouter', 'z-ai/glm-5.3-flash', expect.any(AbortSignal));
    expect(execute).toHaveBeenNthCalledWith(
      2,
      'openrouter',
      'deepseek/deepseek-v4-flash-0731',
      expect.any(AbortSignal)
    );
    expect(warning).toHaveBeenCalledOnce();
  });

  it('连接被对端关闭时切换模型，而不是直接失败', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('Cannot connect to API: other side closed'))
      .mockResolvedValueOnce('ok');
    await expect(runWithTextProviderFallback({ execute, scope: 'test' })).resolves.toBe('ok');
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('账户鉴权失败不在同一账户继续换模型', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'configured');
    const execute = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { statusCode: 401 }))
      .mockResolvedValueOnce('ok');
    await expect(runWithTextProviderFallback({ execute, scope: 'test' })).resolves.toBe('ok');
    expect(execute).toHaveBeenNthCalledWith(2, 'google', undefined, expect.any(AbortSignal));
  });

  it('多个阶段共用截止时间，后续阶段不重新获得完整预算', async () => {
    vi.useFakeTimers();
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    const deadlineAt = Date.now() + 150;
    const first = runWithTextProviderFallback({
      execute: () => new Promise((resolve) => setTimeout(() => resolve('first'), 100)),
      scope: 'first',
      deadlineAt,
    });
    await vi.advanceTimersByTimeAsync(100);
    await expect(first).resolves.toBe('first');
    const execute = vi.fn().mockImplementation(() => new Promise(() => {}));
    const second = runWithTextProviderFallback({ execute, scope: 'second', deadlineAt });
    const assertion = expect(second).rejects.toThrow('Text generation timed out in second');
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.calls[0][2].aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('默认卡死请求在 75 秒后切换，不等待三分钟', async () => {
    vi.useFakeTimers();
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    const execute = vi
      .fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce('ok');
    const pending = runWithTextProviderFallback({ execute, scope: 'test' });
    await vi.advanceTimersByTimeAsync(75000);
    await expect(pending).resolves.toBe('ok');
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('日志不保留供应商回显的密钥片段', () => {
    expect(
      JSON.stringify(summarizeProviderError(new Error('Incorrect API key provided: sk-private-value')))
    ).not.toContain('sk-private-value');
  });

  it('业务输入错误不会盲目切换提供商', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'configured');
    const execute = vi.fn().mockRejectedValue(new Error('Source material is too short'));

    await expect(runWithTextProviderFallback({ execute, scope: 'test' })).rejects.toThrow(
      'Source material is too short'
    );
    expect(execute).toHaveBeenCalledOnce();
  });

  it('请求卡死时取消该请求并切换模型，成功后清除计时器', async () => {
    vi.useFakeTimers();
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    const execute = vi
      .fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce('recovered');
    const pending = runWithTextProviderFallback({ execute, scope: 'test', attemptTimeoutMs: 100, totalTimeoutMs: 500 });
    await vi.advanceTimersByTimeAsync(100);
    await expect(pending).resolves.toBe('recovered');
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[0][2].aborted).toBe(true);
    expect(execute.mock.calls[1][2].aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('总时限耗尽后停止降级，不继续遍历所有模型', async () => {
    vi.useFakeTimers();
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'configured');
    const execute = vi.fn().mockImplementation(() => new Promise(() => {}));
    const pending = runWithTextProviderFallback({
      execute,
      scope: 'lyrics-workshop-plan',
      attemptTimeoutMs: 100,
      totalTimeoutMs: 150,
    });
    const assertion = expect(pending).rejects.toThrow('Text generation timed out in lyrics-workshop-plan');
    await vi.advanceTimersByTimeAsync(150);
    await assertion;
    expect(execute).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('快速连续失败最多尝试三个目标', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'configured');
    const execute = vi.fn().mockRejectedValue(new Error('No object generated: could not parse the response.'));
    await expect(runWithTextProviderFallback({ execute, scope: 'test' })).rejects.toThrow('No object generated');
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('记录输出结束原因，但不把解析失败的原文写入日志', () => {
    const error = Object.assign(new Error('No object generated'), {
      name: 'AI_NoObjectGeneratedError',
      finishReason: 'length',
      cause: Object.assign(new Error('JSON parsing failed: Text: private source material'), {
        name: 'AI_JSONParseError',
      }),
    });
    const summary = summarizeProviderError(error);
    expect(summary[0].finishReason).toBe('length');
    expect(JSON.stringify(summary)).not.toContain('private source material');
  });

  it('识别短暂服务错误和结构化输出错误', () => {
    expect(shouldFallbackTextProvider({ statusCode: 503 })).toBe(true);
    expect(shouldFallbackTextProvider(new Error('Failed to parse JSON response'))).toBe(true);
    expect(shouldFallbackTextProvider(new Error('Content violates policy'))).toBe(false);
  });

  it('识别 AI SDK 重试错误内部的提供商故障', () => {
    const error = Object.assign(new Error('Failed after 3 attempts'), {
      name: 'AI_RetryError',
      errors: [Object.assign(new Error('Provider returned error'), { statusCode: 503 })],
    });

    expect(shouldFallbackTextProvider(error)).toBe(true);
    expect(summarizeProviderError(error)).toEqual([
      { name: 'AI_RetryError', statusCode: undefined, message: 'Failed after 3 attempts' },
      { name: 'Error', statusCode: 503, message: 'Provider returned error' },
    ]);
  });

  it('OpenRouter 同时保留推理配置和创作温度', () => {
    expect(getStructuredOutputSettings('openrouter', 0.8)).toEqual({
      maxRetries: 0,
      temperature: 0.8,
      providerOptions: {
        openrouter: {
          provider: {
            require_parameters: true,
          },
          reasoning: { max_tokens: 256, exclude: true },
        },
      },
    });
    expect(getStructuredOutputSettings('google', 0.8)).toEqual({ maxRetries: 0, temperature: 0.8 });
  });
});
