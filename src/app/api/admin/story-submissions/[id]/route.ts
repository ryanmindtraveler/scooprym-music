import { getDb } from '@/db/index';
import { storySubmission } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import { enrichStorySubmissionUrl, normalizeStorySubmissionUrl } from '@/lib/stories/story-submissions';
import { and, eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const editSubmissionSchema = z.object({
  operation: z.literal('edit'),
  sourceUrl: z.string().trim().max(2048),
  note: z.string().trim().max(280),
});

const reviewSubmissionSchema = z.object({
  operation: z.literal('review'),
  status: z.enum(['pending', 'rejected']),
  rejectionReason: z.string().trim().max(280).optional(),
});

const submissionMutationSchema = z.discriminatedUnion('operation', [editSubmissionSchema, reviewSubmissionSchema]);

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 } as const;
  if (session.user.role !== 'admin') return { error: 'Forbidden', status: 403 } as const;
  return { session } as const;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireAdmin();
  if ('error' in authorization) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  const parsed = submissionMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid submission update' }, { status: 400 });
  }

  const { id } = await params;
  const now = new Date();
  const db = await getDb();

  if (parsed.data.operation === 'review') {
    const reason = parsed.data.rejectionReason?.trim() || null;
    if (parsed.data.status === 'rejected' && reason && reason.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Rejection notes need at least 4 characters.' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(storySubmission)
      .set({
        status: parsed.data.status,
        reviewedBy: parsed.data.status === 'rejected' ? authorization.session.user.id : null,
        reviewedAt: parsed.data.status === 'rejected' ? now : null,
        rejectionReason: parsed.data.status === 'rejected' ? reason : null,
        updatedAt: now,
      })
      .where(eq(storySubmission.id, id))
      .returning({ id: storySubmission.id, status: storySubmission.status });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, submission: updated });
  }

  const sourceUrl = parsed.data.sourceUrl.trim();
  const note = parsed.data.note.trim();
  if (!sourceUrl && !note) {
    return NextResponse.json({ success: false, error: 'Keep a source link or a written tip.' }, { status: 400 });
  }
  if (note && note.length < 10) {
    return NextResponse.json({ success: false, error: 'Written tips need at least 10 characters.' }, { status: 400 });
  }

  let metadata: Awaited<ReturnType<typeof enrichStorySubmissionUrl>> | null = null;
  if (sourceUrl) {
    let normalizedSource: ReturnType<typeof normalizeStorySubmissionUrl>;
    try {
      normalizedSource = normalizeStorySubmissionUrl(sourceUrl);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'This public source could not be inspected.',
        },
        { status: 422 }
      );
    }

    const [duplicate] = await db
      .select({
        id: storySubmission.id,
        status: storySubmission.status,
        sourceDomain: storySubmission.sourceDomain,
        note: storySubmission.note,
        submissionCount: storySubmission.submissionCount,
      })
      .from(storySubmission)
      .where(and(eq(storySubmission.sourceUrl, normalizedSource.normalizedUrl), ne(storySubmission.id, id)))
      .limit(1);
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'This source already has a reader-tip record.', duplicate },
        { status: 409 }
      );
    }

    try {
      metadata = await enrichStorySubmissionUrl(normalizedSource.normalizedUrl);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'This public source could not be inspected.',
        },
        { status: 422 }
      );
    }
  }

  const [updated] = await db
    .update(storySubmission)
    .set({
      sourceUrl: metadata?.normalizedUrl ?? null,
      sourceDomain: metadata?.sourceDomain ?? null,
      note: note || null,
      sourceTitle: metadata?.title ?? null,
      sourceDescription: metadata?.description ?? null,
      sourceImageUrl: metadata?.imageUrl ?? null,
      sourcePublishedAt: metadata?.publishedAt ?? null,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      updatedAt: now,
    })
    .where(eq(storySubmission.id, id))
    .returning({ id: storySubmission.id, status: storySubmission.status });

  if (!updated) {
    return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, submission: updated });
}
