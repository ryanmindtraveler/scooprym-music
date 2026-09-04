import { getSession } from '@/lib/server';
import { getWorkflowRun } from '@/lib/song-creation-workflow';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const runIdSchema = z.string().uuid();

/** 返回当前管理员自己的完整创作运行及阶段历史。 */
export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { runId: rawRunId } = await context.params;
  const parsedRunId = runIdSchema.safeParse(rawRunId);
  if (!parsedRunId.success) {
    return NextResponse.json({ success: false, error: 'Invalid workflow run id' }, { status: 400 });
  }

  const run = await getWorkflowRun(parsedRunId.data, session.user.id);
  if (!run) {
    return NextResponse.json({ success: false, error: 'Workflow run not found' }, { status: 404 });
  }

  // 模型签名下载地址仅供服务端断点恢复，不发送到浏览器或本地持久化队列。
  const steps = run.steps.map((step) => {
    const { generatedAudioUrl: _privateUrl, ...metadata } = (step.outputMetadata || {}) as Record<string, unknown>;
    return { ...step, outputMetadata: metadata };
  });
  return NextResponse.json({ success: true, run: { ...run, steps } });
}
