import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { song, songPlay } from '@/db/schema';
import { getSession } from '@/lib/server';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await getSession();
    const userId = session?.user?.id;

    // 记录单次播放到播放历史表 (Only if user is logged in)
    const db = await getDb();
    if (userId) {
      await db.insert(songPlay).values({
        id: randomUUID(),
        userId,
        songId: id,
      });
    }

    // 同时累加歌曲总播放次数
    const [updated] = await db
      .update(song)
      .set({ plays: sql`${song.plays} + 1` })
      .where(eq(song.id, id))
      .returning({ id: song.id, plays: song.plays });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('increment song plays error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to update song plays',
      },
      { status: 500 }
    );
  }
}
