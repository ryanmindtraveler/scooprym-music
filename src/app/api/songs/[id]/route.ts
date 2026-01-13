import { getDb } from '@/db/index';
import { song } from '@/db/schema';
import { getSession } from '@/lib/server';
import { deleteFile } from '@/storage';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// GET: Fetch song details
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = await getDb();
    const [row] = await db
      .select()
      .from(song)
      .where(and(eq(song.id, id), eq(song.userId, userId)));

    if (!row) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: row });
  } catch (error: any) {
    console.error('get song error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch song' }, { status: 500 });
  }
}

// DELETE: Remove song
export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = await getDb();
    const [row] = await db
      .select()
      .from(song)
      .where(and(eq(song.id, id), eq(song.userId, userId)));
    if (!row) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (row.audioKey) {
      try {
        await deleteFile(row.audioKey);
      } catch (e) {
        // log but continue to delete db row
        console.error('delete audio error', e);
      }
    }

    await db.delete(song).where(and(eq(song.id, id), eq(song.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete song' }, { status: 500 });
  }
}
