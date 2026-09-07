import { getDb } from '@/db';
import { songComment } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { id: songId, commentId } = await params;
    const session = await getSession();
    const viewer = session?.user;
    if (!viewer?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const [comment] = await db
      .select({ userId: songComment.userId })
      .from(songComment)
      .where(and(eq(songComment.id, commentId), eq(songComment.songId, songId)))
      .limit(1);

    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }
    if (comment.userId !== viewer.id && viewer.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(songComment).where(and(eq(songComment.id, commentId), eq(songComment.songId, songId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('delete song comment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete comment' }, { status: 500 });
  }
}
