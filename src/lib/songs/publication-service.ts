import type { getDb } from '@/db';
import { song, songCreationRun, story } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { and, desc, eq } from 'drizzle-orm';
import { songPublicationPlacementSchema } from './publication-channel';

type PublicationDb = ReturnType<typeof getDb>;
type PublicationTx = Parameters<Parameters<PublicationDb['transaction']>[0]>[0];
export class SongPublicationError extends Error {}

/** 后台和定向恢复共用发布门禁；调用者负责管理员认证与公开页面失效。 */
export async function setSongPublication(tx: PublicationTx, songId: string, isPublished: boolean, now = new Date()) {
  const [current] = await tx.select().from(song).where(eq(song.id, songId)).for('update');
  if (!current) throw new SongPublicationError('Song not found');
  if (!songPublicationPlacementSchema.safeParse(current).success)
    throw new SongPublicationError('Choose a valid publication channel and collection');
  if (isPublished) {
    const latestAttempt = createLatestGenerationAttemptQuery(tx);
    const [ready] = await tx
      .select({ status: latestAttempt.processingStatus })
      .from(song)
      .innerJoin(story, eq(story.id, song.storyId))
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(eq(song.id, songId));
    if (
      !ready ||
      !['completed', 'completed_without_cover'].includes(ready.status || '') ||
      !/^https?:\/\//i.test(current.audioUrl)
    ) {
      throw new SongPublicationError('Only completed songs with playable audio can be published');
    }
    const [run] = await tx
      .select({ stage: songCreationRun.currentStage })
      .from(songCreationRun)
      .where(eq(songCreationRun.songId, songId))
      .orderBy(desc(songCreationRun.createdAt))
      .limit(1);
    if (run && !['publish_ready', 'published'].includes(run.stage))
      throw new SongPublicationError('The song must pass the product check before publication');
  }
  if (!!current.isPublished === isPublished) return null;
  const [changed] = await tx
    .update(song)
    .set({
      isPublished,
      publishedAt: isPublished ? now : null,
      scheduledAt: null,
      updatedAt: now,
    })
    .where(eq(song.id, songId))
    .returning({ id: song.id, seoSlug: song.seoSlug });
  return changed;
}

/** 更换栏目不改变公开状态、发布时间、原歌词或音频，正在公开的作品也可直接换栏目。 */
export async function setSongPublicationPlacement(tx: PublicationTx, songId: string, input: unknown, now = new Date()) {
  const placement = songPublicationPlacementSchema.parse(input);
  const [current] = await tx.select().from(song).where(eq(song.id, songId)).for('update');
  if (!current) throw new SongPublicationError('Song not found');
  if (current.publicationChannel === placement.publicationChannel && current.loreTopicSlug === placement.loreTopicSlug)
    return null;
  const [changed] = await tx
    .update(song)
    .set({ ...placement, updatedAt: now })
    .where(eq(song.id, songId))
    .returning({ id: song.id, seoSlug: song.seoSlug });
  return changed;
}
