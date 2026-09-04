/**
 * @file generation.ts
 * @description MiniMax 官方音乐生成入口，只允许调用统一配置的官方音乐模型。
 */

import { performance } from 'node:perf_hooks';
import { MINIMAX_MUSIC_MODEL } from '@/ai/config/models';
import type { GenerateMusicResult } from '@/ai/music/types';

export type MusicGenerationProvider = 'minimax';

type MusicGenerationEnvironment = Readonly<Record<string, string | undefined>>;

interface MusicGenerationRequestOptions {
  apiKey?: string;
  provider?: MusicGenerationProvider;
  prompt: string;
  lyrics: string;
  outputFormat?: 'url' | 'hex';
  audioFormat?: 'mp3' | 'wav' | 'pcm';
  stream?: boolean;
}

interface MiniMaxResponse {
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
  message?: string;
  data?: {
    audio?: string;
    status?: number;
  };
}

const MINIMAX_MUSIC_API_URL = 'https://api.minimax.io/v1/music_generation';

function getMiniMaxApiKey(environment: MusicGenerationEnvironment) {
  return environment.MINIMAX_API_KEY?.trim() || environment.MINIMAXI_API_KEY?.trim() || '';
}

/**
 * 音乐生成严格锁定为 MiniMax 官方渠道。配置为其他提供商时返回 null，
 * 防止生产环境在官方渠道不可用时静默切换模型。
 */
export function resolveMusicGenerationProvider(
  requestedProvider?: MusicGenerationProvider,
  environment: MusicGenerationEnvironment = process.env
): MusicGenerationProvider | null {
  const configuredProvider = (requestedProvider || environment.MUSIC_GENERATION_PROVIDER || 'minimax')
    .trim()
    .toLowerCase();
  if (configuredProvider !== 'minimax') return null;
  return getMiniMaxApiKey(environment) ? 'minimax' : null;
}

export function isMusicGenerationConfigured(environment: MusicGenerationEnvironment = process.env) {
  return resolveMusicGenerationProvider(undefined, environment) === 'minimax';
}

async function generateWithMiniMax(
  opt: MusicGenerationRequestOptions,
  environment: MusicGenerationEnvironment
): Promise<GenerateMusicResult> {
  const apiKey = opt.apiKey?.trim() || getMiniMaxApiKey(environment);
  if (!apiKey) {
    return {
      success: false,
      error: 'MiniMax official API key is not configured',
      statusCode: 503,
    };
  }

  const outputFormat = opt.stream ? 'hex' : opt.outputFormat || 'url';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240_000);
  const startedAt = performance.now();

  try {
    const response = await fetch(MINIMAX_MUSIC_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MINIMAX_MUSIC_MODEL,
        prompt: opt.prompt,
        lyrics: opt.lyrics,
        stream: opt.stream || false,
        output_format: outputFormat,
        lyrics_optimizer: false,
        is_instrumental: false,
        audio_setting: {
          sample_rate: 44100,
          bitrate: 256000,
          format: opt.audioFormat || 'mp3',
        },
      }),
      signal: controller.signal,
    });

    if (opt.stream && response.ok && response.body) {
      return { success: true, stream: response.body, outputFormat: 'hex' };
    }

    const data = (await response.json().catch(() => null)) as MiniMaxResponse | null;
    if (!response.ok || !data?.data?.audio) {
      const message = data?.base_resp?.status_msg || data?.message || 'MiniMax music generation failed';
      const statusCode = data?.base_resp?.status_code || response.status || 502;
      console.error('[music-generation] MiniMax official API request failed:', { statusCode, message });
      return { success: false, error: message, details: message, statusCode };
    }

    console.log(
      `[music-generation] MiniMax ${MINIMAX_MUSIC_MODEL} completed in ${Math.round(performance.now() - startedAt)}ms`
    );
    return { success: true, audioContent: data.data.audio, outputFormat };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    const message = timedOut
      ? 'MiniMax official music API timed out'
      : error instanceof Error
        ? error.message
        : 'MiniMax official music API request failed';
    console.error('[music-generation] MiniMax official API request failed:', message);
    return { success: false, error: message, statusCode: timedOut ? 504 : 502 };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 调用统一配置的 MiniMax 官方音乐模型；不提供第三方回退。 */
export async function generateMusic(
  opt: MusicGenerationRequestOptions,
  environment: MusicGenerationEnvironment = process.env
): Promise<GenerateMusicResult> {
  const provider = resolveMusicGenerationProvider(opt.provider, environment);
  if (!provider) {
    return {
      success: false,
      error: 'MiniMax official music API is not configured. Set MINIMAX_API_KEY and MUSIC_GENERATION_PROVIDER=minimax.',
      statusCode: 503,
    };
  }

  console.log(`[music-generation] Using MiniMax official ${MINIMAX_MUSIC_MODEL}`);
  return generateWithMiniMax(opt, environment);
}
