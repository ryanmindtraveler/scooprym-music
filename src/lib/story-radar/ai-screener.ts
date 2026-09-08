import { OPENAI_TEXT_MODEL, OPENROUTER_TEXT_MODEL, TEXT_MODEL, type TextProvider } from '@/ai/config/models';
import { getStructuredOutputSettings, runWithTextProviderFallback } from '@/ai/text/lib/provider-fallback';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

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

function getScreenerModel(provider: TextProvider = 'openrouter', openrouterModel = OPENROUTER_TEXT_MODEL) {
  switch (provider) {
    case 'openrouter':
      return openrouter(openrouterModel);
    case 'google':
      return google('gemini-3-flash');
    case 'deepseek':
      return deepseek(TEXT_MODEL);
    case 'openai':
      return openai(OPENAI_TEXT_MODEL);
    default:
      return openrouter(openrouterModel);
  }
}

/**
 * 结构化 AI 新闻主题判定 Schema
 */
export const storyScreenResultSchema = z.object({
  id: z.string().describe('候选新闻的 ID'),
  relevanceScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      '匹配分数：0-100。80-100=绝佳神曲题材，50-79=普通娱乐八卦，20-49=偏弱平淡，0-19=严重不符/沉重悲剧/枯燥财报'
    ),
  category: z
    .enum(['celebrity_drama', 'internet_chaos', 'absurd_headlines'])
    .describe(
      '所属分类：celebrity_drama(名人八卦/爱恨情仇), internet_chaos(网络迷因/搞笑热梗), absurd_headlines(荒诞奇闻/沙雕事件)'
    ),
  fitReason: z
    .string()
    .max(300)
    .describe('简短英文判定理由，供英文页面显示，例如 Funny celebrity mishap 或 Serious tragedy, not suitable'),
  action: z
    .enum(['keep', 'shortlist', 'dismiss'])
    .describe(
      '推荐操作：shortlist(强烈推荐精选，≥80分), keep(保留待选，50-79分), dismiss(建议忽略/过滤，<50分或不符主题)'
    ),
});

export const batchStoryScreenSchema = z.object({
  evaluations: z.array(storyScreenResultSchema),
});

export type StoryScreenResult = z.infer<typeof storyScreenResultSchema>;
export interface ScreeningBatchResult {
  evaluations: StoryScreenResult[];
  failures: Array<{ id: string; error: string }>;
}

/** 只接受本批次唯一且完整的 ID，模型输出不能获得修改其他新闻的权限。 */
export function validateScreeningResults(ids: string[], values: unknown): StoryScreenResult[] {
  const parsed = batchStoryScreenSchema.parse({ evaluations: values }).evaluations;
  const allowed = new Set(ids);
  const returned = new Set(parsed.map((item) => item.id));
  if (parsed.length !== ids.length || returned.size !== ids.length || parsed.some((item) => !allowed.has(item.id))) {
    throw new Error('AI returned missing, duplicate or unexpected candidate IDs');
  }
  return parsed;
}

const AI_SCREENER_SYSTEM_PROMPT = `You are the Lead Editorial AI for ScoopRYM — an AI music SaaS platform that transforms trending news gossip, internet memes, celebrity drama, and absurd real-world events into viral, catchy, addictive hit songs (AI神曲).

Your mission is to evaluate whether raw news candidates fit ScoopRYM's meme-song editorial theme and assign a relevance score (0-100) and suggested action.

### Editorial Guidelines:
1. Highly Relevant / High Score (80 - 100) -> action: "shortlist" or "keep":
   - Celebrity gossip, feuds, relationship drama, public persona blunders, funny red-carpet moments.
   - Absurd real-world news, ridiculous lawsuits, bizarre crimes/accidents with comic undertones.
   - Internet viral memes, influencer beef, cringe/funny TikTok/Reddit trends, hilarious social media chaos.

2. Moderate Fit (50 - 79) -> action: "keep":
   - Mild entertainment news, pop culture releases, standard celebrity interviews with modest meme potential.

3. Weak Fit (20 - 49) -> action: "dismiss":
   - Generic lifestyle news, routine sports recaps, bland product reviews lacking punchlines or drama.

4. Strictly Irrelevant / Noise (0 - 19) -> action: "dismiss":
   - Obituaries, deaths, mourning, tragic accidents, serious medical grief.
   - Dry corporate quarterly earnings, stock market analysis, shareholder meetings, B2B press releases.
   - Serious geopolitics, warfare, terrorism, heavy political policy or legislative debates.
   - Heavy crime or tragedy with victims.

Always output concise, accurate scores and punchy fit reasons.`;

/**
 * 批量调用 AI 对候选新闻进行主题契合度智能甄别与评分
 */
export async function screenStoryCandidatesWithAI(
  candidates: Array<{
    id: string;
    title: string;
    domain: string;
    category?: string;
  }>
): Promise<ScreeningBatchResult> {
  if (!candidates.length) return { evaluations: [], failures: [] };

  // 分批次调用，每批最多 15 条，确保结构化输出质量与速度
  const batchSize = 15;
  const results: StoryScreenResult[] = [];
  const failures: ScreeningBatchResult['failures'] = [];
  const budget = AbortSignal.timeout(200_000);

  for (let i = 0; i < candidates.length; i += batchSize) {
    const chunk = candidates.slice(i, i + batchSize);
    const promptContent = chunk
      .map(
        (c, idx) =>
          `[Candidate ${idx + 1}]\nID: ${c.id}\nTitle: ${c.title}\nSource Domain: ${c.domain}\nSuggested Category: ${c.category || 'celebrity_drama'}`
      )
      .join('\n\n');

    try {
      budget.throwIfAborted();
      const response = await runWithTextProviderFallback({
        scope: 'story-radar-ai-screen',
        execute: async (activeProvider, activeModel, abortSignal) => {
          budget.throwIfAborted();
          return generateObject({
            abortSignal: abortSignal ? AbortSignal.any([abortSignal, budget]) : budget,
            model: getScreenerModel(activeProvider, activeModel),
            schema: batchStoryScreenSchema,
            system: AI_SCREENER_SYSTEM_PROMPT,
            prompt: `Evaluate the following news headlines for ScoopRYM's meme-song editorial fit:\n\n${promptContent}`,
            ...getStructuredOutputSettings(activeProvider, 0.2),
          });
        },
      });

      results.push(
        ...validateScreeningResults(
          chunk.map((item) => item.id),
          response?.object?.evaluations
        )
      );
    } catch (error) {
      console.error('Failed AI screening chunk:', error);
      // 失败不伪造评分，保留数据库中的原始分类、分数与人工状态。
      for (const item of chunk) {
        failures.push({
          id: item.id,
          error: (error instanceof Error ? error.message : 'AI assessment failed').slice(0, 500),
        });
      }
    }
  }

  return { evaluations: results, failures };
}
