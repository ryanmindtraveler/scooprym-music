/**
 * @file music-generation.ts (Moved from services/music.service.ts)
 * @description Encapsulates music audio generation logic (MiniMax).
 */

import { MUSIC_MODEL } from '@/ai/config/models';
import { performance } from 'perf_hooks';

interface MiniMaxRequestOptions {
  apiKey?: string;
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
  message?: string; // Standard error message fallback
  data?: {
    audio?: string;
    base64?: string; // Sometimes APIs change, good to be safe but current logic uses 'audio'
  };
}

import type { GenerateMusicResult } from '@/ai/music/types';

/**
 * Call MiniMax API to generate music
 */
export async function generateMusic(opt: MiniMaxRequestOptions): Promise<GenerateMusicResult> {
  const { prompt, lyrics, outputFormat = 'url', audioFormat = 'mp3', stream = false } = opt;
  const resolvedApiKey = opt.apiKey || process.env.MINIMAX_API_KEY || process.env.MINIMAXI_API_KEY || '';

  const apiUrl = process.env.MINIMAX_API_HOST
    ? `${process.env.MINIMAX_API_HOST}/v1/music_generation`
    : 'https://api.minimax.io/v1/music_generation';

  console.log(`[music-generation] Calling MiniMax API (Streaming: ${stream})...`);
  const apiStartTime = performance.now();

  if (!resolvedApiKey) {
    return {
      success: false,
      error: 'Missing MiniMax API key',
      statusCode: 500,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s Timeout

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedApiKey}`,
      },
      body: JSON.stringify({
        model: MUSIC_MODEL,
        prompt,
        lyrics,
        stream,
        output_format: stream ? 'hex' : outputFormat, // Streaming typically uses hex
        audio_setting: {
          sample_rate: 44100,
          bitrate: 256000,
          format: audioFormat,
        },
        aigc_watermark: false,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (stream && res.ok && res.body) {
      console.log(`[music-generation] Streaming started in ${(performance.now() - apiStartTime).toFixed(2)}ms`);
      return {
        success: true,
        stream: res.body as any,
      };
    }

    const apiEndTime = performance.now();
    console.log(`[music-generation] MiniMax responded in ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

    const data = (await res.json().catch(() => null)) as MiniMaxResponse | null;

    if (!res.ok || !data?.data?.audio) {
      const errorMsg = data?.base_resp?.status_msg || data?.message || 'API Error';
      const statusCode = data?.base_resp?.status_code || res.status;

      console.error('[music-generation] MiniMax Failed:', {
        status: res.status,
        statusCode,
        message: errorMsg,
        fullResponse: JSON.stringify(data),
      });

      return {
        success: false,
        error: errorMsg,
        details: errorMsg,
        statusCode,
      };
    }

    return {
      success: true,
      audioContent: data.data.audio,
    };
  } catch (error: any) {
    console.error('[music-generation] Network/System Exception:', error);
    return {
      success: false,
      error: error.message || 'Network Error',
      statusCode: 500,
    };
  }
}
