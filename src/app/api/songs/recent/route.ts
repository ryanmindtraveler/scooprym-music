import { getDb } from '@/db/index';
import { song, songPlay, story } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSession } from '@/lib/server';
import { getSongSourceCompatFields } from '@/lib/song-source';
import { SONG_FAILURE_PROCESSING_STATUSES } from '@/lib/song-status';
import { and, desc, eq, notInArray, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '9'));
    const offset = (page - 1) * limit;

    const db = await getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const lastPlayedAtExpr = sql<string>`max(${songPlay.createdAt})`;

    const [totalRes] = await db
      .select({ count: sql<number>`count(distinct ${songPlay.songId})` })
      .from(songPlay)
      .innerJoin(song, eq(songPlay.songId, song.id))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(eq(songPlay.userId, userId), notInArray(latestAttempt.processingStatus, SONG_FAILURE_PROCESSING_STATUSES))
      );
    const total = Number(totalRes?.count || 0);

    const recentSongs = await db
      .select({
        id: song.id,
        title: song.title,
        createdAt: song.createdAt,
        durationSec: song.durationSec,
        plays: song.plays,
        audioUrl: song.audioUrl,
        category: sql<string>`'News'`,
        coverImageUrl: song.coverImageUrl,
        lyrics: song.lyrics,
        prompt: latestAttempt.prompt,
        sourceText: story.sourceText,
        sourceUrl: story.sourceUrl,
        sourceSummary: story.newsSummary,
        newsSummary: story.newsSummary,
        lastPlayedAt: lastPlayedAtExpr,
      })
      .from(songPlay)
      .innerJoin(song, eq(songPlay.songId, song.id))
      .innerJoin(story, eq(story.id, song.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(eq(songPlay.userId, userId), notInArray(latestAttempt.processingStatus, SONG_FAILURE_PROCESSING_STATUSES))
      )
      .groupBy(song.id, story.id, latestAttempt.prompt)
      .orderBy(desc(lastPlayedAtExpr))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: recentSongs.map((item) => ({
        ...item,
        ...getSongSourceCompatFields(item),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('load recent songs error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load recent songs' },
      { status: 500 }
    );
  }
}
