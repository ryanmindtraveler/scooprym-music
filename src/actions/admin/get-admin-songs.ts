'use server';

import { getDb } from '@/db';
import { song as songTable, story as storyTable, user as userTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { auth } from '@/lib/auth/auth';
import type { SortingState } from '@tanstack/react-table';
import { type AnyColumn, type SQL, and, asc, count, desc, eq, ilike, isNotNull, isNull, or } from 'drizzle-orm';

interface GetAdminSongsParams {
  pageIndex: number;
  pageSize: number;
  search?: string;
  sorting?: SortingState;
  status?: 'all' | 'published' | 'scheduled' | 'unpublished';
}

export async function getAdminSongsAction({
  pageIndex,
  pageSize,
  search,
  sorting,
  status = 'all',
}: GetAdminSongsParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const db = await getDb();
    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const offset = pageIndex * pageSize;

    // Conditions: Admin users only for now (as per requirement to publish admin songs)
    const whereConditions: (SQL<unknown> | undefined)[] = [eq(userTable.role, 'admin')];

    // Filter by status
    if (status === 'published') {
      whereConditions.push(eq(songTable.isPublished, true));
    } else if (status === 'scheduled') {
      whereConditions.push(
        and(or(eq(songTable.isPublished, false), isNull(songTable.isPublished)), isNotNull(songTable.scheduledAt))
      );
    } else if (status === 'unpublished') {
      whereConditions.push(
        and(or(eq(songTable.isPublished, false), isNull(songTable.isPublished)), isNull(songTable.scheduledAt))
      );
    }

    if (search) {
      whereConditions.push(or(ilike(songTable.title, `%${search}%`), ilike(latestAttempt.prompt, `%${search}%`)));
    }

    // Dynamic sorting
    let orderBy = desc(songTable.createdAt);
    if (sorting && sorting.length > 0) {
      const { id, desc: isDesc } = sorting[0];
      const column = songTable[id as keyof typeof songTable];
      if (column) {
        orderBy = isDesc ? desc(column as AnyColumn) : asc(column as AnyColumn);
      }
    }

    // Transaction for total count + items to ensure consistency
    const data = await db.transaction(async (tx) => {
      const totalResult = await tx
        .select({ count: count() })
        .from(songTable)
        .innerJoin(userTable, eq(songTable.userId, userTable.id))
        .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
        .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
        .where(and(...whereConditions));

      const items = await tx
        .select({
          id: songTable.id,
          seoSlug: songTable.seoSlug,
          title: songTable.title,
          createdAt: songTable.createdAt,
          audioUrl: songTable.audioUrl,
          coverImageUrl: songTable.coverImageUrl,
          isPublished: songTable.isPublished,
          scheduledAt: songTable.scheduledAt,
          publishedAt: songTable.publishedAt,
          plays: songTable.plays,
          durationSec: songTable.durationSec,
          lyrics: songTable.lyrics,
          prompt: latestAttempt.prompt,
          newsSummary: storyTable.newsSummary,
          sourceText: storyTable.sourceText,
          sourceUrl: storyTable.sourceUrl,
          authorName: userTable.name, // Join to get author name
        })
        .from(songTable)
        .innerJoin(userTable, eq(songTable.userId, userTable.id))
        .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
        .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
        .where(and(...whereConditions))
        .limit(pageSize)
        .offset(offset)
        .orderBy(orderBy);

      return {
        total: totalResult[0].count,
        items,
      };
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('getAdminSongsAction error:', error);
    return {
      success: false,
      error: 'Failed to fetch songs',
    };
  }
}

// Helper for headers (needed for auth.api.getSession in server action)
import { headers } from 'next/headers';
