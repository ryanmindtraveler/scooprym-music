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

  const response = await fetch(resolvedImageSource);
  if (!response.ok) {
    throw new Error(`Failed to fetch image source: ${response.status}`);
  }

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
}): Promise<string | null> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    console.warn('[image-service] Missing REPLICATE_API_TOKEN, skipping cover generation.');
    return null;
  }

  const replicate = new Replicate({ auth: apiKey });

  const { title, lyrics, sourceText } = options;

  const descriptionParts: string[] = [];
  descriptionParts.push(`Create a vibrant, modern album cover for a hip-hop / rap track titled "${title}".`);

  if (sourceText && sourceText.trim().length > 0) {
    descriptionParts.push(
      'The song is inspired by the following news or story content (summarize visually, no text in image):'
    );
    descriptionParts.push(sourceText.slice(0, 500));
  } else if (lyrics && lyrics.trim().length > 0) {
    descriptionParts.push(
      'The song lyrics theme is roughly as follows (summarize visually, do not include text in the image itself):'
    );
    descriptionParts.push(lyrics.slice(0, 500));
  }

  descriptionParts.push('Style: bold colors, high contrast, clean composition, NO TEXT, square 1:1 album art.');
  descriptionParts.push(
    'Quality: High resolution 8k, masterpiece, highly detailed, sharp focus. COMPOSITION RULE: The image MUST be full bleed and fill the entire square canvas from edge to edge. NO borders, NO frames, NO letterboxing, NO padding, NO white background. The subject should be prominent and fill the frame.'
  );

  const prompt = descriptionParts.join('\n\n');

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
