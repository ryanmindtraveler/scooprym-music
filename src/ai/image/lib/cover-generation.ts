/**
 * @file image.service.ts
 * @description 封装歌曲封面生成：Qwen Image 3 Pro → Nano Banana 2 → Seedream 5.0 Pro → FLUX Schnell。
 */

import {
  IMAGE_FALLBACK_MODEL,
  NANO_BANANA_IMAGE_MODEL,
  QWEN_IMAGE_PRO_MODEL,
  SEEDREAM_IMAGE_PRO_MODEL,
} from '@/ai/config/models';
import Replicate from 'replicate';

const OPENROUTER_IMAGE_ENDPOINT = 'https://openrouter.ai/api/v1/images';
const OPENROUTER_IMAGE_TIMEOUT_MILLIS = 120_000;
const COVER_IMAGE_RESOLUTION = '1K';

export interface CoverGenerationOptions {
  title: string;
  lyrics?: string;
  sourceText?: string;
  artPrompt?: string;
  signal?: AbortSignal;
}

type ImageSourceInput =
  | string
  | {
      url?: string | (() => string | Promise<string>);
      toString?: () => string;
    };

async function fetchRemoteImageWithRetry(imageUrl: string, signal?: AbortSignal, retries = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    signal?.throwIfAborted();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch(imageUrl, {
        signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal,
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': 'ScoopRYM-CoverFetcher/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image source: ${response.status}`);
      }

      // 下载正文也必须处于超时保护之内。
      const arrayBuffer = await response.arrayBuffer();
      return { arrayBuffer, mime: response.headers.get('content-type') || 'image/webp' };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      signal?.throwIfAborted();
      console.warn(`[image-service] Cover fetch attempt ${attempt}/${retries} failed for ${imageUrl}`, error);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch remote image');
}

/**
 * 1. Convert a data URL or remote URL to Buffer
 */
export async function dataUrlToImageBuffer(
  imageSource: ImageSourceInput,
  signal?: AbortSignal
): Promise<{
  buffer: Buffer;
  mime: string;
  extension: string;
}> {
  signal?.throwIfAborted();
  const resolvedImageSource =
    typeof imageSource === 'string'
      ? imageSource
      : typeof imageSource?.url === 'function'
        ? await imageSource.url()
        : typeof imageSource?.url === 'string'
          ? imageSource.url
          : typeof imageSource?.toString === 'function'
            ? imageSource.toString()
            : null;

  if (!resolvedImageSource) {
    throw new Error('Invalid image source input');
  }

  const dataUrlMatch = resolvedImageSource.match(/^data:(.+);base64,(.+)$/);
  if (dataUrlMatch) {
    const mime = dataUrlMatch[1];
    const base64 = dataUrlMatch[2];
    const buffer = Buffer.from(base64, 'base64');

    let extension = 'png';
    if (mime === 'image/jpeg') extension = 'jpg';
    else if (mime === 'image/webp') extension = 'webp';

    return { buffer, mime, extension };
  }

  const { mime, arrayBuffer } = await fetchRemoteImageWithRetry(resolvedImageSource, signal);
  const buffer = Buffer.from(arrayBuffer);

  let extension = 'png';
  if (mime === 'image/jpeg') extension = 'jpg';
  else if (mime === 'image/webp') extension = 'webp';
  else if (mime === 'image/png') extension = 'png';

  return { buffer, mime, extension };
}

/**
 * 构造符合 ScoopRYM 品牌气质的专辑封面提示词。
 */
export function buildCoverPrompt(options: CoverGenerationOptions) {
  const { title, lyrics, sourceText, artPrompt } = options;
  const creativeSource = (sourceText || lyrics || '')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return [
    `Create a square album cover for the meme song "${title}".`,
    'ScoopRYM Gallery house style: full-bleed editorial pop-art with comic-book confidence, cyber-pop polish, tabloid energy, and a witty story-specific visual punchline.',
    'Palette: electric magenta, cyan, cobalt, violet, acid yellow, and hot red with deep cinematic contrast, luminous rim light, and crisp illustrated contours.',
    'Create a dynamic narrative scene rather than an isolated portrait: expressive body language, recognizable story props, and a rich layered environment across foreground, midground, and background.',
    'The image should feel like an outrageous music-video freeze frame with diagonal motion, cinematic depth, scale contrast, and enough bold detail to remain readable as a small thumbnail.',
    'Keep it stylized and editorial rather than photorealistic. Detailed costumes, props, and environments are essential.',
    artPrompt && artPrompt.trim().length > 0 ? `Creative direction: ${artPrompt.trim().slice(0, 800)}` : '',
    sourceText && sourceText.trim().length > 0
      ? `Reported story cue: ${sourceText.replace(/\s+/g, ' ').trim().slice(0, 480)}`
      : creativeSource.length > 0
        ? `Song mood cue: ${creativeSource.slice(0, 480)}`
        : '',
    'Avoid plain or single-color backgrounds, empty studio portraits, passport-style framing, minimalist gradients, generic glamour photography, weak detail, and large unused negative space.',
    'Finish: polished commercial album artwork, expressive, crisp, layered, high-energy, premium, and instantly shareable as entertainment-news culture.',
    'Hard constraints: no text, no letters, no logos, no watermark, no UI, no mockup, no border, no duplicated limbs or malformed hands.',
  ]
    .filter(Boolean)
    .join('\n');
}

interface OpenRouterImageResponse {
  data?: Array<{
    b64_json?: string;
    media_type?: string;
  }>;
  error?: {
    message?: string;
  };
}

async function generateOpenRouterCover(modelId: string, prompt: string, signal?: AbortSignal): Promise<string | null> {
  signal?.throwIfAborted();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error(`OpenRouter image generation timed out: ${modelId}`)),
    OPENROUTER_IMAGE_TIMEOUT_MILLIS
  );

  try {
    const response = await fetch(OPENROUTER_IMAGE_ENDPOINT, {
      method: 'POST',
      signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://scooprym.app',
        'X-Title': 'ScoopRYM',
      },
      body: JSON.stringify({
        model: modelId,
        prompt,
        n: 1,
        resolution: COVER_IMAGE_RESOLUTION,
        aspect_ratio: '1:1',
      }),
    });

    const payload = (await response.json().catch(() => null)) as OpenRouterImageResponse | null;
    if (!response.ok) {
      throw new Error(payload?.error?.message || `OpenRouter image request failed: ${response.status}`);
    }

    const image = payload?.data?.[0];
    if (!image?.b64_json) {
      throw new Error('OpenRouter returned no image data');
    }

    return `data:${image.media_type || 'image/png'};base64,${image.b64_json}`;
  } catch (error) {
    signal?.throwIfAborted();
    console.warn(`[image-service] OpenRouter cover model ${modelId} failed.`, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateReplicateCover(prompt: string, signal?: AbortSignal): Promise<string | null> {
  signal?.throwIfAborted();
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    return null;
  }

  const replicate = new Replicate({ auth: apiKey });

  try {
    const output = await replicate.run(IMAGE_FALLBACK_MODEL, {
      signal,
      input: {
        prompt,
        go_fast: true,
        megapixels: '1',
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'webp',
        output_quality: 80,
        num_inference_steps: 4,
      },
    });

    const firstOutput = Array.isArray(output) ? output[0] : null;
    if (!firstOutput) {
      console.warn('[image-service] Replicate returned no image output');
      return null;
    }

    const imageUrl =
      typeof firstOutput === 'string'
        ? firstOutput
        : typeof (firstOutput as { url?: unknown }).url === 'function'
          ? await (firstOutput as { url: () => Promise<string> | string }).url()
          : typeof (firstOutput as { url?: unknown }).url === 'string'
            ? ((firstOutput as { url: string }).url as string)
            : typeof (firstOutput as { toString?: unknown }).toString === 'function'
              ? (firstOutput as { toString: () => string }).toString()
              : null;

    if (!imageUrl) {
      console.warn('[image-service] Replicate returned no valid image URL');
      return null;
    }

    return imageUrl;
  } catch (error) {
    signal?.throwIfAborted();
    console.warn('[image-service] FLUX fallback failed.', error);
    return null;
  }
}

/**
 * 按质量顺序生成封面，并在提供商不可用时自动降级。
 */
export async function generateCoverImageDataUrl(options: CoverGenerationOptions): Promise<string | null> {
  const prompt = buildCoverPrompt(options);

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('[image-service] Missing OPENROUTER_API_KEY; using FLUX fallback.');
  } else {
    const qwenImage = await generateOpenRouterCover(QWEN_IMAGE_PRO_MODEL, prompt, options.signal);
    if (qwenImage) {
      console.info(`[image-service] Cover generated with ${QWEN_IMAGE_PRO_MODEL}.`);
      return qwenImage;
    }

    const geminiImage = await generateOpenRouterCover(NANO_BANANA_IMAGE_MODEL, prompt, options.signal);
    if (geminiImage) {
      console.info(`[image-service] Cover generated with ${NANO_BANANA_IMAGE_MODEL}.`);
      return geminiImage;
    }

    const seedreamImage = await generateOpenRouterCover(SEEDREAM_IMAGE_PRO_MODEL, prompt, options.signal);
    if (seedreamImage) {
      console.info(`[image-service] Cover generated with ${SEEDREAM_IMAGE_PRO_MODEL}.`);
      return seedreamImage;
    }
  }

  const fallbackImage = await generateReplicateCover(prompt, options.signal);
  if (fallbackImage) {
    console.info(`[image-service] Cover generated with ${IMAGE_FALLBACK_MODEL}.`);
  }
  return fallbackImage;
}

/**
 * 首轮失败后再使用不包含具体人物与事件的安全提示词尝试一次。
 */
export async function generateCoverWithRetry(options: CoverGenerationOptions, retries = 2): Promise<string | null> {
  const result = await generateCoverImageDataUrl(options);
  if (result || retries <= 1) {
    return result;
  }

  console.warn('[image-service] Retrying cover generation with the ScoopRYM Gallery fallback direction.');
  return generateCoverImageDataUrl({
    title: options.title,
    signal: options.signal,
    artPrompt:
      'Full-bleed surreal entertainment-news scene in ScoopRYM Gallery house style: dynamic character action, a funny visual punchline, layered neon city or backstage environment, comic editorial linework, story props, cinematic depth, saturated magenta-cyan-violet palette, no plain background, no text.',
  });
}
