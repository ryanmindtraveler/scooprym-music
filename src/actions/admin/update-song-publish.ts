'use server';

import { getDb } from '@/db';
import { song } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function updateSongPublishAction(songId: string, isPublished: boolean) {
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

    await db.update(song).set({ isPublished }).where(eq(song.id, songId));

    // Revalidate paths to reflect changes immediately
    revalidatePath('/admin/songs');
    revalidatePath('/home');

    return {
      success: true,
    };
  } catch (error) {
    console.error('updateSongPublishAction error:', error);
    return {
      success: false,
      error: 'Failed to update publication status',
    };
  }
}
