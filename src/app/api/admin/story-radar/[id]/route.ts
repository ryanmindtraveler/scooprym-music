import { getDb } from '@/db/index';
import { storyCandidate } from '@/db/schema';
import { getSession } from '@/lib/server';
import { STORY_CANDIDATE_STATUSES } from '@/lib/story-radar/types';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateCandidateSchema = z.object({
  status: z.enum(STORY_CANDIDATE_STATUSES),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const parsed = updateCandidateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }

  const { id } = await params;
  const db = await getDb();
  const updated = await db
    .update(storyCandidate)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(storyCandidate.id, id))
    .returning({ id: storyCandidate.id, status: storyCandidate.status });

  if (updated.length === 0) {
    return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, candidate: updated[0] });
}
