import { getDb } from '@/db/index';
import { song } from '@/db/schema';
import { buildStoryBrief } from '@/features/full-songs/services/full-songs-helpers';
import { getSession } from '@/lib/server';
import { getSongSourceCompatFields, getSongSourceSummary } from '@/lib/song-source';
import { deleteFile } from '@/storage';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

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
    const [row] = await db.select().from(song).where(and(eq(song.id, id), eq(song.userId, userId)));

    if (!row) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const sourceSummary = getSongSourceSummary({ sourceSummary: row.newsSummary }) || '';

    return NextResponse.json({
      success: true,
      data: {
        ...row,
        ...getSongSourceCompatFields({
          sourceSummary: row.newsSummary,
          sourceText: row.sourceText,
          sourceUrl: row.sourceUrl,
        }),
        storyBrief: buildStoryBrief(sourceSummary, ''),
      },
    });
  } catch (error: any) {
    console.error('get song error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch song' }, { status: 500 });
  }
}

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
    const [row] = await db.select().from(song).where(and(eq(song.id, id), eq(song.userId, userId)));
    if (!row) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (row.audioKey) {
      try {
        await deleteFile(row.audioKey);
      } catch (e) {
        console.error('delete audio error', e);
      }
    }

    await db.delete(song).where(and(eq(song.id, id), eq(song.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete song' }, { status: 500 });
  }
}
