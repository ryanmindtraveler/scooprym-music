import { randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import { song as songTable } from '@/db/schema';
import type { FullSongsPromptBundle } from '@/features/full-songs/types/full-songs';
import { getSession } from '@/lib/server';
import { NextResponse } from 'next/server';

import { mapGenerationError } from '@/lib/music/error-handler';
import { canUseQStash, getWorkerUrl, qstash } from '@/lib/queue';
import { type ProcessMusicOptions, processMusicBackground } from '@/lib/song-workflow';
import { and, eq } from 'drizzle-orm';

type GenerateMusicBody = {
  lyrics?: string;
  prompt?: string;
  outputFormat?: 'url' | 'hex';
  audioFormat?: 'mp3' | 'wav' | 'pcm';
  title?: string;
  sourceUrl?: string;
  sourceText?: string;
  sourceSummary?: string;
  newsSummary?: string;
  musicDirectionPrompt?: string;
  musicProductionPrompt?: string;
  coverArtPrompt?: string;
  promptBundle?: FullSongsPromptBundle;
  storyBrief?: {
    summary?: string;
    angle?: string;
  };
};

export async function POST(req: Request) {
  let songId: string | null = null;
  let session: any = null;
  let userId: string | undefined;
  let songInserted = false;

  try {
    const { getRateLimiter } = await import('@/lib/ratelimit');

    session = await getSession();
    userId = session?.user?.id;
    const identifier = userId || (req.headers.get('x-forwarded-for') ?? '127.0.0.1');

    const { success } = await getRateLimiter().limit(identifier);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again in a minute.', code: 429 },
        { status: 429 }
      );
    }

    const body: GenerateMusicBody = await req.json();
    const {
      lyrics,
      prompt,
      outputFormat = 'url',
      audioFormat = 'mp3',
      title,
      sourceText,
      sourceUrl,
      sourceSummary,
      newsSummary: legacyNewsSummary,
      musicDirectionPrompt,
      musicProductionPrompt,
      coverArtPrompt,
      promptBundle,
      songId: clientSongId,
    } = body as GenerateMusicBody & { songId?: string };
    const effectiveSourceSummary = sourceSummary || legacyNewsSummary || body.storyBrief?.summary;
    const effectiveMusicDirectionPrompt = musicDirectionPrompt || promptBundle?.musicDirectionPrompt || prompt || '';
    const effectiveMusicProductionPrompt =
      musicProductionPrompt || promptBundle?.musicProductionPrompt || prompt || effectiveMusicDirectionPrompt;
    const effectiveCoverArtPrompt = coverArtPrompt || promptBundle?.coverArtPrompt;

    if (!lyrics || lyrics.trim().length < 10) {
      const unifiedError = mapGenerationError({
        success: false,
        error: 'Lyrics required (min 10 chars)',
        statusCode: 400,
      });
      return NextResponse.json(unifiedError, { status: 400 });
    }

    const apiKey = process.env.MINIMAXI_API_KEY;
    if (!apiKey) {
      const unifiedError = mapGenerationError({
        success: false,
        error: 'Service configuration error (API Key)',
        statusCode: 500,
      });
      return NextResponse.json(unifiedError, { status: 500 });
    }

    if (!userId) {
      const unifiedError = mapGenerationError({
        success: false,
        error: 'Unauthorized: Please login first',
        statusCode: 401,
      });
      return NextResponse.json(unifiedError, { status: 401 });
    }

    const { hasEnoughCredits } = await import('@/credits/credits');
    const hasCredits = await hasEnoughCredits({ userId, requiredCredits: 2 });
    if (!hasCredits) {
      const unifiedError = mapGenerationError({
        success: false,
        error: 'Insufficient credits (Code: 1010)',
        statusCode: 402,
      });
      return NextResponse.json(unifiedError, { status: 402 });
    }

    const effectiveTitle =
      title?.trim() || (lyrics.split('\n').find((l) => l.trim().length > 0) || 'Generated Track').slice(0, 50);

    const db = await getDb();
    if (clientSongId && /^[0-9a-f-]{36}$/i.test(clientSongId)) {
      const existingSong = await db.select({ id: songTable.id }).from(songTable).where(eq(songTable.id, clientSongId)).limit(1);
      if (existingSong.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Song ID conflict. Please retry generation.',
          },
          { status: 409 }
        );
      }
    }

    songId = clientSongId && /^[0-9a-f-]{36}$/i.test(clientSongId) ? clientSongId : randomUUID();
    await db.insert(songTable).values({
      id: songId!,
      userId,
      title: effectiveTitle,
      lyrics,
      prompt: effectiveMusicDirectionPrompt,
      sourceText,
      sourceUrl,
      newsSummary: effectiveSourceSummary,
      audioUrl: '',
      processingStatus: 'processing',
      creditsDeducted: false,
      isAdminGenerated: session?.user?.role === 'admin',
    });
    songInserted = true;

    let effectivePrompt =
      effectiveMusicProductionPrompt && effectiveMusicProductionPrompt.trim().length >= 10
        ? effectiveMusicProductionPrompt.trim()
        : 'Auto, dynamic, emotional, based on lyrics context';

    try {
      if (effectiveMusicDirectionPrompt && lyrics) {
        const { enhanceMusicPrompt } = await import('@/ai/text/lib/generation');

        const enhanced = await Promise.race([
          enhanceMusicPrompt({ tags: effectiveMusicDirectionPrompt, lyrics }),
          new Promise<string | null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000)),
        ]);

        if (enhanced) {
          effectivePrompt = enhanced.slice(0, 500);
        }
      }
    } catch (enhanceErr) {
      console.warn('[Music Prompt] Enhancement skipped/failed:', enhanceErr);
    }

    let cleanedLyrics = lyrics.replace(/\[(.*?):\s*.*?\]/g, '[$1]');
    cleanedLyrics = cleanedLyrics.replace(/\s*\([^)]*\)/g, '').trim();

    if (cleanedLyrics.length < 5) {
      console.warn('[Lyrics Cleaning] Cleaned lyrics too short, reverting to original.');
      cleanedLyrics = lyrics;
    }

    const tempAudioUrl = '';
    const coverImagePromise = null;

    const currentSongId = songId;
    if (!currentSongId) {
      throw new Error('Song ID missing before background processing setup');
    }

    const processOptions: ProcessMusicOptions = {
      lyrics: cleanedLyrics,
      prompt: effectivePrompt,
      musicDirectionPrompt: effectiveMusicDirectionPrompt,
      coverArtPrompt: effectiveCoverArtPrompt,
      title: effectiveTitle,
      sourceText,
      sourceUrl,
      outputFormat,
      audioFormat,
      songId: currentSongId,
      userId,
    };

    const shouldUseQStash = canUseQStash();

    const runInlineBackgroundWork = () => {
      const fireBackgroundWork = () => {
        const backgroundWork = processMusicBackground(tempAudioUrl, processOptions, null);
        backgroundWork.catch((err) => console.error('[Inline Background] Background work failed:', err));
      };

      // @ts-ignore
      if (typeof waitUntil === 'function') {
        // @ts-ignore
        waitUntil(processMusicBackground(tempAudioUrl, processOptions, coverImagePromise));
      }
      // @ts-ignore
      else if ((req as any).waitUntil) {
        // @ts-ignore
        (req as any).waitUntil(processMusicBackground(tempAudioUrl, processOptions, coverImagePromise));
      } else {
        setTimeout(fireBackgroundWork, 0);
      }
    };

    const handleInlineFallbackFailure = async (reason: string) => {
      try {
        const dbInstance = await getDb();
        const updatedRows = await dbInstance
          .update(songTable)
          .set({
            processingStatus: 'processing_queue_failed',
            creditError: reason,
          })
          .where(and(eq(songTable.id, currentSongId), eq(songTable.userId, userId!)))
          .returning({ id: songTable.id });

        if (updatedRows.length === 0) {
          await dbInstance
            .update(songTable)
            .set({ processingStatus: 'processing_queue_failed', creditError: reason })
            .where(and(eq(songTable.id, currentSongId), eq(songTable.userId, userId!)));
        }
      } catch (dbErr) {
        console.error('Failed to update/refund in inline fallback catch:', dbErr);
      }
    };

    if (!shouldUseQStash) {
      console.log(
        `[QStash] Disabled for local or non-public base URL. Using inline background execution for ${currentSongId}.`
      );

      try {
        runInlineBackgroundWork();
      } catch (fallbackError) {
        console.error(`[Inline Background] Execution failed for ${songId}:`, fallbackError);
        await handleInlineFallbackFailure('Inline background execution failed');
      }
    } else {
      try {
        const workerUrl = getWorkerUrl('api/worker/generate-music');

        const qstashResponse = await qstash.publishJSON({
          url: workerUrl,
          body: {
            audioContent: tempAudioUrl,
            options: processOptions,
          },
          retries: 3,
        });

        console.log(`[QStash] Job published! MessageID: ${qstashResponse.messageId}`);
      } catch (queueError: any) {
        console.error(
          `[QStash] Publish failed for ${currentSongId}. Falling back to inline background execution.`,
          queueError
        );

        try {
          runInlineBackgroundWork();
        } catch (fallbackError) {
          console.error(`[QStash] Inline fallback execution also failed for ${currentSongId}:`, fallbackError);
          await handleInlineFallbackFailure('Queue publish and inline fallback failed');
        }
      }
    }

    return NextResponse.json({
      success: true,
      audio: tempAudioUrl,
      song: {
        id: songId,
        title: effectiveTitle,
        audioUrl: null,
        coverImageUrl: null,
      },
      meta: {
        songId,
        info: 'Background processing via QStash started.',
      },
    });
  } catch (error: any) {
    console.error('[generate-music] Handler Exception:', error);
    if (songInserted && songId && userId) {
      try {
        const dbInstance = await getDb();
        await dbInstance
          .update(songTable)
          .set({
            processingStatus: 'failed_generation',
            creditError: error.message,
          })
          .where(and(eq(songTable.id, songId), eq(songTable.userId, userId)));
      } catch (e) {
        console.error('Failed to update song status in final catch:', e);
      }
    }
    return NextResponse.json(mapGenerationError(error), { status: 500 });
  }
}
