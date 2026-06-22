/**
 * @file image.service.ts
 * @description Encapsulates image generation logic, focusing on album covers via Replicate.
 */

import { IMAGE_MODEL } from '@/ai/config/models';
import Replicate from 'replicate';

type ImageSourceInput =
  | string
  | {
      url?: string | (() => string | Promise<string>);
      toString?: () => string;
    };

async function fetchRemoteImageWithRetry(imageUrl: string, retries = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': 'ScoopRYM-CoverFetcher/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch image source: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      console.warn(`[image-service] Cover fetch attempt ${attempt}/${retries} failed for ${imageUrl}`, error);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch remote image');
}

/**
 * 1. Convert a data URL or remote URL to Buffer
 */
export async function dataUrlToImageBuffer(imageSource: ImageSourceInput): Promise<{
  buffer: Buffer;
  mime: string;
  extension: string;
}> {
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

  const response = await fetchRemoteImageWithRetry(resolvedImageSource);

  const mime = response.headers.get('content-type') || 'image/webp';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extension = 'png';
  if (mime === 'image/jpeg') extension = 'jpg';
  else if (mime === 'image/webp') extension = 'webp';
  else if (mime === 'image/png') extension = 'png';

  return { buffer, mime, extension };
}

/**
 * 2. Generate Cover Image URL via Replicate
 */
export async function generateCoverImageDataUrl(options: {
  title: string;
  lyrics?: string;
  sourceText?: string;
  artPrompt?: string;
}): Promise<string | null> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    console.warn('[image-service] Missing REPLICATE_API_TOKEN, skipping cover generation.');
    return null;
  }

  const replicate = new Replicate({ auth: apiKey });

  const { title, lyrics, sourceText, artPrompt } = options;
  const creativeSource = (sourceText || lyrics || '').replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim();

  const prompt =
    artPrompt && artPrompt.trim().length > 0
      ? artPrompt.trim()
      : [
          `Album cover for "${title}".`,
          'Create one iconic focal subject or scene with immediate thumbnail readability.',
          'Visual style: premium contemporary album art, cinematic lighting, bold silhouette, controlled color palette, rich emotional atmosphere.',
          sourceText && sourceText.trim().length > 0
            ? `Story cue: ${sourceText.slice(0, 320)}`
            : creativeSource.length > 0
              ? `Mood cue: ${creativeSource.slice(0, 320)}`
              : '',
          'Composition: square cover, single dominant subject, centered or slightly off-center, uncluttered background, strong negative space, no tiny competing objects.',
          'Finish: polished, stylish, expressive, graphic, premium, not muddy, not chaotic, not collage-heavy.',
          'Hard constraints: no text, no letters, no logos, no watermark, no UI, no mockup, no border, no duplicated subjects.',
        ]
          .filter(Boolean)
          .join('\n');

  try {
    const output = await replicate.run(IMAGE_MODEL, {
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
    console.error('[image-service] Replicate API exception:', error);
    return null;
  }
}

/**
 * 3. Generate Cover with Retry Logic
 */
export async function generateCoverWithRetry(
  options: {
    title: string;
    lyrics?: string;
    sourceText?: string;
    artPrompt?: string;
  },
  retries = 3
): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      // Logic: If this is the LAST attempt, use a "Safe Fallback" prompt.
      // This bypasses specific content safety filters by requesting generic abstract art.
      const isLastAttempt = i === retries - 1;
      const currentOptions = isLastAttempt
        ? {
            title: 'Abstract Vibes',
            sourceText:
              'Abstract digital art, colorful music visualization, geometric shapes, high quality, 4k wallpaper',
            lyrics: '', // Remove lyrics to avoid text triggers
            artPrompt:
              'Abstract album cover, luminous geometric forms, bold silhouette, saturated color contrast, cinematic lighting, premium digital art, no text, no logo, no watermark.',
          }
        : options;

      if (isLastAttempt) {
        console.log('[image-service] Last retry attempt: Switching to Safe Fallback prompt.');
      }

      const result = await generateCoverImageDataUrl(currentOptions);
      if (result) {
        if (isLastAttempt) console.log('[image-service] Safe Fallback succeeded.');
        return result;
      }

      console.warn(`[image-service] Cover generation returned null, retrying (${i + 1}/${retries})...`);
    } catch (error) {
      console.error(`[image-service] Cover generation attempt ${i + 1} failed:`, error);
    }
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return null;
}
