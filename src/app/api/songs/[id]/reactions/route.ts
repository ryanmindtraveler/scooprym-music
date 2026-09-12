import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { song, songReaction } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import {
  SONG_REACTION_ACTOR_COOKIE,
  createAnonymousReactionId,
  getSongReactionActorKey,
  isValidAnonymousReactionId,
} from '@/lib/songs/song-reaction-actor';
import { type SongReactionType, createSongReactionCounts, isSongReactionType } from '@/lib/songs/song-reactions';
import { and, count, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface ReactionRequestBody {
  reaction?: SongReactionType | null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: songId } = await params;
    const body = (await request.json().catch(() => null)) as ReactionRequestBody | null;

    if (!body || (body.reaction !== null && !isSongReactionType(body.reaction))) {
      return NextResponse.json({ success: false, error: 'Invalid reaction' }, { status: 400 });
    }
    const requestedReaction = body.reaction as SongReactionType | null;

    const session = await getSession();
    const userId = session?.user?.id;
    const anonymousCookieValue = request.cookies.get(SONG_REACTION_ACTOR_COOKIE)?.value;
    const existingAnonymousId = isValidAnonymousReactionId(anonymousCookieValue) ? anonymousCookieValue : undefined;
    const anonymousId = userId ? existingAnonymousId : existingAnonymousId || createAnonymousReactionId();
    const actorKey = getSongReactionActorKey(userId, anonymousId);

    if (!actorKey) {
      return NextResponse.json({ success: false, error: 'Unable to identify participant' }, { status: 400 });
    }

    const db = await getDb();
    const [existingSong] = await db
      .select({ id: song.id })
      .from(song)
      .where(and(eq(song.id, songId), eq(song.isPublished, true)))
      .limit(1);

    if (!existingSong) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    const counts = await db.transaction(async (tx) => {
      // 登录后首次互动时清理同一浏览器留下的匿名选择，避免重复计数。
      if (userId && existingAnonymousId) {
        await tx
          .delete(songReaction)
          .where(
            and(
              eq(songReaction.songId, songId),
              eq(songReaction.actorKey, getSongReactionActorKey(null, existingAnonymousId)!)
            )
          );
      }

      if (requestedReaction === null) {
        await tx.delete(songReaction).where(and(eq(songReaction.songId, songId), eq(songReaction.actorKey, actorKey)));
      } else {
        await tx
          .insert(songReaction)
          .values({
            id: randomUUID(),
            songId,
            actorKey,
            reactionType: requestedReaction,
          })
          .onConflictDoUpdate({
            target: [songReaction.songId, songReaction.actorKey],
            set: {
              reactionType: requestedReaction,
              updatedAt: new Date(),
            },
          });
      }

      const rows = await tx
        .select({
          reactionType: songReaction.reactionType,
          count: count(),
        })
        .from(songReaction)
        .where(eq(songReaction.songId, songId))
        .groupBy(songReaction.reactionType);

      return createSongReactionCounts(rows);
    });

    const response = NextResponse.json({
      success: true,
      data: {
        counts,
        selectedReaction: requestedReaction,
      },
    });

    if (!userId && !existingAnonymousId && anonymousId) {
      response.cookies.set(SONG_REACTION_ACTOR_COOKIE, anonymousId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error: unknown) {
    console.error('update song reaction error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update reaction' }, { status: 500 });
  }
}
