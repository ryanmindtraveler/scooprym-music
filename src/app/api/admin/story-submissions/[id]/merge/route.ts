import { getDb } from '@/db/index';
import { storySubmission } from '@/db/schema';
import { getSession } from '@/lib/server';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const mergeSchema = z.object({ targetId: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const parsed = mergeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid merge target' }, { status: 400 });
  }

  const { id } = await params;
  if (id === parsed.data.targetId) {
    return NextResponse.json({ success: false, error: 'A tip cannot be merged into itself.' }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const merged = await db.transaction(async (tx) => {
    const [source] = await tx.select().from(storySubmission).where(eq(storySubmission.id, id)).limit(1);
    const [target] = await tx
      .select()
      .from(storySubmission)
      .where(eq(storySubmission.id, parsed.data.targetId))
      .limit(1);
    if (!source || !target) return null;

    await tx
      .update(storySubmission)
      .set({
        submissionCount: sql`${storySubmission.submissionCount} + ${source.submissionCount}`,
        note: target.note || source.note,
        lastSubmittedAt:
          target.lastSubmittedAt.getTime() >= source.lastSubmittedAt.getTime()
            ? target.lastSubmittedAt
            : source.lastSubmittedAt,
        updatedAt: now,
      })
      .where(eq(storySubmission.id, target.id));

    await tx
      .update(storySubmission)
      .set({
        status: 'rejected',
        rejectionReason: `Merged into ${target.id}`,
        reviewedBy: session.user.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(storySubmission.id, source.id));

    return { targetId: target.id };
  });

  if (!merged) {
    return NextResponse.json({ success: false, error: 'Submission or merge target not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, ...merged });
}
