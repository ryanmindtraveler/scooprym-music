import { randomUUID } from 'node:crypto';
import { generateLyrics, type LyricsCheckpointStage } from '@/ai/text/lib/generation';
import { prepareSourceMaterial, recommendSourceStyle } from '@/ai/text/lib/source-analysis';
import { getDb } from '@/db';
import { radarCreationJob, songCreationRun, storyCandidate, user } from '@/db/schema';
import { canUseQStash, getWorkerUrl, qstash } from '@/lib/queue';
import {
  startLyricsWorkflow,
  getWorkflowRun,
  recordLyricsCheckpoint,
  completeLyricsWorkflow,
  failWorkflowStep,
  startWorkflowStage,
  completeWorkflowStage,
} from '@/lib/song-creation-workflow';
import { submitMusicGeneration } from '@/lib/submit-music-generation';
import { recommendEditorialStyleId, buildDynamicProductionRecipe } from '@/lib/music/production-recipe';
import { z } from 'zod';
import { getEditorialStyleProfileById } from '@/lib/music/editorial-styles';
import { and, eq, isNull, lt, ne, or } from 'drizzle-orm';

class CheckpointSaved extends Error {}

const autoProductionSchema = z.object({
  version: z.literal(1),
  direction: z.string().min(1),
  styleId: z.string().min(1),
  reason: z.string(),
  variantId: z.string().min(1),
  source: z.object({ text: z.string().min(1), url: z.string().optional(), title: z.string().optional() }),
});

/** 后台队列必须可达；禁止以浏览器生命周期或after长请求伪装可靠队列。 */
export async function dispatchRadarCreation(candidateId: string, sequence: number) {
  if (!canUseQStash())
    throw new Error('Background queue is not configured. Configure QStash and a public worker URL first.');
  await qstash.publishJSON({
    url: getWorkerUrl('/api/worker/radar-creation'),
    body: { candidateId },
    deduplicationId: `radar-${candidateId}-${sequence}`,
    flowControl: { key: 'scooprym-radar-lyrics', parallelism: 2 },
    retries: 8,
    retryDelay: '60000',
  });
}

export async function enqueueRadarCreation(candidateId: string, userId: string) {
  if (!canUseQStash())
    throw new Error('Background queue is not configured. Configure QStash and a public worker URL first.');
  const db = await getDb();
  const [candidate] = await db.select().from(storyCandidate).where(eq(storyCandidate.id, candidateId)).limit(1);
  if (!candidate) throw new Error('Story candidate not found');
  if (candidate.status === 'dismissed') throw new Error('Restore this story before creating a song');
  const direction = getEditorialStyleProfileById(recommendEditorialStyleId(candidate.sourceTitle)).tags.join(', ');
  await db
    .insert(radarCreationJob)
    .values({
      candidateId,
      userId,
      runId: randomUUID(),
      songId: randomUUID(),
      sourceUrl: candidate.sourceUrl,
      sourceTitle: candidate.sourceTitle,
      direction,
    })
    .onConflictDoNothing();
  let [job] = await db.select().from(radarCreationJob).where(eq(radarCreationJob.candidateId, candidateId)).limit(1);
  if (!job) throw new Error('Unable to persist creation job');
  if (job.status === 'failed') {
    const [retry] = await db
      .update(radarCreationJob)
      .set({ status: 'queued', sequence: job.sequence + 1, error: null, updatedAt: new Date() })
      .where(
        and(
          eq(radarCreationJob.candidateId, candidateId),
          eq(radarCreationJob.status, 'failed'),
          isNull(radarCreationJob.leaseId)
        )
      )
      .returning();
    if (retry) job = retry;
  }
  if (job.status === 'queued') await dispatchRadarCreation(candidateId, job.sequence);
  await db
    .update(storyCandidate)
    .set({ status: 'adopted', adoptedAt: candidate.adoptedAt ?? new Date(), updatedAt: new Date() })
    .where(eq(storyCandidate.id, candidateId));
  return { candidateId, runId: job.runId, songId: job.songId, status: job.status };
}

/** 每次投递最多完成一个新的歌词检查点，再投递下一阶段，不更换原有歌词提示词。 */
export async function processRadarCreation(candidateId: string) {
  const db = await getDb();
  const leaseId = randomUUID();
  const now = new Date();
  const [job] = await db
    .update(radarCreationJob)
    .set({ status: 'running', leaseId, leaseUntil: new Date(now.getTime() + 330_000), updatedAt: now })
    .where(
      and(
        eq(radarCreationJob.candidateId, candidateId),
        ne(radarCreationJob.status, 'handed_off'),
        or(isNull(radarCreationJob.leaseUntil), lt(radarCreationJob.leaseUntil, now))
      )
    )
    .returning();
  if (!job) {
    const [existing] = await db
      .select()
      .from(radarCreationJob)
      .where(eq(radarCreationJob.candidateId, candidateId))
      .limit(1);
    if (existing?.status === 'handed_off') return;
    throw new Error('Job is missing or already running');
  }
  const owned = and(eq(radarCreationJob.candidateId, candidateId), eq(radarCreationJob.leaseId, leaseId));
  let workflow: { runId: string; stepId: string } | undefined;
  try {
    const [owner] = await db.select({ role: user.role }).from(user).where(eq(user.id, job.userId)).limit(1);
    if (owner?.role !== 'admin') throw new Error('Job owner no longer has administrator access');
    let result = job.lyricResult;
    const existing = await getWorkflowRun(job.runId, job.userId);
    const savedProduction = autoProductionSchema.safeParse(
      [...(existing?.steps ?? [])]
        .reverse()
        .find((step) => step.stage === 'source_ready' && step.status === 'completed')?.outputMetadata
    );
    let production = savedProduction.success ? savedProduction.data : undefined;
    if (!result && existing?.lyrics && existing.title && existing.summary) {
      result = {
        title: existing.title,
        summary: existing.summary,
        lyrics: existing.lyrics,
        sourceText: existing.sourceText ?? undefined,
      };
    }
    if (!result) {
      const resumeCheckpoints = Object.fromEntries(
        (existing?.steps ?? [])
          .filter((step) => step.status === 'completed')
          .map((step) => [step.stage, step.outputMetadata])
      ) as Partial<Record<LyricsCheckpointStage, unknown>>;
      const sourceCheckpoint = resumeCheckpoints.analyzing_source as
        | { source?: { text?: unknown; url?: unknown; title?: unknown } }
        | undefined;
      const savedSource = sourceCheckpoint?.source;
      workflow = await startLyricsWorkflow({
        runId: job.runId,
        userId: job.userId,
        sourceMode: 'link',
        sourceUrl: job.sourceUrl,
        directionPrompt: job.direction,
        provider: 'openrouter',
      });
      // 旧运行已有策划/歌词时沿用旧方向；新运行才执行自动选型，防止恢复时换风格。
      if (
        !production &&
        !resumeCheckpoints.planning_lyrics &&
        !resumeCheckpoints.drafting_lyrics &&
        !resumeCheckpoints.editing_lyrics
      ) {
        const stepId = await startWorkflowStage(job.runId, 'source_ready');
        const source = await prepareSourceMaterial({ newsUrl: job.sourceUrl, prompt: job.sourceTitle });
        const recommendation = await recommendSourceStyle(job.sourceUrl, job.sourceTitle, 'en', source);
        const direction = recommendation.tags.join(', ');
        const recipe = buildDynamicProductionRecipe({ direction, storyContext: `${job.sourceTitle}\n${source.text}` });
        if (!recipe) throw new Error('Automatic production recipe could not be selected');
        production = {
          version: 1,
          direction,
          styleId: recommendation.styleId,
          reason: recommendation.reason,
          variantId: recipe.variantId,
          source,
        };
        await completeWorkflowStage(job.runId, stepId, 'source_ready', {
          metadata: { ...production, recipe },
        });
        // 推荐独立投递，避免新闻抓取和歌词策划挤在同一次服务器执行窗口。
        throw new CheckpointSaved();
      }
      if (production) {
        await db
          .update(songCreationRun)
          .set({ directionPrompt: production.direction, productionVariantId: production.variantId })
          .where(and(eq(songCreationRun.id, job.runId), eq(songCreationRun.userId, job.userId)));
      }
      const lyrics = await generateLyrics({
        preparedSource:
          production?.source ??
          (typeof savedSource?.text === 'string'
            ? {
                text: savedSource.text,
                url: job.sourceUrl,
                title: typeof savedSource.title === 'string' ? savedSource.title : undefined,
              }
            : undefined),
        newsUrl: job.sourceUrl,
        directionPrompt: production?.direction ?? job.direction,
        productionVariantId: production?.variantId,
        provider: 'openrouter',
        resumeCheckpoints,
        onCheckpoint: async (stage, metadata) => {
          await recordLyricsCheckpoint(job.runId, stage, metadata);
          if (['planning_lyrics', 'drafting_lyrics', 'editing_lyrics'].includes(stage)) throw new CheckpointSaved();
        },
      });
      await completeLyricsWorkflow(job.runId, workflow.stepId, {
        title: lyrics.title,
        summary: lyrics.summary,
        lyrics: lyrics.lyrics,
        lyricWorkshop: lyrics.workshop,
        sourceUrl: job.sourceUrl,
        sourceText: lyrics.source?.text,
        requiresReview: false,
      });
      result = { title: lyrics.title, summary: lyrics.summary, lyrics: lyrics.lyrics, sourceText: lyrics.source?.text };
      await db.update(radarCreationJob).set({ lyricResult: result }).where(owned);
    }
    const response = await submitMusicGeneration(
      {
        songId: job.songId,
        workflowRunId: job.runId,
        title: result.title,
        lyrics: result.lyrics,
        sourceSummary: result.summary,
        sourceUrl: job.sourceUrl,
        sourceText: result.sourceText || job.sourceTitle,
        musicDirectionPrompt: production?.direction ?? job.direction,
        productionVariantId: production?.variantId,
      },
      { id: job.userId, role: 'admin' }
    );
    if (!response.ok) throw new Error(`Music submission failed (${response.status})`);
    await db
      .update(radarCreationJob)
      .set({ status: 'handed_off', error: null, leaseId: null, leaseUntil: null, updatedAt: new Date() })
      .where(owned);
  } catch (error) {
    if (error instanceof CheckpointSaved) {
      const sequence = job.sequence + 1;
      await db
        .update(radarCreationJob)
        .set({ status: 'queued', sequence, leaseId: null, leaseUntil: null, updatedAt: new Date() })
        .where(owned);
      await dispatchRadarCreation(candidateId, sequence);
      return;
    }
    if (workflow) await failWorkflowStep(workflow.runId, workflow.stepId, error).catch(() => undefined);
    await db
      .update(radarCreationJob)
      .set({
        status: 'failed',
        error: 'Generation failed. Check the saved workflow and worker logs.',
        leaseId: null,
        leaseUntil: null,
        updatedAt: new Date(),
      })
      .where(owned);
    throw error;
  }
}
