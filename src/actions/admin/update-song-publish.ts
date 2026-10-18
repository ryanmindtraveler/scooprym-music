'use server';

import { revalidatePublicSongs } from '@/lib/songs/revalidate-public-songs';

import { getDb } from '@/db';
import { song, songCreationRun } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { auth } from '@/lib/auth/auth';
import { recordPublicationWorkflow } from '@/lib/creation/song-creation-workflow';
import { getSongIndexNowPaths, notifyIndexNow } from '@/lib/seo/indexnow';
import { songPublicationPlacementSchema } from '@/lib/songs/publication-channel';
import { SongPublicationError, setSongPublication, setSongPublicationPlacement } from '@/lib/songs/publication-service';
import { Routes } from '@/routes';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

async function hasPassedProductCheck(songId: string) {
  const db = await getDb();
  const [run] = await db
    .select({ currentStage: songCreationRun.currentStage })
    .from(songCreationRun)
    .where(eq(songCreationRun.songId, songId))
    .orderBy(desc(songCreationRun.createdAt))
    .limit(1);
  // 旧歌曲没有创作运行记录，继续沿用 generation_attempt 的兼容门禁。
  return !run || ['publish_ready', 'published'].includes(run.currentStage);
}

export async function updateSongPublishAction(songId: string, isPublished: boolean) {
  if (typeof songId !== 'string' || !songId || typeof isPublished !== 'boolean')
    return { success: false, error: 'Invalid publication request' };
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

    const changed = await db.transaction((tx) => setSongPublication(tx, songId, isPublished));
    if (!changed) return { success: true };

    await recordPublicationWorkflow(songId, isPublished ? 'published' : 'publish_ready', {
      action: isPublished ? 'published' : 'unpublished',
      administratorId: session.user.id,
    }).catch((error) => console.error('Unable to record publication workflow:', error));

    // Revalidate paths to reflect changes immediately
    revalidatePath(Routes.AdminSongs);
    revalidatePath(Routes.Dashboard);
    revalidatePublicSongs();
    await notifyIndexNow(getSongIndexNowPaths([songId], { [songId]: changed.seoSlug }));

    return {
      success: true,
    };
  } catch (error) {
    console.error('updateSongPublishAction error:', error);
    return {
      success: false,
      error: error instanceof SongPublicationError ? error.message : 'Failed to update publication status',
    };
  }
}

export async function updateSongPlacementAction(songId: string, input: unknown) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== 'admin') return { success: false, error: 'Unauthorized' };
    const parsed = songPublicationPlacementSchema.safeParse(input);
    if (typeof songId !== 'string' || !songId || !parsed.success)
      return { success: false, error: 'Choose a valid publication channel and collection' };
    const db = getDb();
    const changed = await db.transaction((tx) => setSongPublicationPlacement(tx, songId, parsed.data));
    if (changed) {
      revalidatePath(Routes.AdminSongs);
      revalidatePublicSongs();
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof SongPublicationError ? error.message : 'Failed to save publication placement',
    };
  }
}

export async function scheduleSongPublishAction(songId: string, scheduledAtValue: string | null) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const db = await getDb();
    if (!scheduledAtValue) {
      await db.update(song).set({ scheduledAt: null, updatedAt: new Date() }).where(eq(song.id, songId));
      await recordPublicationWorkflow(songId, 'publish_ready', {
        action: 'schedule_cancelled',
        administratorId: session.user.id,
      }).catch((error) => console.error('Unable to record publication workflow:', error));
      revalidatePath(Routes.AdminSongs);
      return { success: true };
    }

    const scheduledAt = new Date(scheduledAtValue);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      return { success: false, error: 'Choose a future publish time' };
    }

    const latestAttempt = createLatestGenerationAttemptQuery(db);
    const [readySong] = await db
      .select({ id: song.id, processingStatus: latestAttempt.processingStatus })
      .from(song)
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(eq(song.id, songId))
      .limit(1);

    if (!readySong || !['completed', 'completed_without_cover'].includes(readySong.processingStatus || '')) {
      return { success: false, error: 'Only completed songs can be scheduled' };
    }
    if (!(await hasPassedProductCheck(songId))) {
      return { success: false, error: 'The song must pass the product check before scheduling' };
    }

    const [previous] = await db
      .select({ isPublished: song.isPublished })
      .from(song)
      .where(eq(song.id, songId))
      .limit(1);

    const changed = await db
      .update(song)
      .set({ isPublished: false, publishedAt: null, scheduledAt, updatedAt: new Date() })
      .where(eq(song.id, songId))
      .returning({ id: song.id, seoSlug: song.seoSlug });
    await recordPublicationWorkflow(songId, 'publish_ready', {
      action: 'scheduled',
      scheduledAt: scheduledAt.toISOString(),
      administratorId: session.user.id,
    }).catch((error) => console.error('Unable to record publication workflow:', error));
    revalidatePath(Routes.AdminSongs);
    revalidatePath(Routes.AdminDashboard);
    revalidatePublicSongs();
    if (previous?.isPublished && changed.length > 0) {
      await notifyIndexNow(getSongIndexNowPaths([songId], { [songId]: changed[0].seoSlug }));
    }
    return { success: true };
  } catch (error) {
    console.error('scheduleSongPublishAction error:', error);
    return { success: false, error: 'Failed to schedule publication' };
  }
}
