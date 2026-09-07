import { PROVIDERS, type ProviderKey } from '@/ai/image/lib/provider-config';
import { getSession } from '@/lib/auth/server';
import { createFal } from '@ai-sdk/fal';
import { fireworks } from '@ai-sdk/fireworks';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { replicate } from '@ai-sdk/replicate';
import { type ImageModel, experimental_generateImage as generateImage } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const TIMEOUT_MILLIS = 55 * 1000;
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_ASPECT_RATIO = '1:1';
const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';
const DEFAULT_FLUX_FALLBACK_MODEL = 'black-forest-labs/flux-schnell';
const ALLOWED_IMAGE_SIZES = ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'] as const;
const ALLOWED_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const;
type ImageSize = `${number}x${number}`;
type ImageAspectRatio = `${number}:${number}`;

const providerKeys = Object.keys(PROVIDERS) as [ProviderKey, ...ProviderKey[]];
const generateImageSchema = z
  .object({
    prompt: z.string().trim().min(1).max(6000),
    provider: z.enum(providerKeys).optional(),
    modelId: z.string().trim().min(1).max(200).optional(),
    size: z.enum(ALLOWED_IMAGE_SIZES).optional(),
    aspectRatio: z.enum(ALLOWED_ASPECT_RATIOS).optional(),
  })
  .strict();

const fal = createFal({
  apiKey: process.env.FAL_API_KEY,
});

interface ProviderConfig {
  createImageModel: (modelId: string) => ImageModel;
  dimensionFormat: 'size' | 'aspectRatio';
}

const providerConfig: Record<ProviderKey, ProviderConfig> = {
  google: {
    createImageModel: google.image,
    dimensionFormat: 'aspectRatio',
  },
  openai: {
    createImageModel: openai.image,
    dimensionFormat: 'size',
  },
  fireworks: {
    createImageModel: fireworks.image,
    dimensionFormat: 'aspectRatio',
  },
  replicate: {
    createImageModel: replicate.image,
    dimensionFormat: 'size',
  },
  fal: {
    createImageModel: fal.image,
    dimensionFormat: 'size',
  },
};

function shouldFallbackToFlux(error: unknown) {
  const candidate = error as {
    statusCode?: number;
    message?: string;
    cause?: { statusCode?: number; message?: string };
    responseBody?: string;
  };

  const statusCode = candidate?.statusCode || candidate?.cause?.statusCode;
  const message =
    `${candidate?.message || ''} ${candidate?.cause?.message || ''} ${candidate?.responseBody || ''}`.toLowerCase();

  if (statusCode && [401, 403, 408, 429, 500, 502, 503, 504].includes(statusCode)) {
    return true;
  }

  return (
    message.includes('api key') ||
    message.includes('permission_denied') ||
    message.includes('permission denied') ||
    message.includes('unregistered callers') ||
    message.includes('without established identity') ||
    message.includes('authentication') ||
    message.includes('unauthorized') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('overloaded') ||
    message.includes('unavailable')
  );
}

async function runGeneration({
  provider,
  modelId,
  prompt,
  size,
  aspectRatio,
}: {
  provider: ProviderKey;
  modelId: string;
  prompt: string;
  size?: string;
  aspectRatio?: string;
}) {
  const config = providerConfig[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const options: {
    model: ImageModel;
    prompt: string;
    size?: ImageSize;
    aspectRatio?: ImageAspectRatio;
    providerOptions?: {
      google: {
        imageConfig: {
          imageSize: '2K';
        };
      };
    };
  } = {
    model: config.createImageModel(modelId),
    prompt,
  };

  if (config.dimensionFormat === 'size') {
    options.size = (size || DEFAULT_IMAGE_SIZE) as ImageSize;
  } else {
    options.aspectRatio = (aspectRatio || DEFAULT_ASPECT_RATIO) as ImageAspectRatio;
  }

  if (provider === 'google') {
    options.providerOptions = {
      google: {
        imageConfig: {
          imageSize: '2K',
        },
      },
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Image generation timed out')), TIMEOUT_MILLIS);
  try {
    const { image } = await generateImage({ ...options, abortSignal: controller.signal });

    return {
      image: image.base64,
      provider,
      modelId,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const parsedBody = generateImageSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ success: false, error: 'Invalid image generation request' }, { status: 400 });
    }

    const { prompt, provider, modelId, size, aspectRatio } = parsedBody.data;
    const requestedProvider = provider || 'google';
    const requestedModelId =
      modelId || (requestedProvider === 'google' ? DEFAULT_GEMINI_IMAGE_MODEL : DEFAULT_FLUX_FALLBACK_MODEL);

    if (!PROVIDERS[requestedProvider].models.includes(requestedModelId)) {
      return NextResponse.json({ success: false, error: 'Unsupported image model' }, { status: 400 });
    }

    try {
      const result = await runGeneration({
        provider: requestedProvider,
        modelId: requestedModelId,
        prompt,
        size,
        aspectRatio,
      });

      return NextResponse.json({
        success: true,
        image: result.image,
        provider: result.provider,
        modelId: result.modelId,
        fallbackApplied: false,
      });
    } catch (error) {
      const canFallback =
        requestedProvider === 'google' && !!process.env.REPLICATE_API_TOKEN && shouldFallbackToFlux(error);

      if (!canFallback) {
        throw error;
      }

      console.warn('[image-generation] Gemini image failed, falling back to FLUX Schnell.', error);

      const fallbackResult = await runGeneration({
        provider: 'replicate',
        modelId: DEFAULT_FLUX_FALLBACK_MODEL,
        prompt,
        size,
        aspectRatio,
      });

      return NextResponse.json({
        success: true,
        image: fallbackResult.image,
        provider: fallbackResult.provider,
        modelId: fallbackResult.modelId,
        fallbackApplied: true,
      });
    }
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate image' }, { status: 500 });
  }
}
