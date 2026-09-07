import { randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import { generationAttempt, songCreationRun, song as songTable } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import { audioInputHash, findAudioCheckpoint } from '@/lib/creation/audio-checkpoint';
import { planMusicRetry } from '@/lib/creation/music-retry-policy';
import { completeWorkflowStage, getWorkflowRun, startWorkflowStage } from '@/lib/creation/song-creation-workflow';
import { dispatchMusicJob } from '@/lib/creation/song-job-dispatch';
import { runPersistedSongProductCheck } from '@/lib/creation/song-workflow';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const paramsSchema = z.object({ runId: z.string().uuid() });
const bodySchema = z.object({ stage: z.enum(['music', 'product_check']) });

export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedParams.success || !parsedBody.success) {
    return NextResponse.json({ success: false, error: 'Invalid workflow retry request' }, { status: 400 });
  }

  const run = await getWorkflowRun(parsedParams.data.runId, session.user.id);
  if (!run?.songId) {
    return NextResponse.json({ success: false, error: 'This workflow has no persisted song yet' }, { status: 409 });
  }
  const songId = run.songId;
  const db = await getDb();

  if (parsedBody.data.stage === 'product_check') {
    const [assets] = await db
      .select({ audioKey: songTable.audioKey, coverKey: songTable.coverImageKey })
      .from(songTable)
      .where(eq(songTable.id, songId))
      .limit(1);
    // 兼容浏览器中缓存的旧失败状态：缺封面必须接续制作，重复检查不会修复缺失资源。
    if (!assets?.audioKey || assets.coverKey) {
      const productCheck = await runPersistedSongProductCheck({ songId, userId: session.user.id });
      return NextResponse.json(
        { success: productCheck.passed, stage: 'product_check', productCheck },
        {
          status: productCheck.passed ? 200 : 422,
        }
      );
    }
  }

  const retry = await db.transaction(async (tx) => {
    // 以创作运行行锁串行化并发点击，确保只创建一个新的生产尝试。
    await tx
      .select({ id: songCreationRun.id })
      .from(songCreationRun)
      .where(eq(songCreationRun.id, run.id))
      .for('update');
    const [latestAttempt] = await tx
      .select()
      .from(generationAttempt)
      .where(eq(generationAttempt.songId, songId))
      .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
      .limit(1);
    if (!latestAttempt) {
      return { error: 'The stored music request is missing' };
    }
    const [song] = await tx
      .select({ audioKey: songTable.audioKey, audioUrl: songTable.audioUrl, lyrics: songTable.lyrics })
      .from(songTable)
      .where(eq(songTable.id, songId))
      .limit(1);
    const checkpoint = await findAudioCheckpoint(
      run.id,
      audioInputHash(song?.lyrics || '', latestAttempt.generationPrompt || '', latestAttempt.audioFormat)
    );
    const plan = planMusicRetry(latestAttempt.processingStatus, !!song?.audioKey && !!song.audioUrl, !!checkpoint);
    if (plan.error) return { error: plan.error };
    await tx.insert(generationAttempt).values({
      id: randomUUID(),
      songId,
      prompt: latestAttempt.prompt,
      generationPrompt: latestAttempt.generationPrompt,
      coverArtPrompt: latestAttempt.coverArtPrompt,
      outputFormat: latestAttempt.outputFormat,
      audioFormat: latestAttempt.audioFormat,
      generationRequestHash: latestAttempt.generationRequestHash,
      generationBillingMode: 'internal_admin',
      processingStatus: plan.resumeStatus,
      processingError: null,
      creditsDeducted: false,
    });
    return { resumeStatus: plan.resumeStatus, retryOfAttemptId: latestAttempt.id };
  });
  if (retry.error) return NextResponse.json({ success: false, error: retry.error }, { status: 409 });

  const stepId = await startWorkflowStage(run.id, 'queued_audio', { runStatus: 'queued' });
  await completeWorkflowStage(run.id, stepId, 'queued_audio', {
    nextStage: 'queued_audio',
    runStatus: 'queued',
    metadata: { retryOfAttemptId: retry.retryOfAttemptId },
  });
  const executionMode = await dispatchMusicJob(run.songId, session.user.id);

  return NextResponse.json(
    { success: true, stage: 'music', songId: run.songId, workflowRunId: run.id, executionMode },
    { status: 202 }
  );
}
