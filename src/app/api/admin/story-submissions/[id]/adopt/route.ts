import { randomUUID } from 'node:crypto';
import { getDb } from '@/db/index';
import { storyCandidate, storySubmission } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import { inferSubmissionCategory } from '@/lib/stories/story-submissions';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const [submission] = await tx.select().from(storySubmission).where(eq(storySubmission.id, id)).limit(1);
    if (!submission) return null;
    if (!submission.sourceUrl || !submission.sourceDomain) {
      return { error: 'A verified public source is required before sending this tip to Story Radar.' };
    }

    const now = new Date();
    const relevanceScore = Math.min(100, 70 + Math.max(0, submission.submissionCount - 1) * 5);
    const [candidate] = await tx
      .insert(storyCandidate)
      .values({
        id: randomUUID(),
        provider: 'reader_submission',
        sourceUrl: submission.sourceUrl,
        sourceTitle: submission.sourceTitle || submission.note || `Reader tip from ${submission.sourceDomain}`,
        sourceDomain: submission.sourceDomain,
        sourceImageUrl: submission.sourceImageUrl,
        category: inferSubmissionCategory(`${submission.sourceTitle || ''} ${submission.note || ''}`),
        matchedTerms: JSON.stringify(['reader submission']),
        relevanceScore,
        status: 'shortlisted',
        publishedAt: submission.sourcePublishedAt || submission.lastSubmittedAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: storyCandidate.sourceUrl,
        set: {
          status: sql`case when ${storyCandidate.status} = 'adopted' then 'adopted' else 'shortlisted' end`,
          relevanceScore: sql`greatest(${storyCandidate.relevanceScore}, ${relevanceScore})`,
          sourceTitle: submission.sourceTitle || submission.note || `Reader tip from ${submission.sourceDomain}`,
          sourceImageUrl: submission.sourceImageUrl,
          updatedAt: now,
        },
      })
      .returning({ id: storyCandidate.id, status: storyCandidate.status });

    await tx
      .update(storySubmission)
      .set({
        status: 'adopted',
        candidateId: candidate.id,
        reviewedBy: session.user.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(storySubmission.id, id));

    return candidate;
  });

  if (!result) {
    return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
  }
  if ('error' in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true, candidate: result });
}
