import { randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import { story, storyCandidate } from '@/db/schema';
import { getSession } from '@/lib/server';
import { Routes } from '@/routes';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const db = await getDb();

  console.info('[story-radar/adopt] started', { candidateId: id });
  const [candidate] = await db.select().from(storyCandidate).where(eq(storyCandidate.id, id)).limit(1);
  console.info('[story-radar/adopt] candidate loaded', {
    candidateId: id,
    elapsedMs: Date.now() - startedAt,
    alreadyAdopted: Boolean(candidate?.storyId),
  });

  if (!candidate) {
    return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
  }

  let storyId = candidate.storyId;
  if (!storyId) {
    const [created] = await db
      .insert(story)
      .values({
        id: randomUUID(),
        sourceUrl: candidate.sourceUrl,
        sourceText: candidate.sourceTitle,
        newsSummary: candidate.sourceTitle,
      })
      .onConflictDoNothing({ target: story.sourceUrl })
      .returning({ id: story.id });

    if (created) {
      storyId = created.id;
    } else {
      const [existing] = await db
        .select({ id: story.id })
        .from(story)
        .where(eq(story.sourceUrl, candidate.sourceUrl))
        .limit(1);
      storyId = existing?.id ?? null;
    }

    console.info('[story-radar/adopt] story resolved', {
      candidateId: id,
      storyId,
      elapsedMs: Date.now() - startedAt,
    });
  }

  if (!storyId) {
    console.error('[story-radar/adopt] story resolution failed', {
      candidateId: id,
      elapsedMs: Date.now() - startedAt,
    });
    return NextResponse.json({ success: false, error: 'Unable to create the editorial story' }, { status: 500 });
  }

  if (candidate.status !== 'adopted' || candidate.storyId !== storyId) {
    await db
      .update(storyCandidate)
      .set({ storyId, status: 'adopted', adoptedAt: candidate.adoptedAt ?? new Date(), updatedAt: new Date() })
      .where(eq(storyCandidate.id, id));
  }

  const createUrl = `${Routes.AdminCreate}?storyId=${encodeURIComponent(storyId)}&content=${encodeURIComponent(candidate.sourceUrl)}`;
  console.info('[story-radar/adopt] completed', {
    candidateId: id,
    storyId,
    elapsedMs: Date.now() - startedAt,
  });
  return NextResponse.json({ success: true, storyId, createUrl }, { headers: { 'Cache-Control': 'no-store' } });
}
