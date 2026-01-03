/**
 * @file generation.ts
 * @description 统一的文本 AI 生成库，支持 OpenAI, Gemini, DeepSeek 和 OpenRouter。
 *
 * 本模块封装了常用的歌词生成和重写功能，利用 Vercel AI SDK (AI Core) 实现结构化输出。
 */

import { webContentAnalyzerConfig } from '@/ai/text/utils/web-content-analyzer-config';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

// 支持的 AI 供应商类型
import type { TextProvider } from './provider-config';
export type { TextProvider };

/**
 * 歌词生成的响应结构化架构 (Zod Schema)
 * 强制 AI 返回符合此格式的 JSON，包含标题、歌词和摘要
 */
export const lyricsSchema = z.object({
  isValid: z
    .boolean()
    .describe(
      'Set to false if the input content is invalid, meaningless, broken URL, or insufficient to generate a song.'
    ),
  validationError: z
    .string()
    .nullable()
    .describe(
      'A helpful error message explaining why the input was rejected (e.g. "The provided URL is not accessible or content is too short"). Required if isValid is false.'
    ),
  title: z.string().describe('A catchy, short title for the song (max 50 chars).'),
  summary: z
    .string()
    .describe(
      'A very short, punchy, 2-sentences summary of the news story (max 100 chars). Like a "breaking news" ticker.'
    ),
  lyrics: z
    .string()
    .describe(
      'The generated song lyrics. Must include [Verse], [Chorus], [Bridge], [Outro] tags. Total length ~50 seconds.'
    ),
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

// --- Helper Functions ---

const getModel = (provider: TextProvider = 'openrouter') => {
  switch (provider) {
    case 'openrouter':
      return openrouter('google/gemini-3-flash-preview');
    case 'google':
      return google('google/gemini-3-flash-preview');
    case 'deepseek':
      return deepseek('deepseek-chat');
    default:
      return openai('gpt-4o-mini');
  }
};

interface GenerateLyricsParams {
  newsUrl?: string;
  prompt?: string;
  provider?: TextProvider;
}

/**
 * 核心功能：生成歌词
 * 根据新闻链接或用户提示词生成歌词
 */
export async function generateLyrics({ newsUrl, prompt, provider }: GenerateLyricsParams) {
  const model = getModel(provider);

  // 构造系统提示词
  const systemPrompt = `You are a world-class songwriter and lyrical storyteller. Your goal is to transform news stories or user-provided topics into catchy, meaningful, and narratively rich song lyrics.

  Guidelines (Liberated Creativity):
  - **Tone**: ${prompt ? 'Strictly follow the user prompt tone' : 'Humorous, witty, and culturally spicy'}.
  - **The Golden Rule**: **DO NOT BE BORING.** Mediocrity is failure.
    - Avoid plain storytelling. Don't just narrate facts—perform them.

  - **The 3 Rhetorical Toolkits (Use Mix & Match)**:
    1.  **Sonic Engineering (For Flow & Rhythm)**:
        - *Best for Verses & Raps.*
        - **Multi-syllabic Rhymes**: Don't just rhyme one syllable (Cat/Bat). Rhyme the whole vowel structure (e.g., "In-for-ma-tion" / "Sip-ping po-tions").
        - **Internal Rhymes**: Hide rhymes in the middle of lines (e.g., "I'm on the **block**, tick-**tock**, non-**stop**").
        - **Chopping**: Use short, staccato words to create a machine-gun rhythm.
        - **Assonance**: Focus on matching vowel sounds (e.g., "Low", "Slow", "Ghost", "Whole").

    2.  **Punchline Factory (For Wit & Impact)**:
        - *Best for Disses & Verse Endings.*
        - **Setup & Payoff**: Use 2-3 lines to set up a normal context, then use the last line to twist it into an insult or joke.
        - **Double Entendre**: Words with two meanings (e.g., "You're a star" -> "Space debris").
        - **Savage Similes**: "You're useful as a screen door on a submarine."
        - **Hyperbole**: Scale everything up to 1000% for comedic effect.

    3.  **Earworm Loop (For Hooks & Choruses)**:
        - *Best for making it sticky.*
        - **Repetition**: Repeat the main keyword 3x (e.g., "Gucci Gang, Gucci Gang, Gucci Gang").
        - **Call & Response**: Line 1: Question. Line 2: Answer.
        - **Simple Vocabulary**: Use simple, open-vowel words that are easy to sing along to.
        - **Phonetic Catchiness**: Use clicking sounds (K, T, P) or buzzing sounds (Z, V) for rhythmic hooks.

  - **Stylistic Adaptation**:
    - For high-energy styles (e.g., Rap): Use dense flows, triplets, and slang.
    - For melodic styles: Use poetic imagery and emotional metaphors.
    - For punchy styles: Use short, aggressive statements.
  - **Structure (Full Narrative Arc)**:
    - Use as many lines as needed to tell a compelling story.
    - Mandatory Segments: [Verse], [Chorus], [Bridge], [Outro]. Keep them tight.
    - [Bridge] is critical for a "switch up" or "drop".
  - **Length Constraint**: **STRICTLY target 50-60 seconds.**
    - Do NOT write a 3-minute song.
    - Keep verses punchy and concise (4-6 lines max).
    - Speed is key for viral content.
  - **Formatting Rules**:
    - **Logical Breaks**: Only break lines at natural pauses (commas, end of thoughts).
    - **Visual Variety**: Let lines have different lengths. Uniformity is the enemy of great music.
    - **Clear Stanzas**: Keep sections clearly separated by tags.
  - **Tags**: Use [Verse 1], [Chorus], [Bridge], etc.
  - **Title**: A professional, clickbait-worthy title that summarizes the "hook."

  Safety:
  - Avoid hate speech, explicit violence, or illegal content.
  - If the content is sensitive, handle it with artistic care or reject it if it violates core safety policies.
  `;

  let userContent = '';
  if (newsUrl) {
    userContent = `Base the song on this news URL: ${newsUrl}. Extract the key story and vibe.`;
    // Note: In a real app, we would fetch the URL content here or passing it in.
    // For now assuming the model can access it or we rely on the prompt context if URL fetching isn't implemented here.
    // Ideally we should use a web scraper tool here if available.
  } else if (prompt) {
    userContent = `Topic/Prompt: ${prompt}`;
  }

  const { object } = await generateObject({
    model,
    schema: lyricsSchema,
    system: systemPrompt,
    prompt: userContent,
    temperature: 0.8,
  });

  if (!object.isValid) {
    throw new Error(object.validationError || 'Invalid input content');
  }

  return object; // { title, summary, lyrics }
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
  const model = getModel(provider);

  const systemPrompt = `You are a lyrics editor. Rewrite the selected lyrics to improve flow, rhyme, or match a specific style.

  Target Style: ${style || 'Better flow and catchiness'}
  Context: ${context || 'N/A'}

  Output only the rewritten text, maintaining the same length/structure roughly.
  `;

  const { object } = await generateObject({
    model,
    schema: rewriteLyricsSchema,
    system: systemPrompt,
    prompt: `Original Text: "${selectedText}"`,
    temperature: 0.7,
  });

  return object.rewrittenText;
}
