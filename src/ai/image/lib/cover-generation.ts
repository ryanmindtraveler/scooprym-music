/**
 * @file image.service.ts
 * @description Encapsulates image generation logic, focusing on album covers.
 */

interface OpenRouterImageChoice {
  image_url?: {
    url?: string;
  };
}

interface OpenRouterImageMessage {
  images?: OpenRouterImageChoice[];
}

interface OpenRouterImageResponse {
  choices?: {
    message?: OpenRouterImageMessage;
  }[];
}

/**
 * 1. Convert Data URL to Buffer
 */
export function dataUrlToImageBuffer(dataUrl: string): {
  buffer: Buffer;
  mime: string;
  extension: string;
} {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URL format');
  }

  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  let extension = 'png';
  if (mime === 'image/jpeg') extension = 'jpg';
  else if (mime === 'image/webp') extension = 'webp';

  return { buffer, mime, extension };
}

/**
 * 2. Generate Cover Image Data URL via OpenRouter
 */
export async function generateCoverImageDataUrl(options: {
  title: string;
  lyrics?: string;
  sourceText?: string;
}): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('[image-service] Missing OPENROUTER_API_KEY, skipping cover generation.');
    return null;
  }

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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
        image_config: { aspect_ratio: '1:1', size: '1024x1024' },
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error(
        '[image-service] OpenRouter request failed:',
        response.status,
        await response.text().catch(() => '')
      );
      return null;
    }

    const result = (await response.json()) as OpenRouterImageResponse;
    const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.warn('[image-service] OpenRouter returned no valid image URL');
      return null;
    }

    return imageUrl;
  } catch (error) {
    console.error('[image-service] OpenRouter API exception:', error);
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
