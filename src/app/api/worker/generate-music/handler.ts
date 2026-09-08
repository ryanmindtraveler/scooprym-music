import { failActiveMusicJob, processMusicJob } from '@/lib/creation/song-workflow';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const workerPayloadSchema = z
  .object({
    songId: z.string().uuid(),
    attemptId: z.string().uuid().optional(),
  })
  .strict();

/**
 * Worker 只信任 songId。歌词、提示词、格式、owner 与计费模式均由状态机从数据库读取。
 */
export async function handleGenerateMusicWorker(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    // 已签名但格式错误的消息不会因重试而变正确，返回 2xx 以终止毒消息循环。
    return NextResponse.json({ status: 'rejected', error: 'Invalid JSON payload' });
  }

  const parsed = workerPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ status: 'rejected', error: 'Payload must contain only a valid songId' });
  }

  try {
    const result = await processMusicJob(parsed.data.songId, {
      stageBoundary: true,
      expectedAttemptId: parsed.data.attemptId,
    });

    // 领取失败或已保存恢复点后的投递失败允许重试；不能重做已成功的付费生成。
    if (result.retryable) {
      return NextResponse.json({ status: 'retry', error: result.error }, { status: 503 });
    }

    // 任务一旦领取，无论成功、明确失败或重复投递都返回 2xx，避免从头生成。
    return NextResponse.json({
      status: result.success ? (result.skipped ? 'duplicate' : 'success') : 'failed',
      data: result,
    });
  } catch (error) {
    console.error('[generate-music-worker] Unexpected post-claim exception:', error);
    await failActiveMusicJob(parsed.data.songId, error, parsed.data.attemptId);
    return NextResponse.json({ status: 'failed', error: 'Worker terminated with an internal error' });
  }
}
