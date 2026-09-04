import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { song, songComment, user } from '@/db/schema';
import { COMMENT_MAX_LENGTH, validateCommentContent } from '@/lib/comment-moderation';
import { getRateLimiter } from '@/lib/ratelimit';
import { getSession } from '@/lib/server';
import { and, count, desc, eq, gte } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const COMMENT_PAGE_SIZE = 12;
const createCommentSchema = z.object({
  content: z.string().max(COMMENT_MAX_LENGTH + 100),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: songId } = await params;
    const requestedPage = Number.parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const db = await getDb();
    const session = await getSession();
    const viewerId = session?.user?.id;
    const isAdmin = session?.user?.role === 'admin';

    const [totalRow] = await db
      .select({ total: count() })
      .from(songComment)
      .where(and(eq(songComment.songId, songId), eq(songComment.status, 'visible')));

    const total = Number(totalRow?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / COMMENT_PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const rows = await db
      .select({
        id: songComment.id,
        content: songComment.content,
        createdAt: songComment.createdAt,
        authorId: user.id,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(songComment)
      .innerJoin(user, eq(user.id, songComment.userId))
      .where(and(eq(songComment.songId, songId), eq(songComment.status, 'visible')))
      .orderBy(desc(songComment.createdAt))
      .limit(COMMENT_PAGE_SIZE)
      .offset((currentPage - 1) * COMMENT_PAGE_SIZE);

    return NextResponse.json({
      success: true,
      data: {
        comments: rows.map((row) => ({
          id: row.id,
          content: row.content,
          createdAt: row.createdAt.toISOString(),
          author: {
            id: row.authorId,
            name: row.authorName,
            image: row.authorImage,
          },
          canDelete: isAdmin || row.authorId === viewerId,
        })),
        page: currentPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('list song comments error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: songId } = await params;
    const session = await getSession();
    const viewer = session?.user;
    if (!viewer?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = createCommentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: `Keep comments under ${COMMENT_MAX_LENGTH} characters` },
        { status: 400 }
      );
    }

    const moderation = validateCommentContent(parsed.data.content);
    if (!moderation.valid) {
      return NextResponse.json({ success: false, error: moderation.message, code: moderation.code }, { status: 422 });
    }

    const rateLimit = await getRateLimiter().limit(`song-comment:${viewer.id}`);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many comments. Try again in a minute', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const db = await getDb();
    const [existingSong] = await db.select({ id: song.id }).from(song).where(eq(song.id, songId)).limit(1);
    if (!existingSong) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    const fiveSecondsAgo = new Date(Date.now() - 5_000);
    const [recentComment] = await db
      .select({ id: songComment.id })
      .from(songComment)
      .where(and(eq(songComment.userId, viewer.id), gte(songComment.createdAt, fiveSecondsAgo)))
      .limit(1);
    if (recentComment) {
      return NextResponse.json({ success: false, error: 'Give the comment section a moment' }, { status: 429 });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1_000);
    const [duplicateComment] = await db
      .select({ id: songComment.id })
      .from(songComment)
      .where(
        and(
          eq(songComment.userId, viewer.id),
          eq(songComment.content, moderation.content),
          gte(songComment.createdAt, oneDayAgo)
        )
      )
      .limit(1);
    if (duplicateComment) {
      return NextResponse.json(
        { success: false, error: 'You already posted this comment', code: 'DUPLICATE_COMMENT' },
        { status: 409 }
      );
    }

    const id = randomUUID();
    const [created] = await db
      .insert(songComment)
      .values({
        id,
        songId,
        userId: viewer.id,
        content: moderation.content,
      })
      .returning({ createdAt: songComment.createdAt });

    return NextResponse.json(
      {
        success: true,
        data: {
          comment: {
            id,
            content: moderation.content,
            createdAt: (created?.createdAt || new Date()).toISOString(),
            author: {
              id: viewer.id,
              name: viewer.name || 'ScoopRYM listener',
              image: viewer.image || null,
            },
            canDelete: true,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('create song comment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to post comment' }, { status: 500 });
  }
}
