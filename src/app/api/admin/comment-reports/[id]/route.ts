import { getDb } from '@/db';
import { songComment, songCommentReport } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const actionSchema = z.object({ action: z.enum(['hide', 'dismiss']) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (session?.user?.role !== 'admin' || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Administrator access required' }, { status: 403 });
    }
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid moderation action' }, { status: 400 });
    }
    const { id } = await params;
    const db = await getDb();

    const result = await db.transaction(async (tx) => {
      const [report] = await tx
        .select({ commentId: songCommentReport.commentId, status: songCommentReport.status })
        .from(songCommentReport)
        .where(eq(songCommentReport.id, id))
        .limit(1);
      if (!report) return null;

      if (parsed.data.action === 'hide') {
        await tx
          .update(songComment)
          .set({ status: 'hidden', updatedAt: new Date() })
          .where(eq(songComment.id, report.commentId));
      }
      await tx
        .update(songCommentReport)
        .set({
          status: parsed.data.action === 'hide' ? 'actioned' : 'dismissed',
          handledBy: session.user.id,
          handledAt: new Date(),
        })
        .where(eq(songCommentReport.id, id));
      return true;
    });

    if (!result) return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('moderate comment report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update report' }, { status: 500 });
  }
}
