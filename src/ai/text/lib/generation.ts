/**
 * @file generation.ts
 * @description 统一的文本 AI 生成库，支持 OpenAI, Gemini, DeepSeek 和 OpenRouter。
 */

import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

import { ANALYZER_MODEL, TEXT_MODEL } from '@/ai/config/models';
import type { FullSongsBrief, FullSongsSourceMode } from '@/features/full-songs/types/full-songs';
import { analyzeSourceMaterial, buildSourceMaterialPrompt } from './source-analysis';
import type { TextProvider } from './provider-config';
export type { TextProvider };

/**
 * 歌词生成的响应结构化架构 (Zod Schema)
 * 强制 AI 返回符合此格式的 JSON，包含标题、歌词和摘要
 */
export const lyricsSchema = z.object({
  title: z.string().describe('A catchy, short title for the song (max 50 chars).'),
  summary: z.string().describe('A very short, punchy, 2-sentence summary of the source story (max 100 chars).'),
  angle: z.string().describe('A short creative angle describing the emotional or narrative framing.'),
  lyrics: z
    .string()
    .describe(
      'The generated song lyrics. Must include [Intro], [Verse], [Chorus], [Bridge], [Outro] tags. Total length ~50 seconds.'
    ),
});

const lyricsDraftSchema = z.object({
  lyrics: z
    .string()
    .describe('The generated song lyrics. Must include [Intro], [Verse], [Chorus], [Bridge], [Outro] tags.'),
});

/**
 * 歌词重写的响应结构化架构
 */
export const rewriteLyricsSchema = z.object({
  rewrittenText: z.string().describe('The rewritten version of the selected lyrics.'),
});

// --- Provider Configuration ---

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

const FALLBACK_PROVIDER_ORDER: TextProvider[] = ['openrouter', 'google', 'deepseek', 'openai'];

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
  const attemptedProviders: string[] = [];
  let lastError: unknown;

  if (providerOrder.length === 0) {
    throw new Error('No configured text model provider is available');
  }

  for (const activeProvider of providerOrder) {
    attemptedProviders.push(activeProvider);
    try {
      return await execute(activeProvider);
    } catch (error) {
      lastError = error;
      if (!shouldFallbackToNextProvider(error)) {
        throw error;
      }
      console.warn(`[text-generation] Provider ${activeProvider} failed, trying next fallback provider.`, error);
    }
  }

  const finalMessage =
    lastError instanceof Error ? lastError.message : `All providers failed: ${attemptedProviders.join(', ')}`;
  throw new Error(finalMessage);
}

// --- Helper Functions ---

const getModel = (provider: TextProvider = 'openrouter') => {
  switch (provider) {
    case 'openrouter':
      return openrouter(TEXT_MODEL);
    case 'google':
      return google(TEXT_MODEL);
    case 'deepseek':
      return deepseek('deepseek-chat');
    default:
      return openai(ANALYZER_MODEL);
  }
};

interface GenerateLyricsParams {
  newsUrl?: string;
  prompt?: string;
  directionPrompt?: string;
  lyricsWritingPrompt?: string;
  sourceMode?: FullSongsSourceMode;
  title?: string;
  storyBrief?: FullSongsBrief;
  provider?: TextProvider;
}

/**
 * 核心功能：生成歌词
 * 根据新闻链接或用户提示词生成歌词
 */
export async function generateLyrics({ newsUrl, prompt, provider }: GenerateLyricsParams) {
  const {
    directionPrompt,
    lyricsWritingPrompt,
    sourceMode,
    title,
    storyBrief,
  } = arguments[0] as GenerateLyricsParams;
  const modeHint =
    sourceMode === 'mixed'
      ? 'The user supplied both a link and freeform story context. Blend them into one coherent source of truth.'
      : sourceMode === 'link'
        ? 'Treat the source primarily as link-driven reporting or referenced material.'
        : sourceMode === 'topic'
          ? 'Treat the source as a compact topic or prompt and expand it with strong creative framing.'
          : 'Treat the source as story-driven freeform text and preserve its narrative arc.';
  const sourceContent = buildSourceMaterialPrompt({ newsUrl, prompt });
  const analysis =
    title && storyBrief
      ? { title, storyBrief }
      : await analyzeSourceMaterial({ newsUrl, prompt, sourceMode, provider });

  const systemPrompt = `You are a world-class songwriter and lyrical storyteller. Turn the prepared story brief into lyrics that feel emotionally true, musically performable, and artistically memorable.

Core Creative Standard:
- Tone Direction: ${directionPrompt || prompt ? 'Follow the supplied music direction closely.' : 'Default to contemporary, witty, emotionally vivid writing.'}
- Source Handling: ${modeHint}
- Write from the brief, not as a reporter. Transform facts into scenes, tension, imagery, symbols, and emotional movement.
- The song must feel written by a human songwriter, not assembled from generic mood words.

Writing Priorities:
- Literary quality: vivid images, sharp phrasing, metaphor, contrast, and texture.
- Emotional quality: clear feeling, believable stakes, and movement from setup to release.
- Musical quality: natural rhythm, singable lines, memorable hook language, and strong internal cadence.
- Narrative quality: each section should advance the emotional story, not restate the same point.

Chorus Rules:
- The chorus must be the clearest emotional payoff.
- Make it sticky, easy to remember, and strong enough to survive outside the full-length song.
- Favor a few memorable words or images over dense exposition.

Verse Rules:
- Verses should carry scene details, turns, and perspective.
- Use concrete images and actions rather than abstract summary.
- Keep line lengths varied and musical.

Anti-Cliche Rules:
- Do not open with "Yeah", "Yo", "Listen", "Uh", "Let's go", or filler ad-libs.
- Do not write meta lines like "this is a story about" or "let me tell you".
- Avoid slogan-like repetition, generic heartbreak filler, or article-style narration.
- Avoid sounding like a news recap, social post, or AI explanation.

Structure Rules:
- Mandatory tags: [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro].
- Keep sections concise, but the song must still feel complete.
- [Bridge] should introduce a turn, lift, rupture, or emotional reframing.
- Strict duration target: 50-60 seconds. Keep verses compact and hooks efficient.

Formatting Rules:
- Use section tags on separate lines.
- Break lines only at natural lyrical pauses.
- Keep the output clean, with no commentary before or after the lyrics.

  Safety:
  - Avoid hate speech, explicit violence, or illegal content.
  - Handle sensitive material with artistic restraint.`;

  const defaultLyricsPrompt = `Source Summary:
${analysis.storyBrief.summary}

Creative Angle:
${analysis.storyBrief.angle}

Working Title:
${analysis.title}

Original Source:
${sourceContent}

Execution Notes:
- Respect the music direction and narrative angle.
- Aim for literary imagery, emotional tension, and a chorus that lands immediately.
- Do not merely summarize the source. Convert it into a vivid, singable scene.`;

  const { object: lyricsDraft } = await generateObjectWithProviderFallback({
    provider,
    execute: async (activeProvider) =>
      generateObject({
        model: getModel(activeProvider),
        schema: lyricsDraftSchema,
        system: systemPrompt,
        prompt: lyricsWritingPrompt || defaultLyricsPrompt,
        temperature: 0.8,
      }),
  });

  return {
    title: analysis.title,
    summary: analysis.storyBrief.summary,
    angle: analysis.storyBrief.angle,
    lyrics: lyricsDraft.lyrics,
  };
}

interface RewriteLyricsParams {
  selectedText: string;
  context?: string;
  style?: string;
  provider?: TextProvider;
}

/**
 * 核心功能：重写歌词
 */
export async function rewriteLyrics({ selectedText, context, style, provider }: RewriteLyricsParams) {
  const systemPrompt = `You are a lyrics editor. Rewrite the selected lyrics to improve flow, rhyme, or match a specific style.

  Target Style: ${style || 'Better flow and catchiness'}
  Context: ${context || 'N/A'}

  Output only the rewritten text, maintaining the same length/structure roughly.
  `;

  const { object } = await generateObjectWithProviderFallback({
    provider,
    execute: async (activeProvider) =>
      generateObject({
        model: getModel(activeProvider),
        schema: rewriteLyricsSchema,
        system: systemPrompt,
        prompt: `Original Text: "${selectedText}"`,
        temperature: 0.7,
      }),
  });

  return object.rewrittenText;
}

/**
 * 音乐提示词增强架构
 */
export const musicPromptSchema = z.object({
  stylePrompt: z
    .string()
    .describe(
      'The optimized, comma-separated list of musical style descriptors (e.g. "Genre, Vibe, Instruments, Tempo, Vocal Style"). Max 500 chars.'
    ),
});

interface EnhanceMusicPromptParams {
  tags: string;
  lyrics: string;
  provider?: TextProvider;
}

/**
 * 核心功能：增强音乐提示词
 * 利用 AI 将简单的标签 + 歌词转化为 MiniMax 更喜欢的高保真提示词
 */
export async function enhanceMusicPrompt({ tags, lyrics, provider }: EnhanceMusicPromptParams) {
  const systemPrompt = `You are a specialized prompt engineer for MiniMax music generation.
Transform a high-level music direction plus lyrics into one compact production instruction prompt.

Output Objective:
- Describe how the song should be produced, not what story happened.
- Prioritize genre, mood, tempo feel, vocal identity, instrumentation, arrangement arc, and mix character.
- Keep the result concrete, model-friendly, and commercially usable.

Required Components:
- genre or subgenre
- emotional tone
- tempo or BPM feel
- vocal style
- core instruments or groove
- arrangement arc based on lyric sections
- mix or sonic finish
- short-form duration cue for a 50-60 second radio edit

Style Rules:
- Return a single comma-separated line only.
- Max 350 characters.
- Use production language, not literary language.
- Prefer specifics over vague adjectives.
- If the lyrics suggest an emotional shift, reflect it as an arrangement shift.
- Keep the chorus payoff obvious in the arrangement description.
- Do not explain your reasoning.

Good pattern:
"alt-pop, melancholic but urgent, 92 BPM, intimate female vocal, pulsing synth bass, tight drums, airy piano textures, Verse restrained -> Chorus soaring -> Bridge stripped, wide stereo, polished radio edit"

Input Direction: ${tags}
Input Lyrics (Excerpt): ${lyrics.slice(0, 500)}...`;

  const { object } = await generateObjectWithProviderFallback({
    provider,
    execute: async (activeProvider) =>
      generateObject({
        model: getModel(activeProvider),
        schema: musicPromptSchema,
        system: systemPrompt,
        prompt: 'Generate one optimized production prompt.',
        temperature: 0.7,
      }),
  });

  return object.stylePrompt;
}
