import { getDb } from '@/db/index';
import { song, songPlay } from '@/db/schema';
import { getSession } from '@/lib/server';
import { and, desc, eq, isNull, notInArray, or, sql } from 'drizzle-orm';
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

    // Get total count of unique recently played songs for this user
    const [totalRes] = await db
      .select({ count: sql<number>`count(distinct ${songPlay.songId})` })
      .from(songPlay)
      .innerJoin(song, eq(songPlay.songId, song.id))
      .where(
        and(
          eq(songPlay.userId, userId),
          or(
            isNull(song.processingStatus),
            notInArray(song.processingStatus, ['failed_generation', 'processing_queue_failed', 'failed_audio_upload', 'failed_internal_error', 'failed_credit_deduction'])
          )
        )
      );
    const total = Number(totalRes?.count || 0);

    // Get the most recent play for each song, ordered by the latest play
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
        prompt: song.prompt,
        sourceText: song.sourceText,
        sourceUrl: song.sourceUrl,
        newsSummary: song.newsSummary,
        lastPlayedAt: sql<string>`max(${songPlay.createdAt})`,
      })
      .from(songPlay)
      .innerJoin(song, eq(songPlay.songId, song.id))
      .where(
        and(
          eq(songPlay.userId, userId),
          or(
            isNull(song.processingStatus),
            notInArray(song.processingStatus, ['failed_generation', 'processing_queue_failed', 'failed_audio_upload', 'failed_internal_error', 'failed_credit_deduction'])
          )
        )
      )
      .groupBy(song.id)
      .orderBy(desc(sql`lastPlayedAt`))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: recentSongs,
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
