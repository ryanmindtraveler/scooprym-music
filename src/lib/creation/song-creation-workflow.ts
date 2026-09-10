import { createHash, randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import { songCreationRun, songCreationStep } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const SONG_CREATION_STAGES = [
  'source_ready',
  'generating_lyrics',
  'analyzing_source',
  'planning_lyrics',
  'drafting_lyrics',
  'editing_lyrics',
  'verifying_lyrics',
  'lyrics_review',
  'lyrics_ready',
  'queued_audio',
  'generating_audio',
  'uploading_audio',
  'audio_uploaded',
  'generating_cover',
  'finalizing',
  'checking_product',
  'publish_ready',
  'published',
  'completed',
  'failed',
] as const;

export type SongCreationStage = (typeof SONG_CREATION_STAGES)[number];
export type SongCreationRunStatus = 'running' | 'queued' | 'completed' | 'failed';
export type SongCreationStepStatus = 'running' | 'completed' | 'failed' | 'skipped';

export const SONG_CREATION_PHASES = [
  'source_preparation',
  'lyrics_studio',
  'music_production',
  'cover_production',
  'product_check',
  'publish_ready',
] as const;

export type SongCreationPhase = (typeof SONG_CREATION_PHASES)[number];

/** 将兼容期的细粒度步骤折叠为管理员真正关心的六个生产阶段。 */
export function getSongCreationPhase(stage: string | null | undefined): SongCreationPhase {
  if (['source_ready', 'analyzing_source', 'planning_lyrics'].includes(stage || '')) return 'source_preparation';
  if (
    [
      'generating_lyrics',
      'drafting_lyrics',
      'editing_lyrics',
      'verifying_lyrics',
      'lyrics_review',
      'lyrics_ready',
    ].includes(stage || '')
  )
    return 'lyrics_studio';
  if (['queued_audio', 'generating_audio', 'uploading_audio', 'audio_uploaded'].includes(stage || ''))
    return 'music_production';
  if (stage === 'generating_cover') return 'cover_production';
  if (['finalizing', 'checking_product'].includes(stage || '')) return 'product_check';
  return 'publish_ready';
}

type JsonMetadata = unknown;

export interface StartLyricsWorkflowInput {
  runId?: string;
  userId: string;
  sourceMode?: string;
  sourceUrl?: string;
  sourceText?: string;
  directionPrompt?: string;
  productionVariantId?: string;
  provider?: string;
  model?: string;
}

export interface LyricsWorkflowOutput {
  title?: string;
  summary?: string;
  lyrics: string;
  lyricWorkshop?: unknown;
  sourceUrl?: string;
  sourceText?: string;
  requiresReview?: boolean;
}

function trimError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown workflow error');
  return /api.?key|authentication|unauthorized/i.test(message)
    ? 'Provider authentication failed. Check the configured credentials.'
    : message.slice(0, 4000);
}

function inputHash(input: StartLyricsWorkflowInput) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        sourceMode: input.sourceMode || '',
        sourceUrl: input.sourceUrl || '',
        sourceText: input.sourceText || '',
        directionPrompt: input.directionPrompt || '',
        productionVariantId: input.productionVariantId || '',
      })
    )
    .digest('hex');
}

async function nextAttempt(runId: string, stage: SongCreationStage) {
  const db = await getDb();
  const [latest] = await db
    .select({ attempt: songCreationStep.attempt })
    .from(songCreationStep)
    .where(and(eq(songCreationStep.runId, runId), eq(songCreationStep.stage, stage)))
    .orderBy(desc(songCreationStep.attempt), desc(songCreationStep.startedAt))
    .limit(1);
  return (latest?.attempt || 0) + 1;
}

/** 在调用昂贵模型前创建运行和步骤，避免请求中断后完全失去踪迹。 */
export async function startLyricsWorkflow(input: StartLyricsWorkflowInput) {
  const db = await getDb();
  const runId = input.runId || randomUUID();
  const stepId = randomUUID();
  const [existing] = await db.select().from(songCreationRun).where(eq(songCreationRun.id, runId)).limit(1);
  if (existing && existing.userId !== input.userId) {
    throw new Error('Workflow run does not belong to the current administrator');
  }
  if (existing?.inputHash && existing.inputHash !== inputHash(input)) {
    throw new Error('Workflow input changed; start a new lyric workflow instead of reusing this run');
  }
  const attempt = existing ? await nextAttempt(runId, 'generating_lyrics') : 1;

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(songCreationRun)
        .set({ status: 'running', currentStage: 'generating_lyrics', lastError: null, updatedAt: new Date() })
        .where(eq(songCreationRun.id, runId));
    } else {
      await tx.insert(songCreationRun).values({
        id: runId,
        userId: input.userId,
        status: 'running',
        currentStage: 'generating_lyrics',
        sourceMode: input.sourceMode,
        sourceUrl: input.sourceUrl,
        sourceText: input.sourceText,
        directionPrompt: input.directionPrompt,
        productionVariantId: input.productionVariantId,
        inputHash: inputHash(input),
        lastError: null,
      });
    }
    await tx.insert(songCreationStep).values({
      id: stepId,
      runId,
      stage: 'generating_lyrics',
      status: 'running',
      attempt,
      provider: input.provider,
      model: input.model,
    });
  });

  return { runId, stepId };
}

export async function completeLyricsWorkflow(runId: string, stepId: string, output: LyricsWorkflowOutput) {
  const db = await getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(songCreationStep)
      .set({
        status: 'completed',
        completedAt: now,
        outputMetadata: {
          title: output.title || null,
          lyricsCharacters: output.lyrics.length,
          hasWorkshop: !!output.lyricWorkshop,
        },
      })
      .where(and(eq(songCreationStep.id, stepId), eq(songCreationStep.runId, runId)));
    await tx
      .update(songCreationRun)
      .set({
        status: 'running',
        currentStage: output.requiresReview ? 'lyrics_review' : 'lyrics_ready',
        title: output.title,
        summary: output.summary,
        lyrics: output.lyrics,
        lyricWorkshop: output.lyricWorkshop,
        sourceUrl: output.sourceUrl,
        sourceText: output.sourceText,
        lastError: null,
        updatedAt: now,
      })
      .where(eq(songCreationRun.id, runId));
  });
}

/** 保存歌词内部昂贵阶段的可恢复检查点，不覆盖主运行或历史步骤。 */
export async function recordLyricsCheckpoint(
  runId: string,
  stage: Extract<
    SongCreationStage,
    'analyzing_source' | 'planning_lyrics' | 'drafting_lyrics' | 'editing_lyrics' | 'verifying_lyrics'
  >,
  metadata: JsonMetadata,
  options: { provider?: string; model?: string } = {}
) {
  const db = await getDb();
  const attempt = await nextAttempt(runId, stage);
  const now = new Date();
  const executionStart = (metadata as { execution?: { startedAt?: unknown } } | null)?.execution?.startedAt;
  const startedAt =
    typeof executionStart === 'number' &&
    Number.isFinite(executionStart) &&
    executionStart > 0 &&
    executionStart <= now.getTime()
      ? new Date(executionStart)
      : now;
  await db.transaction(async (tx) => {
    await tx.insert(songCreationStep).values({
      id: randomUUID(),
      runId,
      stage,
      status: 'completed',
      attempt,
      provider: options.provider,
      model: options.model,
      outputMetadata: metadata,
      startedAt,
      completedAt: now,
    });
    await tx
      .update(songCreationRun)
      .set({ currentStage: stage, status: 'running', lastError: null, updatedAt: now })
      .where(eq(songCreationRun.id, runId));
  });
}

export async function failWorkflowStep(runId: string, stepId: string, error: unknown) {
  const db = await getDb();
  const now = new Date();
  const message = trimError(error);
  await db.transaction(async (tx) => {
    const [step] = await tx
      .select({ stage: songCreationStep.stage })
      .from(songCreationStep)
      .where(and(eq(songCreationStep.id, stepId), eq(songCreationStep.runId, runId)))
      .limit(1);
    await tx
      .update(songCreationStep)
      .set({ status: 'failed', error: message, completedAt: now })
      .where(and(eq(songCreationStep.id, stepId), eq(songCreationStep.runId, runId)));
    await tx
      .update(songCreationRun)
      // 保留真正失败的阶段，刷新后才能只重试这一段，而不是退回整条流水线。
      .set({
        status: 'failed',
        currentStage: getFailedGenerationStage(error) || step?.stage || 'failed',
        lastError: message,
        updatedAt: now,
      })
      .where(eq(songCreationRun.id, runId));
  });
}

/** 开始一个可独立重试的生产阶段，并保留之前所有尝试。 */
export async function startWorkflowStage(
  runId: string,
  stage: SongCreationStage,
  options: { provider?: string; model?: string; runStatus?: SongCreationRunStatus } = {}
) {
  const db = await getDb();
  const stepId = randomUUID();
  const attempt = await nextAttempt(runId, stage);
  await db.transaction(async (tx) => {
    await tx.insert(songCreationStep).values({
      id: stepId,
      runId,
      stage,
      status: 'running',
      attempt,
      provider: options.provider,
      model: options.model,
    });
    await tx
      .update(songCreationRun)
      .set({
        status: options.runStatus || 'running',
        currentStage: stage,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(songCreationRun.id, runId));
  });
  return stepId;
}

export async function completeWorkflowStage(
  runId: string,
  stepId: string,
  stage: SongCreationStage,
  options: {
    nextStage?: SongCreationStage;
    runStatus?: SongCreationRunStatus;
    metadata?: JsonMetadata;
  } = {}
) {
  const db = await getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(songCreationStep)
      .set({ status: 'completed', outputMetadata: options.metadata, completedAt: now })
      .where(and(eq(songCreationStep.id, stepId), eq(songCreationStep.runId, runId)));
    await tx
      .update(songCreationRun)
      .set({
        status: options.runStatus || (stage === 'completed' ? 'completed' : 'running'),
        currentStage: options.nextStage || stage,
        lastError: null,
        updatedAt: now,
        completedAt: stage === 'completed' || options.runStatus === 'completed' ? now : null,
      })
      .where(eq(songCreationRun.id, runId));
  });
}

export async function getWorkflowRunBySongId(songId: string) {
  const db = await getDb();
  const [run] = await db
    .select({ id: songCreationRun.id })
    .from(songCreationRun)
    .where(eq(songCreationRun.songId, songId))
    .orderBy(desc(songCreationRun.createdAt))
    .limit(1);
  return run;
}

/** 将最终发布决定写回同一条创作运行，形成从素材到上线的完整审计链。 */
export async function recordPublicationWorkflow(
  songId: string,
  state: 'published' | 'publish_ready',
  metadata: JsonMetadata = {}
) {
  const run = await getWorkflowRunBySongId(songId);
  if (!run) return;
  const stepId = await startWorkflowStage(run.id, state);
  await completeWorkflowStage(run.id, stepId, state, {
    nextStage: state,
    runStatus: 'completed',
    metadata,
  });
}

export async function getWorkflowRun(runId: string, userId: string) {
  const db = await getDb();
  const [run] = await db
    .select()
    .from(songCreationRun)
    .where(and(eq(songCreationRun.id, runId), eq(songCreationRun.userId, userId)))
    .limit(1);
  if (!run) return undefined;

  const steps = await db
    .select()
    .from(songCreationStep)
    .where(eq(songCreationStep.runId, runId))
    .orderBy(songCreationStep.startedAt);
  const latestFailedStep = [...steps].reverse().find((step) => step.status === 'failed');
  return {
    ...run,
    phase: getSongCreationPhase(run.currentStage),
    retryableStage:
      run.status === 'failed'
        ? getFailedGenerationStage({ generationStage: run.currentStage }) || latestFailedStep?.stage || run.currentStage
        : null,
    steps,
  };
}

/** 管理员对安全或质量门禁结果做显式决定；批准后才允许进入音乐生产。 */
export async function resolveLyricsReview({
  runId,
  userId,
  decision,
  lyrics,
  title,
}: {
  runId: string;
  userId: string;
  decision: 'approved' | 'rejected';
  lyrics?: string;
  title?: string;
}) {
  const db = await getDb();
  const [run] = await db
    .select()
    .from(songCreationRun)
    .where(and(eq(songCreationRun.id, runId), eq(songCreationRun.userId, userId)))
    .limit(1);
  if (!run) return undefined;
  if (run.currentStage !== 'lyrics_review') {
    throw new Error('This lyric workflow is not awaiting review');
  }

  const now = new Date();
  const workshop = (
    run.lyricWorkshop && typeof run.lyricWorkshop === 'object'
      ? { ...(run.lyricWorkshop as Record<string, unknown>) }
      : {}
  ) as Record<string, unknown>;
  const safety =
    workshop.safety && typeof workshop.safety === 'object'
      ? { ...(workshop.safety as Record<string, unknown>) }
      : undefined;
  if (decision === 'approved' && safety) safety.decision = 'allow';
  if (safety) workshop.safety = safety;
  workshop.reviewOutcome = {
    decision,
    reviewedAt: now.toISOString(),
    reviewerId: userId,
  };

  const reviewAttempt = await nextAttempt(runId, 'lyrics_review');
  await db.transaction(async (tx) => {
    await tx
      .update(songCreationRun)
      .set({
        status: decision === 'approved' ? 'running' : 'failed',
        currentStage: decision === 'approved' ? 'lyrics_ready' : 'lyrics_review',
        title: title?.trim() || run.title,
        lyrics: lyrics?.trim() || run.lyrics,
        lyricWorkshop: workshop,
        lastError: decision === 'approved' ? null : 'Lyrics rejected by the administrator',
        updatedAt: now,
      })
      .where(eq(songCreationRun.id, runId));
    await tx.insert(songCreationStep).values({
      id: randomUUID(),
      runId,
      stage: 'lyrics_review',
      status: 'completed',
      attempt: reviewAttempt,
      outputMetadata: { decision, reviewerId: userId },
      completedAt: now,
    });
  });

  return {
    ...run,
    status: decision === 'approved' ? 'running' : 'failed',
    currentStage: decision === 'approved' ? 'lyrics_ready' : 'lyrics_review',
    title: title?.trim() || run.title,
    lyrics: lyrics?.trim() || run.lyrics,
    lyricWorkshop: workshop,
  };
}

/** 模型失败保留真实歌词阶段，不退回笼统的 generating_lyrics。 */
export function getFailedGenerationStage(error: unknown): SongCreationStage | undefined {
  const stage = (error as { generationStage?: unknown } | null)?.generationStage;
  return stage === 'planning_lyrics' || stage === 'drafting_lyrics' || stage === 'editing_lyrics' ? stage : undefined;
}
