import { getDb } from '@/db/index';
import { song as songTable } from '@/db/schema';
import { getSession } from '@/lib/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const adminSongs = await db
      .select()
      .from(songTable)
      .where(eq(songTable.isAdminGenerated, true))
      .orderBy(desc(songTable.createdAt))
      .limit(8);

    const serializedSongs = adminSongs.map((song) => ({
      id: song.id,
      title: song.title,
      audioUrl: song.audioUrl,
      coverImageUrl: song.coverImageUrl,
      createdAt: song.createdAt ? song.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: song.updatedAt ? song.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      songs: serializedSongs,
    });
  } catch (error: any) {
    console.error('Error fetching admin songs:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch songs' }, { status: 500 });
  }
}
