import { getSession } from '@/lib/server';
import { resolveLyricsReview } from '@/lib/song-creation-workflow';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const paramsSchema = z.object({ runId: z.string().uuid() });
const bodySchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  lyrics: z.string().trim().min(1).max(20_000).optional(),
  title: z.string().trim().min(2).max(48).optional(),
});

/** 管理员批准或拒绝被安全/质量门禁拦下的歌词。 */
export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedParams.success || !parsedBody.success) {
    return NextResponse.json({ success: false, error: 'Invalid review request' }, { status: 400 });
  }

  try {
    const run = await resolveLyricsReview({
      runId: parsedParams.data.runId,
      userId: session.user.id,
      ...parsedBody.data,
    });
    if (!run) return NextResponse.json({ success: false, error: 'Workflow run not found' }, { status: 404 });
    return NextResponse.json({ success: true, run });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to review lyrics' },
      { status: 409 }
    );
  }
}
