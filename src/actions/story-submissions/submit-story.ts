'use server';

import { randomUUID } from 'node:crypto';
import { getDb } from '@/db/index';
import { storySubmission } from '@/db/schema';
import { getStorySubmissionRateLimiter } from '@/lib/ratelimit';
import { actionClient } from '@/lib/safe-action';
import { getSession } from '@/lib/server';
import { normalizeStorySubmissionUrl } from '@/lib/story-submissions';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';

const storySubmissionSchema = z
  .object({
    sourceUrl: z.string().trim().max(2048, 'This link is too long.'),
    note: z.string().trim().max(280, 'Keep your tip under 280 characters.'),
  })
  .superRefine(({ sourceUrl, note }, context) => {
    if (!sourceUrl && !note) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add a story link or tell us what happened.',
        path: ['sourceUrl'],
      });
    }
    if (sourceUrl && sourceUrl.length < 12) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a complete public link.',
        path: ['sourceUrl'],
      });
    }
    if (note && note.length < 10) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tell the desk what happened in at least 10 characters.',
        path: ['note'],
      });
    }
  });

function getVisitorAddress(headerStore: Awaited<ReturnType<typeof headers>>) {
  return (
    headerStore.get('cf-connecting-ip') ||
    headerStore.get('x-real-ip') ||
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export const submitStoryAction = actionClient.schema(storySubmissionSchema).action(async ({ parsedInput }) => {
  try {
    const [session, headerStore] = await Promise.all([getSession(), headers()]);
    const rateLimitIdentity = session?.user?.id ?? getVisitorAddress(headerStore);
    const rateLimit = await getStorySubmissionRateLimiter().limit(`story-tip:${rateLimitIdentity}`);
    if (!rateLimit.success) {
      return { success: false, error: 'You have sent five tips today. Come back tomorrow with more chaos.' };
    }

    const normalizedSource = parsedInput.sourceUrl ? normalizeStorySubmissionUrl(parsedInput.sourceUrl) : null;
    const normalizedUrl = normalizedSource?.normalizedUrl ?? null;
    const sourceDomain = normalizedSource?.sourceDomain ?? null;
    const note = parsedInput.note || null;
    const now = new Date();
    const db = await getDb();
    const values = {
      id: randomUUID(),
      sourceUrl: normalizedUrl,
      sourceDomain,
      note,
      submittedBy: session?.user?.id ?? null,
      lastSubmittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const [saved] = normalizedUrl
      ? await db
          .insert(storySubmission)
          .values(values)
          .onConflictDoUpdate({
            target: storySubmission.sourceUrl,
            set: {
              note,
              submissionCount: sql`${storySubmission.submissionCount} + 1`,
              lastSubmittedAt: now,
              updatedAt: now,
            },
          })
          .returning({
            id: storySubmission.id,
            status: storySubmission.status,
            submissionCount: storySubmission.submissionCount,
          })
      : await db.insert(storySubmission).values(values).returning({
          id: storySubmission.id,
          status: storySubmission.status,
          submissionCount: storySubmission.submissionCount,
        });

    return {
      success: true,
      alreadyKnown: saved.submissionCount > 1,
      message:
        saved.status === 'adopted'
          ? 'This story is already on the ScoopRYM desk.'
          : saved.submissionCount > 1
            ? 'Good catch — other readers flagged this one too.'
            : 'Tip received. The ScoopRYM desk will review it.',
    };
  } catch (error) {
    console.error('submit story tip error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'The tip could not be sent. Try again shortly.',
    };
  }
});
