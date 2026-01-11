import { getDb } from '@/db/index';
import { song } from '@/db/schema';
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

    // Get total count
    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(song)
      .where(
        and(
          eq(song.userId, userId),
          or(
            isNull(song.processingStatus),
            notInArray(song.processingStatus, [
              'failed_generation',
              'processing_queue_failed',
              'failed_audio_upload',
              'failed_internal_error',
              'failed_credit_deduction',
            ])
          )
        )
      );
    const total = Number(totalRes?.count || 0);

    const rows = await db
      .select()
      .from(song)
      .where(
        and(
          eq(song.userId, userId),
          or(
            isNull(song.processingStatus),
            notInArray(song.processingStatus, [
              'failed_generation',
              'processing_queue_failed',
              'failed_audio_upload',
              'failed_internal_error',
              'failed_credit_deduction',
            ])
          )
        )
      )
      .orderBy(desc(song.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({ ...r, category: 'News' })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load songs' }, { status: 500 });
  }
}
