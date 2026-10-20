import type { getDb } from '@/db';
import { generationAttempt, song, songCreationRun, story } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { inspectSongProduct } from '@/lib/creation/song-product-check';
import { and, desc, eq } from 'drizzle-orm';
import { songPublicationPlacementSchema } from './publication-channel';

type PublicationDb = ReturnType<typeof getDb>;
type PublicationTx = Parameters<Parameters<PublicationDb['transaction']>[0]>[0];
export class SongPublicationError extends Error {}

/**
 * 校验并自愈歌曲发布门禁。
 * 如果歌曲资产完整有效，自动修复历史生成记录与工作流运行阶段；若资产存在缺陷，抛出具体原因。
 */
export async function assertSongReadyForPublication(
  tx: PublicationTx,
  songId: string,
  current: typeof song.$inferSelect,
  now = new Date()
) {
  if (!current.audioUrl || !/^https?:\/\//i.test(current.audioUrl)) {
    throw new SongPublicationError('Only completed songs with playable audio can be published');
  }

  const latestAttempt = createLatestGenerationAttemptQuery(tx);
  const [ready] = await tx
    .select({ attemptId: latestAttempt.id, status: latestAttempt.processingStatus })
    .from(song)
    .leftJoin(story, eq(story.id, song.storyId))
    .leftJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
    .where(eq(song.id, songId));

  const [run] = await tx
    .select({ id: songCreationRun.id, stage: songCreationRun.currentStage })
    .from(songCreationRun)
    .where(eq(songCreationRun.songId, songId))
    .orderBy(desc(songCreationRun.createdAt))
    .limit(1);

  const isAttemptReady = ready && ['completed', 'completed_without_cover'].includes(ready.status || '');
  const isRunReady = !run || ['publish_ready', 'published'].includes(run.stage);

  if (!isAttemptReady || !isRunReady) {
    const [storyRow] = current.storyId
      ? await tx
          .select({
            sourceUrl: story.sourceUrl,
            sourceText: story.sourceText,
            newsSummary: story.newsSummary,
          })
          .from(story)
          .where(eq(story.id, current.storyId))
          .limit(1)
      : [null];

    const check = inspectSongProduct({
      title: current.title,
      lyrics: current.lyrics,
      audioUrl: current.audioUrl,
      audioKey: current.audioKey,
      coverImageUrl: current.coverImageUrl,
      coverImageKey: current.coverImageKey,
      durationSec: current.durationSec,
      sourceUrl: storyRow?.sourceUrl,
      sourceText: storyRow?.sourceText,
      sourceSummary: storyRow?.newsSummary,
    });

    if (!check.passed) {
      throw new SongPublicationError(`Product check failed: ${check.issues.join('; ')}`);
    }

    if (ready?.attemptId && !isAttemptReady) {
      await tx
        .update(generationAttempt)
        .set({
          processingStatus: 'completed',
          processingError: null,
          updatedAt: now,
        })
        .where(eq(generationAttempt.id, ready.attemptId));
    }

    if (run && !isRunReady) {
      await tx
        .update(songCreationRun)
        .set({
          status: 'completed',
          currentStage: 'publish_ready',
          lastError: null,
          updatedAt: now,
          completedAt: now,
        })
        .where(eq(songCreationRun.id, run.id));
    }
  }
}

/** 后台和定向恢复共用发布门禁；调用者负责管理员认证与公开页面失效。 */
export async function setSongPublication(tx: PublicationTx, songId: string, isPublished: boolean, now = new Date()) {
  const [current] = await tx.select().from(song).where(eq(song.id, songId)).for('update');
  if (!current) throw new SongPublicationError('Song not found');
  if (!songPublicationPlacementSchema.safeParse(current).success)
    throw new SongPublicationError('Choose a valid publication channel and collection');
  if (isPublished) {
    await assertSongReadyForPublication(tx, songId, current, now);
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
