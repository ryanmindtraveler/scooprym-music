import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { song, songEngagementEvent } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import {
  SONG_REACTION_ACTOR_COOKIE,
  createAnonymousReactionId,
  getSongReactionActorKey,
  isValidAnonymousReactionId,
} from '@/lib/songs/song-reaction-actor';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const engagementEventSchema = z.object({
  eventType: z.enum(['detail_view', 'play_start', 'play_qualified', 'play_complete', 'share']),
  eventSessionId: z.string().trim().min(8).max(100),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: songId } = await params;
    const parsed = engagementEventSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid engagement event' }, { status: 400 });
    }

    const session = await getSession();
    const userId = session?.user?.id || null;
    const anonymousCookieValue = request.cookies.get(SONG_REACTION_ACTOR_COOKIE)?.value;
    const existingAnonymousId = isValidAnonymousReactionId(anonymousCookieValue) ? anonymousCookieValue : undefined;
    const anonymousId = userId ? existingAnonymousId : existingAnonymousId || createAnonymousReactionId();
    const actorKey = getSongReactionActorKey(userId, anonymousId);
    if (!actorKey) {
      return NextResponse.json({ success: false, error: 'Unable to identify listener' }, { status: 400 });
    }

    const db = await getDb();
    const [existingSong] = await db.select({ id: song.id }).from(song).where(eq(song.id, songId)).limit(1);
    if (!existingSong) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    await db
      .insert(songEngagementEvent)
      .values({
        id: randomUUID(),
        songId,
        userId,
        actorKey,
        eventSessionId: parsed.data.eventSessionId,
        eventType: parsed.data.eventType,
      })
      .onConflictDoNothing();

    const response = NextResponse.json({ success: true });
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
  } catch (error) {
    console.error('record song engagement error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record engagement' }, { status: 500 });
  }
}
