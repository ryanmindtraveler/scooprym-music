import { getDb } from '@/db/index';
import { generationAttempt, song, story } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { buildStoryBrief } from '@/features/full-songs/services/full-songs-helpers';
import { getSession } from '@/lib/auth/server';
import { getSongSourceCompatFields, getSongSourceSummary } from '@/lib/songs/song-source';
import { deleteFile } from '@/storage';
import { and, eq, sql } from 'drizzle-orm';
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
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const [row] = await db
      .select({
        song,
        sourceText: story.sourceText,
        sourceUrl: story.sourceUrl,
        newsSummary: story.newsSummary,
        prompt: latestAttempt.prompt,
        processingStatus: latestAttempt.processingStatus,
      })
      .from(song)
      .innerJoin(story, eq(story.id, song.storyId))
      .leftJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(song.id, id), session.user.role === 'admin' ? undefined : eq(song.userId, userId)));

    if (!row) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const sourceSummary = getSongSourceSummary({ sourceSummary: row.newsSummary }) || '';

    return NextResponse.json({
      success: true,
      data: {
        ...row.song,
        prompt: row.prompt,
        processingStatus: row.processingStatus,
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
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const [row] = await db
      .select({
        id: song.id,
        audioKey: song.audioKey,
        coverImageKey: song.coverImageKey,
        processingStatus: latestAttempt.processingStatus,
      })
      .from(song)
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(and(eq(song.id, id), eq(song.userId, userId)));
    if (!row) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const activeStatuses = ['queued', 'processing', 'audio_uploaded'];
    if (activeStatuses.includes(row.processingStatus || '')) {
      return NextResponse.json(
        { success: false, error: 'A song cannot be deleted while generation is still in progress' },
        { status: 409 }
      );
    }

    const [deleted] = await db
      .delete(song)
      .where(
        and(
          eq(song.id, id),
          eq(song.userId, userId),
          sql`not exists (
            select 1
            from ${generationAttempt}
            where ${generationAttempt.songId} = ${song.id}
              and ${generationAttempt.processingStatus} in ('queued', 'processing', 'audio_uploaded')
          )`
        )
      )
      .returning({ audioKey: song.audioKey, coverImageKey: song.coverImageKey });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Song state changed; wait for generation to finish and try again' },
        { status: 409 }
      );
    }

    const storageKeys = [deleted.audioKey, deleted.coverImageKey].filter((key): key is string => !!key);
    const cleanupResults = await Promise.allSettled(storageKeys.map((key) => deleteFile(key)));
    cleanupResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`delete song storage cleanup failed for ${storageKeys[index]}`, result.reason);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('delete song error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete song' }, { status: 500 });
  }
}
