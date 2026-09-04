import { OPENROUTER_TEXT_MODEL } from '@/ai/config/models';
import { editorialSafetyError } from '@/ai/text/lib/editorial-safety';
import { type LyricsCheckpointStage, generateLyrics } from '@/ai/text/lib/generation';
import { getRateLimiter } from '@/lib/ratelimit';
import { getSession } from '@/lib/server';
import {
  completeLyricsWorkflow,
  failWorkflowStep,
  getWorkflowRun,
  recordLyricsCheckpoint,
  startLyricsWorkflow,
} from '@/lib/song-creation-workflow';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const textProviderSchema = z.enum(['openai', 'google', 'anthropic', 'deepseek', 'openrouter']);

const PROVIDER_CONFIGURATION_ERROR =
  'The AI writing service is temporarily unavailable. Please check the configured provider credentials and try again.';

function toPublicGenerationError(error: unknown) {
  const candidate = error as { name?: string; statusCode?: number; message?: string };
  const diagnostic = candidate.message?.toLowerCase() || '';
  const isProviderAuthenticationError = [
    'incorrect api key',
    'invalid_api_key',
    'authentication',
    'unauthorized',
    'api key',
  ].some((fragment) => diagnostic.includes(fragment));

  if (isProviderAuthenticationError) {
    return {
      status: 503,
      category: 'SYSTEM' as const,
      message: PROVIDER_CONFIGURATION_ERROR,
    };
  }

  const isRetryableProviderFailure =
    candidate.name === 'AI_RetryError' ||
    ['failed after', 'provider returned error', 'no object generated', 'could not parse'].some((fragment) =>
      diagnostic.includes(fragment)
    );

  if (isRetryableProviderFailure) {
    return {
      status: 503,
      category: 'SYSTEM' as const,
      message:
        'The AI writing provider could not complete this step. Your saved workflow can be resumed; please try again.',
    };
  }

  const status =
    candidate.statusCode && candidate.statusCode >= 400 && candidate.statusCode <= 599 ? candidate.statusCode : 500;

  return {
    status,
    category: status < 500 ? ('INPUT' as const) : ('SYSTEM' as const),
    message: candidate.message || 'Failed to generate lyrics',
  };
}
const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim().length === 0 ? undefined : value;
const optionalText = (maxLength: number) =>
  z.preprocess(emptyStringToUndefined, z.string().trim().min(1).max(maxLength).optional());

const lyricsRequestSchema = z
  .object({
    workflowRunId: z.string().uuid().optional(),
    newsUrl: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .max(2048)
        .refine((value) => {
          try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        }, 'newsUrl must be a valid HTTP or HTTPS URL')
        .optional()
    ),
    prompt: optionalText(20_000),
    sourceMode: z.enum(['link', 'topic', 'story', 'mixed']).optional(),
    title: optionalText(200),
    storyBrief: z
      .object({
        summary: z.string().trim().min(1).max(5_000),
        angle: z.string().trim().min(1).max(2_000),
      })
      .optional(),
    directionPrompt: optionalText(2_000),
    // 兼容现有前端字段；服务端统一映射为 directionPrompt。
    style: optionalText(2_000),
    lyricsWritingPrompt: optionalText(12_000),
    productionVariantId: optionalText(120),
    modelProvider: textProviderSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.newsUrl && !value.prompt) {
      ctx.addIssue({
        code: 'custom',
        message: 'Either newsUrl or prompt is required',
        path: ['prompt'],
      });
    }
  });

function validationError(issues: z.ZodIssue[]) {
  return NextResponse.json(
    {
      success: false,
      category: 'INPUT',
      error: 'Invalid lyrics generation request',
      code: 400,
      details: issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    },
    { status: 400 }
  );
}

/**
 * 根据新闻链接或管理员输入生成歌词。
 */
export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { success: withinLimit } = await getRateLimiter().limit(session.user.id);
  if (!withinLimit) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again in a minute.', code: 429 },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return validationError([{ code: 'custom', message: 'Request body must be valid JSON', path: [] }]);
  }

  const parsedBody = lyricsRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return validationError(parsedBody.error.issues);
  }

  const {
    workflowRunId,
    newsUrl,
    prompt,
    sourceMode,
    title,
    storyBrief,
    directionPrompt,
    style,
    lyricsWritingPrompt,
    productionVariantId,
    modelProvider,
  } = parsedBody.data;

  let workflow: { runId: string; stepId: string } | undefined;
  try {
    const requestedProvider = modelProvider || 'openrouter';
    const existingRun = workflowRunId ? await getWorkflowRun(workflowRunId, session.user.id) : undefined;
    const resumableStages = new Set<LyricsCheckpointStage>([
      'analyzing_source',
      'planning_lyrics',
      'drafting_lyrics',
      'editing_lyrics',
      'verifying_lyrics',
    ]);
    const resumeCheckpoints = Object.fromEntries(
      (existingRun?.steps || [])
        .filter((step) => step.status === 'completed' && resumableStages.has(step.stage as LyricsCheckpointStage))
        .map((step) => [step.stage, step.outputMetadata])
    ) as Partial<Record<LyricsCheckpointStage, unknown>>;
    workflow = await startLyricsWorkflow({
      runId: workflowRunId,
      userId: session.user.id,
      sourceMode,
      sourceUrl: newsUrl,
      sourceText: prompt,
      directionPrompt: directionPrompt ?? style,
      productionVariantId,
      provider: requestedProvider,
      model: requestedProvider === 'openrouter' ? OPENROUTER_TEXT_MODEL : undefined,
    });

    const lyricsData = await generateLyrics({
      newsUrl,
      prompt,
      sourceMode,
      title,
      storyBrief,
      directionPrompt: directionPrompt ?? style,
      lyricsWritingPrompt,
      productionVariantId,
      provider: modelProvider,
      resumeCheckpoints,
      onCheckpoint: (stage, metadata) =>
        recordLyricsCheckpoint(workflow?.runId || workflowRunId || '', stage, metadata, {
          provider: requestedProvider,
          model: requestedProvider === 'openrouter' ? OPENROUTER_TEXT_MODEL : undefined,
        }),
    });

    const sourceSnapshot = lyricsData.source;
    const safety = lyricsData.workshop?.safety;
    if (safety && safety.decision !== 'allow') {
      throw editorialSafetyError(safety);
    }

    await completeLyricsWorkflow(workflow.runId, workflow.stepId, {
      title: lyricsData.title,
      summary: lyricsData.summary,
      lyrics: lyricsData.lyrics,
      lyricWorkshop: lyricsData.workshop,
      sourceText: sourceSnapshot?.text || prompt,
      sourceUrl: sourceSnapshot?.url || newsUrl,
      requiresReview: false,
    });

    return NextResponse.json({
      success: true,
      workflowRunId: workflow.runId,
      workflowStage: 'lyrics_ready',
      ...lyricsData,
    });
  } catch (error) {
    if (workflow) {
      await failWorkflowStep(workflow.runId, workflow.stepId, error).catch((persistenceError) => {
        console.error('[lyrics-generation] unable to persist workflow failure', persistenceError);
      });
    }
    const publicError = toPublicGenerationError(error);
    const candidate = error as { name?: string; statusCode?: number };
    console.error('[lyrics-generation] failed', {
      name: candidate.name || 'Error',
      statusCode: candidate.statusCode || publicError.status,
      category: publicError.category,
    });

    return NextResponse.json(
      {
        success: false,
        category: publicError.category,
        error: publicError.message,
        code: publicError.status,
      },
      { status: publicError.status }
    );
  }
}
