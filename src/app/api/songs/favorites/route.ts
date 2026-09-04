import { getDb } from '@/db';
import { song, songFavorite, story } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { getSession } from '@/lib/server';
import { getSongSourceCompatFields } from '@/lib/song-source';
import { SONG_FAILURE_PROCESSING_STATUSES } from '@/lib/song-status';
import { and, desc, eq, notInArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '9'));
    const offset = (page - 1) * limit;

    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(songFavorite)
      .innerJoin(song, eq(songFavorite.songId, song.id))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(
          eq(songFavorite.userId, userId),
          notInArray(latestAttempt.processingStatus, SONG_FAILURE_PROCESSING_STATUSES)
        )
      );
    const total = Number(totalRes?.count || 0);

    const favorites = await db
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
        favoriteCreatedAt: songFavorite.createdAt,
      })
      .from(songFavorite)
      .innerJoin(song, eq(songFavorite.songId, song.id))
      .innerJoin(story, eq(story.id, song.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(
          eq(songFavorite.userId, userId),
          notInArray(latestAttempt.processingStatus, SONG_FAILURE_PROCESSING_STATUSES)
        )
      )
      .orderBy(desc(songFavorite.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: favorites.map((item) => ({
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
    console.error('load favorites error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to load favorites',
      },
      { status: 500 }
    );
  }
}
