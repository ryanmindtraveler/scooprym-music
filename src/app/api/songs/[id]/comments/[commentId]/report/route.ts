import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { songComment, songCommentReport } from '@/db/schema';
import { getRateLimiter } from '@/lib/ratelimit';
import { getSession } from '@/lib/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const reportSchema = z.object({
  reason: z.enum(['spam', 'harassment', 'misinformation', 'other']),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { id: songId, commentId } = await params;
    const session = await getSession();
    const viewerId = session?.user?.id;
    if (!viewerId) {
      return NextResponse.json({ success: false, error: 'Sign in to report a comment' }, { status: 401 });
    }

    const parsed = reportSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Choose a valid report reason' }, { status: 400 });
    }

    const rateLimit = await getRateLimiter().limit(`comment-report:${viewerId}`);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many reports. Try again later' }, { status: 429 });
    }

    const db = await getDb();
    const [comment] = await db
      .select({ id: songComment.id, userId: songComment.userId })
      .from(songComment)
      .where(and(eq(songComment.id, commentId), eq(songComment.songId, songId)))
      .limit(1);
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }
    if (comment.userId === viewerId) {
      return NextResponse.json({ success: false, error: 'You cannot report your own comment' }, { status: 400 });
    }

    await db
      .insert(songCommentReport)
      .values({
        id: randomUUID(),
        commentId,
        reporterId: viewerId,
        reason: parsed.data.reason,
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('report song comment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to report comment' }, { status: 500 });
  }
}
