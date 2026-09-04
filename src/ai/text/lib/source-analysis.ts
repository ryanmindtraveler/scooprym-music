import type { FullSongsBrief, FullSongsSourceMode } from '@/features/full-songs/types/full-songs';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

import { ANALYZER_MODEL, ANALYZER_OPENROUTER_MODEL, OPENAI_TEXT_MODEL } from '@/ai/config/models';
import type { TextProvider } from './provider-config';
import { getStructuredOutputSettings, runWithTextProviderFallback } from './provider-fallback';
import { assertReaderSafeHttpUrl, extractUrlContent } from './url-content-extractor';

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
  preparedSource?: NormalizedSourceSnapshot;
}

export interface SourceAnalysisResult {
  title: string;
  storyBrief: FullSongsBrief;
  source: NormalizedSourceSnapshot;
}

export interface NormalizedSourceSnapshot {
  url?: string;
  title?: string;
  text: string;
  fetchedAt?: string;
}

export class SourceMaterialError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 422) {
    super(message);
    this.name = 'SourceMaterialError';
    this.statusCode = statusCode;
  }
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

const getModel = (provider: TextProvider = 'openrouter', openrouterModel = ANALYZER_OPENROUTER_MODEL) => {
  switch (provider) {
    case 'openrouter':
      return openrouter(openrouterModel);
    case 'google':
      return google('gemini-3.1-flash-lite');
    case 'deepseek':
      return deepseek(ANALYZER_MODEL);
    case 'openai':
      return openai(OPENAI_TEXT_MODEL);
    default:
      return openai(OPENAI_TEXT_MODEL);
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

export async function prepareSourceMaterial({
  newsUrl,
  prompt,
}: {
  newsUrl?: string;
  prompt?: string;
}): Promise<NormalizedSourceSnapshot> {
  const userContext = prompt?.trim();

  if (newsUrl) {
    let normalizedUrl: string;
    try {
      normalizedUrl = await assertReaderSafeHttpUrl(newsUrl);
    } catch (error) {
      throw new SourceMaterialError(error instanceof Error ? error.message : 'Source URL is not allowed', 400);
    }

    const extracted = await extractUrlContent(normalizedUrl);
    if (!extracted.success || !extracted.content) {
      throw new SourceMaterialError(
        extracted.error || 'The source page could not be extracted. Add a readable public source and try again.'
      );
    }

    return {
      url: normalizedUrl,
      title: extracted.title?.trim() || undefined,
      text: extracted.content,
      fetchedAt: new Date().toISOString(),
    };
  }

  if (!userContext) {
    throw new SourceMaterialError('No usable source content was provided', 400);
  }

  return { text: userContext };
}

export function buildSourceMaterialPrompt({
  source,
  prompt,
}: {
  source: NormalizedSourceSnapshot;
  prompt?: string;
}) {
  const parts: string[] = [];

  if (source.url) {
    parts.push(
      [
        `Source URL: ${source.url}`,
        source.title ? `Source Title: ${source.title}` : undefined,
        source.fetchedAt ? `Source Fetched At: ${source.fetchedAt}` : undefined,
        `Extracted Source Text:\n${source.text}`,
      ]
        .filter(Boolean)
        .join('\n')
    );
  } else {
    parts.push(`User Source Text:\n${source.text}`);
  }

  if (prompt?.trim() && prompt.trim() !== source.text) {
    parts.push(`User Context:\n${prompt}`);
  }

  return parts.join('\n\n');
}

export async function analyzeSourceMaterial({
  newsUrl,
  prompt,
  sourceMode,
  provider,
  preparedSource,
}: AnalyzeSourceMaterialParams): Promise<SourceAnalysisResult> {
  const source = preparedSource || (await prepareSourceMaterial({ newsUrl, prompt }));
  const sourceContent = buildSourceMaterialPrompt({ source, prompt });
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

  const { object } = await runWithTextProviderFallback({
    provider,
    scope: 'source-analysis',
    execute: async (activeProvider, activeModel, abortSignal) =>
      generateObject({
        abortSignal,
        model: getModel(activeProvider, activeModel),
        schema: sourceAnalysisSchema,
        system: analysisSystemPrompt,
        prompt: sourceContent,
        ...getStructuredOutputSettings(activeProvider, 0.4),
        maxOutputTokens: 600,
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
    source,
  };
}
