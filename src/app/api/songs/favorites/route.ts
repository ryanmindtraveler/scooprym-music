import { getDb } from '@/db';
import { song, songFavorite } from '@/db/schema';
import { getSession } from '@/lib/server';
import { and, desc, eq, isNull, notInArray, or, sql } from 'drizzle-orm';
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

    // Get total count
    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(songFavorite)
      .innerJoin(song, eq(songFavorite.songId, song.id))
      .where(
        and(
          eq(songFavorite.userId, userId),
          or(
            isNull(song.processingStatus),
            notInArray(song.processingStatus, ['failed_generation', 'processing_queue_failed', 'failed_audio_upload', 'failed_internal_error', 'failed_credit_deduction'])
          )
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
        prompt: song.prompt,
        sourceText: song.sourceText,
        sourceUrl: song.sourceUrl,
        newsSummary: song.newsSummary,
        favoriteCreatedAt: songFavorite.createdAt,
      })
      .from(songFavorite)
      .innerJoin(song, eq(songFavorite.songId, song.id))
      .where(
        and(
          eq(songFavorite.userId, userId),
          or(
            isNull(song.processingStatus),
            notInArray(song.processingStatus, ['failed_generation', 'processing_queue_failed', 'failed_audio_upload', 'failed_internal_error', 'failed_credit_deduction'])
          )
        )
      )
      .orderBy(desc(songFavorite.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: favorites,
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
