import { randomUUID } from 'crypto';
import { isMusicGenerationConfigured } from '@/ai/music/lib/generation';
import { buildFallbackMusicProductionPrompt, finalizeMusicProductionPrompt } from '@/ai/music/lib/prompt';
import { getDb } from '@/db/index';
import {
  generationAttempt,
  songCreationRun,
  songCreationStep,
  song as songTable,
  story as storyTable,
} from '@/db/schema';
import { dispatchMusicJob, markMusicQueueFailure } from '@/lib/creation/song-job-dispatch';
import { inspectSongLyrics } from '@/lib/creation/song-product-check';
import {
  type MusicGenerationRequest,
  createMusicRequestFingerprint,
  musicGenerationRequestSchema,
  prepareMiniMaxLyricsForGeneration,
} from '@/lib/creation/song-workflow';
import { mapGenerationError } from '@/lib/music/error-handler';
import { buildDynamicProductionRecipe, formatDynamicProductionRecipe } from '@/lib/music/production-recipe';
import {
  allocateSongSeoSlug,
  buildSongSeoTopic,
  getSongCanonicalSlug,
  getSongSeoSlugBase,
  getSongStoredSlug,
} from '@/lib/songs/song-seo';
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

type ExistingJob = {
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
  coverImageUrl: string | null;
  processingStatus: string | null;
  generationRequestHash: string | null;
};

function getWorkflowSafetyDecision(workshop: unknown) {
  if (!workshop || typeof workshop !== 'object') return undefined;
  const safety = (workshop as { safety?: unknown }).safety;
  if (!safety || typeof safety !== 'object') return undefined;
  const decision = (safety as { decision?: unknown }).decision;
  return decision === 'allow' || decision === 'review' || decision === 'block' ? decision : undefined;
}

function jobResponse(job: ExistingJob, idempotent: boolean, executionMode?: string) {
  return NextResponse.json(
    {
      success: true,
      audio: job.audioUrl || '',
      song: {
        id: job.id,
        title: job.title,
        audioUrl: job.audioUrl || null,
        coverImageUrl: job.coverImageUrl,
        processingStatus: job.processingStatus || 'queued',
      },
      meta: {
        songId: job.id,
        idempotent,
        executionMode,
        info: idempotent ? 'Existing generation job returned.' : 'Generation job queued.',
      },
    },
    { status: idempotent ? 200 : 202 }
  );
}

async function findJob(songId: string) {
  const db = await getDb();
  const [savedSong] = await db
    .select({
      id: songTable.id,
      userId: songTable.userId,
      title: songTable.title,
      audioUrl: songTable.audioUrl,
      coverImageUrl: songTable.coverImageUrl,
    })
    .from(songTable)
    .where(eq(songTable.id, songId))
    .limit(1);
  if (!savedSong) return undefined;

  const [attempt] = await db
    .select({
      processingStatus: generationAttempt.processingStatus,
      generationRequestHash: generationAttempt.generationRequestHash,
    })
    .from(generationAttempt)
    .where(eq(generationAttempt.songId, songId))
    .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
    .limit(1);

  return {
    ...savedSong,
    processingStatus: attempt?.processingStatus || null,
    generationRequestHash: attempt?.generationRequestHash || null,
  };
}

function sameIdempotentRequest(job: ExistingJob, userId: string, requestHash: string) {
  return job.userId === userId && job.generationRequestHash === requestHash;
}

async function enhanceProductionPrompt(
  direction: string,
  production: string,
  lyrics: string,
  storyContext: string,
  productionVariantId?: string
) {
  const dynamicRecipe = buildDynamicProductionRecipe({
    direction,
    storyContext,
    lyrics,
    variantId: productionVariantId,
  });
  const productionRecipe = dynamicRecipe ? formatDynamicProductionRecipe(dynamicRecipe) : undefined;
  const fallbackPrompt = buildFallbackMusicProductionPrompt({
    direction,
    production,
    lyrics,
    storyContext,
    dynamicRecipe,
  });
  if (!direction && !production) return fallbackPrompt;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const { enhanceMusicPrompt } = await import('@/ai/text/lib/generation');
    const enhanced = await Promise.race([
      enhanceMusicPrompt({
        tags: direction || production,
        productionNotes: production,
        productionRecipe,
        lyrics,
      }),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), 30_000);
      }),
    ]);
    if (enhanced) return finalizeMusicProductionPrompt(enhanced);
  } catch (error) {
    console.warn('[generate-music] Prompt enhancement failed; using the trusted fallback prompt.', error);
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  return fallbackPrompt;
}

export async function submitMusicGeneration(rawBody: unknown, actor: { id: string; role: string }) {
  let insertedSongId: string | null = null;
  let userId: string | null = null;

  try {
    userId = actor.id;
    if (!userId || actor.role !== 'admin')
      return NextResponse.json({ success: false, error: 'Administrator access required' }, { status: 403 });

    const parsed = musicGenerationRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid music generation request',
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
        },
        { status: 400 }
      );
    }

    const body: MusicGenerationRequest = parsed.data;
    const requestHash = createMusicRequestFingerprint(body);
    const existing = await findJob(body.songId);
    if (existing) {
      if (!sameIdempotentRequest(existing, userId, requestHash)) {
        return NextResponse.json(
          { success: false, error: 'This generation id is already assigned to a different request' },
          { status: 409 }
        );
      }

      let executionMode: string | undefined;
      if (existing.processingStatus === 'queued') {
        executionMode = await dispatchMusicJob(existing.id, userId);
      }
      return jobResponse(existing, true, executionMode);
    }

    if (!isMusicGenerationConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Music generation service is not configured' },
        { status: 503 }
      );
    }

    const effectiveSourceSummary = body.sourceSummary || body.newsSummary || body.storyBrief?.summary;
    const effectiveDirection =
      body.musicDirectionPrompt || body.promptBundle?.musicDirectionPrompt || body.prompt || '';
    const requestedProduction =
      body.musicProductionPrompt || body.promptBundle?.musicProductionPrompt || body.prompt || effectiveDirection;
    const effectiveCoverArtPrompt = body.coverArtPrompt || body.promptBundle?.coverArtPrompt;
    const generationLyrics = prepareMiniMaxLyricsForGeneration(body.lyrics);
    const lyricCheck = inspectSongLyrics(generationLyrics);
    if (!lyricCheck.passed) {
      return NextResponse.json(
        {
          success: false,
          error: lyricCheck.issues.join(' '),
          issues: lyricCheck.issues,
        },
        { status: 422 }
      );
    }
    const sungLines = lyricCheck.lyrics.split(/\r?\n/).filter((line) => line.trim() && !/^\[[^\]]+\]$/.test(line));
    console.info('[music-generation] Prepared complete MiniMax lyric.', {
      sungLines: sungLines.length,
      words: sungLines.join(' ').split(/\s+/).filter(Boolean).length,
    });
    const storyContext = [body.title, effectiveSourceSummary || body.sourceText]
      .filter(Boolean)
      .join('\n')
      .slice(0, 8_000);
    const generationPrompt = await enhanceProductionPrompt(
      effectiveDirection,
      requestedProduction,
      lyricCheck.lyrics,
      storyContext,
      body.productionVariantId || body.promptBundle?.productionVariantId
    );
    const effectiveTitle =
      body.title ||
      (lyricCheck.lyrics.split('\n').find((line) => line.trim().length > 0) || 'Generated Track').slice(0, 200);

    const db = await getDb();
    const inserted = await db.transaction(async (tx) => {
      if (body.workflowRunId) {
        const [ownedRun] = await tx
          .select({
            id: songCreationRun.id,
            currentStage: songCreationRun.currentStage,
            lyricWorkshop: songCreationRun.lyricWorkshop,
          })
          .from(songCreationRun)
          .where(and(eq(songCreationRun.id, body.workflowRunId), eq(songCreationRun.userId, actor.id)))
          .limit(1);
        if (!ownedRun) {
          throw new Error('The creation workflow does not exist or belongs to another user');
        }
        const safetyDecision = getWorkflowSafetyDecision(ownedRun.lyricWorkshop);
        const isLegacyQualityReview =
          ownedRun.currentStage === 'lyrics_review' && safetyDecision !== 'review' && safetyDecision !== 'block';
        if (ownedRun.currentStage !== 'lyrics_ready' && !isLegacyQualityReview) {
          throw new Error(
            safetyDecision === 'review' || safetyDecision === 'block'
              ? "This story is outside ScoopRYM's editorial safety boundary"
              : 'Lyrics are not ready for music production'
          );
        }
      }

      let storyId = body.songId;

      if (body.sourceUrl) {
        const [createdStory] = await tx
          .insert(storyTable)
          .values({
            id: randomUUID(),
            sourceUrl: body.sourceUrl,
            sourceText: body.sourceText,
            newsSummary: effectiveSourceSummary,
          })
          .onConflictDoUpdate({
            target: storyTable.sourceUrl,
            set: {
              sourceText: body.sourceText,
              newsSummary: effectiveSourceSummary,
              updatedAt: new Date(),
            },
          })
          .returning({ id: storyTable.id });

        if (createdStory) {
          storyId = createdStory.id;
        }
      } else {
        await tx
          .insert(storyTable)
          .values({
            id: storyId,
            sourceText: body.sourceText,
            newsSummary: effectiveSourceSummary,
          })
          .onConflictDoNothing({ target: storyTable.id });
      }

      const seoTopic = buildSongSeoTopic({
        id: body.songId,
        title: effectiveTitle,
        newsSummary: effectiveSourceSummary,
        sourceText: body.sourceText,
        seoTopic: body.seoTopic,
      });
      // 同一新闻使用首个版本的主题，并按该新闻分配连续编号。
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${storyId}))`);
      const storySongs = await tx
        .select({ id: songTable.id, seoSlug: songTable.seoSlug, seoTopic: songTable.seoTopic })
        .from(songTable)
        .where(eq(songTable.storyId, storyId))
        .orderBy(asc(songTable.createdAt), asc(songTable.id));
      const firstSongTopic = storySongs.find((song) => song.seoTopic?.trim())?.seoTopic;
      const firstSongSlug = storySongs[0]?.seoSlug;
      const firstSlugTopic = firstSongSlug?.match(/^(.*)-(?:funny-song|scooprym)(?:-\d+)?$/)?.[1];
      const slugBase = getSongSeoSlugBase({
        id: body.songId,
        title: effectiveTitle,
        newsSummary: effectiveSourceSummary,
        sourceText: body.sourceText,
        seoTopic: firstSongTopic || firstSlugTopic?.replace(/-/g, ' ') || seoTopic,
      });
      // 同一事件同时创作多个版本时，事务锁保证纯文字 slug 的序号分配不冲突。
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${slugBase}))`);
      const storedSlugBase = getSongStoredSlug(slugBase);
      const existingSlugs = await tx
        .select({ seoSlug: songTable.seoSlug })
        .from(songTable)
        .where(
          or(
            eq(songTable.seoSlug, slugBase),
            like(songTable.seoSlug, `${slugBase}-%`),
            eq(songTable.seoSlug, storedSlugBase),
            like(songTable.seoSlug, `${storedSlugBase}-%`)
          )
        );
      const reservedSlugs = new Set(existingSlugs.map((row) => getSongCanonicalSlug({ id: '', seoSlug: row.seoSlug })));
      const seoSlug = allocateSongSeoSlug(
        slugBase,
        storySongs.map((row) => getSongCanonicalSlug(row)),
        reservedSlugs
      );

      const [createdSong] = await tx
        .insert(songTable)
        .values({
          id: body.songId,
          storyId,
          userId: actor.id,
          title: effectiveTitle,
          seoSlug,
          seoTopic: seoTopic || null,
          // 保存实际发送给音乐模型的歌词，避免数据库歌词与成品不一致。
          lyrics: lyricCheck.lyrics,
          audioUrl: '',
          isAdminGenerated: true,
        })
        .onConflictDoNothing({ target: songTable.id })
        .returning({
          id: songTable.id,
          userId: songTable.userId,
          title: songTable.title,
          audioUrl: songTable.audioUrl,
          coverImageUrl: songTable.coverImageUrl,
        });

      if (!createdSong) return undefined;

      const [attempt] = await tx
        .insert(generationAttempt)
        .values({
          id: body.songId,
          songId: createdSong.id,
          prompt: effectiveDirection,
          generationPrompt,
          coverArtPrompt: effectiveCoverArtPrompt,
          outputFormat: body.outputFormat,
          audioFormat: body.audioFormat,
          generationRequestHash: requestHash,
          generationBillingMode: 'internal_admin',
          processingStatus: 'queued',
          processingError: null,
          creditsDeducted: false,
        })
        .returning({
          processingStatus: generationAttempt.processingStatus,
          generationRequestHash: generationAttempt.generationRequestHash,
        });

      if (body.workflowRunId) {
        const now = new Date();
        await tx
          .update(songCreationRun)
          .set({
            songId: createdSong.id,
            status: 'queued',
            currentStage: 'queued_audio',
            title: effectiveTitle,
            lyrics: lyricCheck.lyrics,
            lastError: null,
            updatedAt: now,
          })
          .where(and(eq(songCreationRun.id, body.workflowRunId), eq(songCreationRun.userId, actor.id)));
        await tx.insert(songCreationStep).values({
          id: randomUUID(),
          runId: body.workflowRunId,
          stage: 'queued_audio',
          status: 'completed',
          attempt: 1,
          outputMetadata: { songId: createdSong.id },
          completedAt: now,
        });
      }

      return { ...createdSong, ...attempt };
    });

    if (!inserted) {
      const racedJob = await findJob(body.songId);
      if (racedJob && sameIdempotentRequest(racedJob, userId, requestHash)) {
        let executionMode: string | undefined;
        if (racedJob.processingStatus === 'queued') {
          executionMode = await dispatchMusicJob(racedJob.id, userId);
        }
        return jobResponse(racedJob, true, executionMode);
      }
      return NextResponse.json(
        { success: false, error: 'This generation id is already assigned to a different request' },
        { status: 409 }
      );
    }

    insertedSongId = inserted.id;
    const executionMode = await dispatchMusicJob(inserted.id, userId);
    return jobResponse(inserted, false, executionMode);
  } catch (error) {
    console.error('[generate-music] Handler exception:', error);
    if (insertedSongId && userId) {
      await markMusicQueueFailure(insertedSongId, userId, error).catch((dbError) => {
        console.error(`[generate-music] Failed to terminalize ${insertedSongId}:`, dbError);
      });
    }
    return NextResponse.json(mapGenerationError(error), { status: 500 });
  }
}
