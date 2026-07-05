import type { FullSongsBrief, FullSongsSourceMode } from '@/features/full-songs/types/full-songs';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

import { ANALYZER_MODEL, ANALYZER_OPENROUTER_MODEL } from '@/ai/config/models';
import type { TextProvider } from './provider-config';

const sourceAnalysisSchema = z.object({
  isValid: z
    .boolean()
    .describe('Set to false if the source is unusable, incoherent, or too weak to build a story brief from.'),
  validationError: z.string().nullable().describe('Helpful reason for rejection. Required when isValid is false.'),
  title: z.string().describe('A catchy, short title seed based on the source.'),
  summary: z.string().describe('A concise 2-sentence summary of the source material.'),
  angle: z.string().describe('A short description of the strongest emotional or narrative angle to follow.'),
});

export interface AnalyzeSourceMaterialParams {
  newsUrl?: string;
  prompt?: string;
  sourceMode?: FullSongsSourceMode;
  provider?: TextProvider;
}

export interface SourceAnalysisResult {
  title: string;
  storyBrief: FullSongsBrief;
}

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
});

const FALLBACK_PROVIDER_ORDER: TextProvider[] = ['deepseek', 'openrouter', 'google'];

function providerHasApiKey(provider: TextProvider) {
  switch (provider) {
    case 'openrouter':
      return !!process.env.OPENROUTER_API_KEY;
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'deepseek':
      return !!process.env.DEEPSEEK_API_KEY;
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    default:
      return false;
  }
}

function getProviderFallbackOrder(preferred?: TextProvider) {
  const ordered = [preferred, ...FALLBACK_PROVIDER_ORDER].filter(Boolean) as TextProvider[];
  return Array.from(new Set(ordered)).filter(providerHasApiKey);
}

function shouldFallbackToNextProvider(error: unknown) {
  const candidate = error as {
    statusCode?: number;
    message?: string;
    cause?: { statusCode?: number; message?: string };
    responseBody?: string;
  };

  const statusCode = candidate?.statusCode || candidate?.cause?.statusCode;
  const message = `${candidate?.message || ''} ${candidate?.cause?.message || ''} ${candidate?.responseBody || ''}`.toLowerCase();

  if (statusCode === 401 || statusCode === 402 || statusCode === 403 || statusCode === 429) {
    return true;
  }

  return (
    message.includes('incorrect api key') ||
    message.includes('invalid_api_key') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('insufficient_quota') ||
    message.includes('authentication') ||
    message.includes('unauthorized')
  );
}

async function generateObjectWithProviderFallback<T>({
  provider,
  execute,
}: {
  provider?: TextProvider;
  execute: (activeProvider: TextProvider) => Promise<T>;
}) {
  const providerOrder = getProviderFallbackOrder(provider);
  let lastError: unknown;

  if (providerOrder.length === 0) {
    throw new Error('No configured text model provider is available');
  }

  for (const activeProvider of providerOrder) {
    try {
      return await execute(activeProvider);
    } catch (error) {
      lastError = error;
      if (!shouldFallbackToNextProvider(error)) {
        throw error;
      }
      console.warn(`[source-analysis] Provider ${activeProvider} failed, trying next fallback provider.`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All source analysis providers failed');
}

const getModel = (provider: TextProvider = 'openrouter') => {
  switch (provider) {
    case 'openrouter':
      return openrouter(ANALYZER_OPENROUTER_MODEL);
    case 'google':
      return google('gemini-3.1-flash-lite');
    case 'deepseek':
      return deepseek(ANALYZER_MODEL);
    default:
      return openai(ANALYZER_MODEL);
  }
};

function getModeHint(sourceMode?: FullSongsSourceMode) {
  return sourceMode === 'mixed'
    ? 'The user supplied both a link and freeform story context. Blend them into one coherent source of truth.'
    : sourceMode === 'link'
      ? 'Treat the source primarily as link-driven reporting or referenced material.'
      : sourceMode === 'topic'
        ? 'Treat the source as a compact topic or prompt and expand it with strong creative framing.'
        : 'Treat the source as story-driven freeform text and preserve its narrative arc.';
}

export function buildSourceMaterialPrompt({ newsUrl, prompt }: { newsUrl?: string; prompt?: string }) {
  const parts: string[] = [];

  if (newsUrl) {
    parts.push(`Source URL: ${newsUrl}`);
  }

  if (prompt) {
    parts.push(`User Context:\n${prompt}`);
  }

  return parts.join('\n\n') || 'No usable source content was provided.';
}

export async function analyzeSourceMaterial({
  newsUrl,
  prompt,
  sourceMode,
  provider,
}: AnalyzeSourceMaterialParams): Promise<SourceAnalysisResult> {
  const sourceContent = buildSourceMaterialPrompt({ newsUrl, prompt });
  const modeHint = getModeHint(sourceMode);

  const analysisSystemPrompt = `You are a source analyst for an AI content studio.

Your job is to understand messy user input first, before anyone writes lyrics or scripts.
${modeHint}

Requirements:
- Extract the central event, conflict, or emotional thread.
- Ignore junk formatting, duplicated snippets, and noisy pasted content.
- Produce a short, vivid summary that can guide content generation.
- Produce one strong creative angle that tells downstream generators how to frame the story.
- Reject the input if it is meaningless, too thin, or not usable.

Safety:
- Avoid unsafe amplification of hateful or explicitly violent content.
`;

  const { object } = await generateObjectWithProviderFallback({
    provider,
    execute: async (activeProvider) =>
      generateObject({
        model: getModel(activeProvider),
        schema: sourceAnalysisSchema,
        system: analysisSystemPrompt,
        prompt: sourceContent,
        temperature: 0.4,
        maxOutputTokens: 300,
      }),
  });

  if (!object.isValid) {
    throw new Error(object.validationError || 'Invalid input content');
  }

  return {
    title: object.title,
    storyBrief: {
      summary: object.summary,
      angle: object.angle,
    },
  };
}
