import { randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import { song as songTable } from '@/db/schema';
import { getSession } from '@/lib/server';
import { NextResponse } from 'next/server';
import { performance } from 'perf_hooks';

// Services
import { generateCoverWithRetry } from '@/ai/image/lib/cover-generation';
import { generateMusic } from '@/ai/music/lib/generation';
import { processMusicBackground } from '@/lib/song-workflow';
import { eq } from 'drizzle-orm';
import { mapGenerationError } from '@/lib/music/error-handler';

// Removed global DECODER to prevent race conditions

type GenerateMusicBody = {
  lyrics?: string;
  prompt?: string;
  outputFormat?: 'url' | 'hex';
  audioFormat?: 'mp3' | 'wav' | 'pcm';
  title?: string;
  sourceUrl?: string;
  sourceText?: string;
  newsSummary?: string;
  useStream?: boolean; // New parameter to control streaming mode
};

/**
 * API Handler: Generate Music
 *
 * Strategy: Fast Return + Background Processing
 * 1. Validate & Auth
 * 2. Call MiniMax API (blocking, ~10-30s)
 * 3. Store initial DB record
 * 4. Return "Audio Ready" response immediately
 * 5. Trigger background task (Song Service) for downloads, storage, and credits
 */
export async function POST(req: Request) {
  let songId: string | null = null;
  const startTime = performance.now();
  console.log('[Performance] generate-music: New Request');

  try {
    // 1. Validation
    const body: GenerateMusicBody = await req.json();
    const {
      lyrics,
      prompt,
      outputFormat = 'url',
      audioFormat = 'mp3',
      title,
      sourceText,
      sourceUrl,
      newsSummary,
      useStream = true,
      songId: clientSongId, // Optional Client-Side ID
    } = body as GenerateMusicBody & { songId?: string };

    if (!lyrics || lyrics.trim().length < 10) {
      const unifiedError = mapGenerationError({ success: false, error: 'Lyrics required (min 10 chars)', statusCode: 400 });
      return NextResponse.json(unifiedError, { status: 400 });
    }

    // 2. Auth
    const apiKey = process.env.MINIMAXI_API_KEY || process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      const unifiedError = mapGenerationError({ success: false, error: 'Service configuration error (API Key)', statusCode: 500 });
      return NextResponse.json(unifiedError, { status: 500 });
    }

    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      const unifiedError = mapGenerationError({ success: false, error: 'Unauthorized: Please login first', statusCode: 401 });
      return NextResponse.json(unifiedError, { status: 401 });
    }

    // 2.2 Credit Check (Pre-check to prevent unpaid AI costs)
    const { hasEnoughCredits } = await import('@/credits/credits');
    const hasCredits = await hasEnoughCredits({ userId, requiredCredits: 2 });
    if (!hasCredits) {
      const unifiedError = mapGenerationError({ success: false, error: 'Insufficient credits (Code: 1010)', statusCode: 402 });
      return NextResponse.json(unifiedError, { status: 402 });
    }

    // Prepare Title
    const effectiveTitle =
      title?.trim() || (lyrics.split('\n').find((l) => l.trim().length > 0) || 'Generated Track').slice(0, 50);

    // Use Client ID if valid, otherwise generate new
    songId = (clientSongId && /^[0-9a-f-]{36}$/i.test(clientSongId)) ? clientSongId : randomUUID();

    // 2.1 Start Cover Generation (Parallel, Non-blocking)
    console.log('[Performance] Starting parallel cover generation...');
    const coverStartTime = performance.now();
    const coverImagePromise = generateCoverWithRetry({
      title: effectiveTitle,
      lyrics,
      sourceText,
    }).then(res => {
      console.log(`[Performance] Cover generation (async) finished in ${(performance.now() - coverStartTime).toFixed(2)}ms`);
      return res;
    });

    // 3. Generate Audio (Blocking)
    // Fallback Prompt
    const effectivePrompt =
      prompt && prompt.trim().length >= 10 ? prompt.trim() : 'Auto, dynamic, emotional, based on lyrics context';

    // Force non-streaming mode for reliability
    const useStreamLocal = false;

    const musicResult = await generateMusic({
      apiKey,
      prompt: effectivePrompt,
      lyrics,
      outputFormat: 'url', // Request URL for non-streaming
      audioFormat,
      stream: useStreamLocal,
    });

    if (!musicResult.success || (!musicResult.audioContent && !musicResult.stream)) {
      const unifiedError = mapGenerationError(musicResult as any);

      const httpStatus = unifiedError.code && unifiedError.code >= 200 && unifiedError.code <= 599
        ? unifiedError.code
        : 500;

      return NextResponse.json(unifiedError, { status: httpStatus });
    }

    // --- Persistence (Initial Record) ---
    const db = await getDb();
    // songId is already assigned above
    const dbStartTime = performance.now();

    await db.insert(songTable).values({
      id: songId!,
      userId,
      title: effectiveTitle,
      lyrics,
      prompt,
      sourceText,
      sourceUrl,
      newsSummary,
      audioUrl: 'processing', // Placeholder, not pending-stream
      processingStatus: 'processing',
      creditsDeducted: false,
      isAdminGenerated: session?.user?.role === 'admin',
    });
    console.log(`[Performance] Initial DB record created in ${(performance.now() - dbStartTime).toFixed(2)}ms`);


    // --- MODE B: Non-Streaming Flow (Standard: Play First, Save Later) ---
    console.log('[Non-Streaming] Starting optimistic generation flow...');

    const tempAudioUrl = musicResult.audioContent;
    if (!tempAudioUrl || typeof tempAudioUrl !== 'string') {
        throw new Error('Invalid audio URL received from provider');
    }

    // [OPTIMIZATION] FIRE AND FORGET Strategy
    // Return temp URL immediately. Persist to DB/S3 in background.

    const backgroundWork = async () => {
      try {
        console.log(`[Background] Starting persistence for song ${songId}`);
        const result = await processMusicBackground(
          tempAudioUrl,
          {
            lyrics, prompt, title: effectiveTitle, sourceText, sourceUrl,
            outputFormat: 'url', audioFormat, songId: songId!, userId
          },
          coverImagePromise
        );
        console.log(`[Background] Success for ${songId}. Final Audio: ${result.audioUrl}`);
      } catch (err) {
        console.error(`[Background] Failed for ${songId}:`, err);
        // DB status is updated inside separate try/catch blocks within processMusicBackground
      }
    };

    // Execute background task
    // Note: Vercel/Next.js Serverless functions may freeze execution after response.
    // We attempt to use `waitUntil` if available on the request context or global scope.
    const taskPromise = backgroundWork();

    // @ts-ignore
    if (typeof waitUntil === 'function') {
         // Cloudflare Workers / Edge
        // @ts-ignore
        waitUntil(taskPromise);
    } else if ((req as any).waitUntil) {
        // Vercel / Next.js Request extension
        (req as any).waitUntil(taskPromise);
    } else {
        // Node.js fallback: Let it float.
        // In local/VPS logic, this runs fine. In strict Lambda, this is a race condition.
        // Accepted tradeoff for "Instant Playback".
    }

    console.log(`[Performance] Optimistic Response sent in ${(performance.now() - startTime).toFixed(2)}ms`);

    return NextResponse.json({
      success: true,
      audio: tempAudioUrl,
      song: {
        id: songId,
        title: effectiveTitle,
        audioUrl: tempAudioUrl, // Immediate playback
        coverImageUrl: null     // Cover arrives later
      },
      meta: {
        songId,
        format: 'url',
        mode: 'optimistic',
        info: 'Background processing started. Credits will be deducted upon completion.'
      }
    });

  } catch (error: any) {
    console.error('[generate-music] Handler Exception:', error);

    // Attempt to mark the song as failed in DB if we created a record
    if (songId) {
      try {
        const db = await getDb();
        await db.update(songTable)
           .set({ processingStatus: 'failed_generation', creditError: error.message })
           .where(eq(songTable.id, songId));
        console.log(`[generate-music] Marked song ${songId} as failed_generation`);
      } catch (dbError) {
        console.error('[generate-music] Failed to update DB status on error:', dbError);
      }
    }

    const unifiedError = mapGenerationError(error);
    const httpStatus = unifiedError.code && unifiedError.code >= 200 && unifiedError.code <= 599
      ? unifiedError.code
      : 500;

    return NextResponse.json(unifiedError, { status: httpStatus });
  }
}
