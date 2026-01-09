import { randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import { song as songTable } from '@/db/schema';
import { getSession } from '@/lib/server';
import { NextResponse } from 'next/server';
import { performance } from 'perf_hooks';

// Services
import { generateCoverWithRetry } from '@/ai/image/lib/cover-generation';
import { generateMusic } from '@/ai/music/lib/generation';
// Import processMusicBackground for fallback execution
import { processMusicBackground, type ProcessMusicOptions } from '@/lib/song-workflow';
import { qstash, getWorkerUrl } from '@/lib/queue';
import { eq } from 'drizzle-orm';
import { mapGenerationError } from '@/lib/music/error-handler';
import { consumeCredits } from '@/credits/credits';

type GenerateMusicBody = {
  lyrics?: string;
  prompt?: string;
  outputFormat?: 'url' | 'hex';
  audioFormat?: 'mp3' | 'wav' | 'pcm';
  title?: string;
  sourceUrl?: string;
  sourceText?: string;
  newsSummary?: string;
  useStream?: boolean;
};

/**
 * API Handler: Generate Music (QStash integrated)
 *
 * Strategy: Fast Return + Distributed Job Queue
 * 1. Validate & Auth
 * 2. Pre-check Credits
 * 3. Call MiniMax API (blocking, ~10-30s) -> Get Temp URL
 * 4. Store initial DB record (status: processing)
 * 5. Publish Job to QStash (The "Fire and Forget" Safety Net)
 * 6. Return "Audio Ready" response immediately
 */
export async function POST(req: Request) {
  let songId: string | null = null;
  const startTime = performance.now();
  console.log('[Performance] generate-music: New Request');

  try {
    // 0. Rate Limiting
    const { getRateLimiter } = await import("@/lib/ratelimit");
    // session is declared later, do not declare here if not needed immediately or rename
    const session = await getSession();
    const userId = session?.user?.id;

    // Identify by UserID (preferred) or IP (fallback)
    const identifier = userId || (req.headers.get("x-forwarded-for") ?? "127.0.0.1");

    const { success } = await getRateLimiter().limit(identifier);
    if (!success) {
        return NextResponse.json(
            { success: false, error: "Too many requests. Please try again in a minute.", code: 429 },
            { status: 429 }
        );
    }

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
      songId: clientSongId,
    } = body as GenerateMusicBody & { songId?: string };

    if (!lyrics || lyrics.trim().length < 10) {
      const unifiedError = mapGenerationError({ success: false, error: 'Lyrics required (min 10 chars)', statusCode: 400 });
      return NextResponse.json(unifiedError, { status: 400 });
    }

    // 2. Auth
    const apiKey = process.env.MINIMAXI_API_KEY;
    if (!apiKey) {
      const unifiedError = mapGenerationError({ success: false, error: 'Service configuration error (API Key)', statusCode: 500 });
      return NextResponse.json(unifiedError, { status: 500 });
    }

    // Reuse existing session/userId
    if (!userId) {
      const unifiedError = mapGenerationError({ success: false, error: 'Unauthorized: Please login first', statusCode: 401 });
      return NextResponse.json(unifiedError, { status: 401 });
    }

    // 2.2 Credit Check (Pre-check)
    const { hasEnoughCredits } = await import('@/credits/credits');
    const hasCredits = await hasEnoughCredits({ userId, requiredCredits: 2 });
    if (!hasCredits) {
      const unifiedError = mapGenerationError({ success: false, error: 'Insufficient credits (Code: 1010)', statusCode: 402 });
      return NextResponse.json(unifiedError, { status: 402 });
    }

    // Prepare Title & ID
    const effectiveTitle =
      title?.trim() || (lyrics.split('\n').find((l) => l.trim().length > 0) || 'Generated Track').slice(0, 50);

    songId = (clientSongId && /^[0-9a-f-]{36}$/i.test(clientSongId)) ? clientSongId : randomUUID();

    // 2.3 DB Record Creation (Optimistic)
    const db = await getDb();
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
      audioUrl: '',
      processingStatus: 'processing',
      creditsDeducted: false,
      isAdminGenerated: session?.user?.role === 'admin',
    });
    console.log(`[Performance] Initial DB record created in ${(performance.now() - dbStartTime).toFixed(2)}ms`);


    // 3. Generate Audio (Blocking - The "Synchronous" Part)
    // We still do this synchronously so the user gets "Instant Playback".
    // If MiniMaxi fails here, we fail the requests entirely.
    const effectivePrompt = prompt && prompt.trim().length >= 10 ? prompt.trim() : 'Auto, dynamic, emotional, based on lyrics context';

    // 3.1 Start Cover Image Generation (Parallel / Optimistic)
    // We start this promise here so it can be passed to QStash (if supported deep serialization?)
    // OR more likely, passed to the INLINE fallback.
    // NOTE: QStash cannot receive a Promise object. The WORKER needs to regenerate or we need to await it?
    // Actually, for QStash, the worker does its own generation.
    // BUT for inline fallback, we want to reuse this promise if possible or just create it.
    // To keep it consistent: We will create the promise here primarily for INLINE fallback usage.
    // The Worker will start its own independently if used.

    // 3.1 Start Cover Image Generation (Parallel / Optimistic)
    // We pass the raw data so the service can construct the optimal prompt.
    const coverImagePromise = generateCoverWithRetry({
        title: effectiveTitle,
        lyrics: lyrics,
        sourceText: effectivePrompt
    });


    // Call MiniMaxi
    const musicResult = await generateMusic({
      apiKey,
      prompt: effectivePrompt,
      lyrics,
      outputFormat: 'url',
      audioFormat,
      stream: false, // Force non-streaming for URL
    });

    if (!musicResult.success || !musicResult.audioContent) {
        // Fail fast
        await db.update(songTable)
           .set({ processingStatus: 'failed_generation', creditError: musicResult.error })
           .where(eq(songTable.id, songId));
        return NextResponse.json(mapGenerationError(musicResult as any), { status: 500 });
    }

    const tempAudioUrl = musicResult.audioContent as string;

    // 3.5 Deduct Credits Synchronously (CRITICAL for Real-time Balance Update)
    let creditsDeductedSynch = false;
    try {
        console.log(`[generate-music] Deducting credits synchronously for ${songId}...`);
        await consumeCredits({
            userId,
            amount: 2,
            description: `Generate music: ${effectiveTitle} [ID:${songId}]`,
        });

        // Update DB to reflect deduction immediately
        await db.update(songTable)
           .set({ creditsDeducted: true })
           .where(eq(songTable.id, songId));

        creditsDeductedSynch = true;
    } catch (creditErr) {
        console.error(`[generate-music] Synchronous credit deduction failed for ${songId} (will retry in worker):`, creditErr);
        // We do NOT fail the request here, because audio is already generated.
        // We let the worker try again (idempotency check handles it).
    }

    // 4. Publish to QStash (The "Async" Part)
    // Instead of `waitUntil(processMusicBackground...)`, we send a message to QStash.

    // Construct the Options object needed by the worker (and fallback)
    const processOptions: ProcessMusicOptions = {
        lyrics: lyrics || '',
        prompt,
        title: effectiveTitle,
        sourceText,
        sourceUrl,
        outputFormat: 'url',
        audioFormat,
        songId: songId!,
        userId
    };

    try {
        console.log(`[QStash] Publishing job for song ${songId}...`);

        const workerUrl = getWorkerUrl('api/worker/generate-music');

        const qstashResponse = await qstash.publishJSON({
            url: workerUrl,
            body: {
                audioContent: tempAudioUrl,
                options: processOptions
            },
            // Retry logic: If worker fails (e.g. S3 down), retry up to 3 times
            retries: 3,
        });

        console.log(`[QStash] Job published! MessageID: ${qstashResponse.messageId}`);
    } catch (queueError: any) {
        console.error(`[QStash] FAILED to publish job for ${songId}. Fallback to INLINE execution. Error:`, queueError);
        // CRITICAL FALLBACK (Fail-Open): If Queue is down, run inline!
        // This risks timeout on Vercel, but is better than 100% data loss.

        try {
            // Re-import locally if needed, or use the imported one.
            // We need to pass the coverImagePromise we created earlier.
            // Note: processMusicBackground is imported at top level.

            const backgroundWork = processMusicBackground(
              tempAudioUrl,
              processOptions,
              coverImagePromise
            );

            // Attempt to keep serverless function alive
            // @ts-ignore
            if (typeof waitUntil === 'function') waitUntil(backgroundWork);
            // @ts-ignore
            else if ((req as any).waitUntil) (req as any).waitUntil(backgroundWork);
            else {
                // Node.js / VPS fallback
                backgroundWork.catch(err => console.error("Inline background work failed:", err));
            }

             // We do NOT update status to 'failed'. We assume inline might succeed.
        } catch (fallbackError) {
             console.error(`[QStash] Fallback Inline execution also failed for ${songId}:`, fallbackError);
             await db.update(songTable)
                .set({ processingStatus: 'processing_queue_failed', creditError: 'Queue & Inline failed' })
                .where(eq(songTable.id, songId));
        }
    }

    console.log(`[Performance] Optimistic Response sent in ${(performance.now() - startTime).toFixed(2)}ms`);

    return NextResponse.json({
      success: true,
      audio: tempAudioUrl,
      song: {
        id: songId,
        title: effectiveTitle,
        audioUrl: tempAudioUrl, // Immediate playback
        coverImageUrl: null     // Cover arrives later via socket or poll
      },
      meta: {
        songId,
        info: 'Background processing via QStash started.'
      }
    });

  } catch (error: any) {
    console.error('[generate-music] Handler Exception:', error);
    if (songId) {
        try {
            await (await getDb()).update(songTable)
               .set({ processingStatus: 'failed_generation', creditError: error.message })
               .where(eq(songTable.id, songId));
        } catch (e) {}
    }
    return NextResponse.json(mapGenerationError(error), { status: 500 });
  }
}
