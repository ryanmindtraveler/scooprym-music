import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { songFavorite } from '@/db/schema';
import { getSession } from '@/lib/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    const [existing] = await db
      .select()
      .from(songFavorite)
      .where(and(eq(songFavorite.userId, userId), eq(songFavorite.songId, id)))
      .limit(1);

    if (existing) {
      await db.delete(songFavorite).where(and(eq(songFavorite.userId, userId), eq(songFavorite.songId, id)));

      return NextResponse.json({
        success: true,
        data: { isFavorite: false },
      });
    }

    await db.insert(songFavorite).values({
      id: randomUUID(),
      userId,
      songId: id,
      // createdAt will default to now()
    });

    return NextResponse.json({
      success: true,
      data: { isFavorite: true },
    });
  } catch (error: any) {
    console.error('toggle favorite error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to toggle favorite',
      },
      { status: 500 }
    );
  }
}
