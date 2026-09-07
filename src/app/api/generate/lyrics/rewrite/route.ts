import { rewriteLyrics } from '@/ai/text/lib/generation';
import { getSession } from '@/lib/auth/server';
import { getRateLimiter } from '@/lib/infrastructure/ratelimit';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim().length === 0 ? undefined : value;

const rewriteRequestSchema = z.object({
  selectedText: z.string().trim().min(1).max(6_000),
  context: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).max(12_000).optional()),
  style: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).max(2_000).optional()),
  modelProvider: z.enum(['openai', 'google', 'anthropic', 'deepseek', 'openrouter']).optional(),
});

/**
 * 重写管理员选定的歌词片段。
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
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsedBody = rewriteRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid lyrics rewrite request',
        details: parsedBody.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
      { status: 400 }
    );
  }

  try {
    const { selectedText, context, style, modelProvider } = parsedBody.data;
    const rewrittenText = await rewriteLyrics({
      selectedText,
      context,
      style,
      provider: modelProvider,
    });

    return NextResponse.json({ success: true, rewrittenText });
  } catch (error) {
    console.error('rewrite-lyrics error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to rewrite lyrics' },
      { status: 500 }
    );
  }
}
