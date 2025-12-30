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
import { createStreamEntry, pushToStream, finishStream } from '@/lib/stream-cache';
import { eq } from 'drizzle-orm';

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
  const startTime = performance.now();
  console.log('[Performance] generate-music: New Request');

  try {
    // Instantiate local decoder to prevent state pollution in concurrent requests
    const decoder = new TextDecoder();
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
      useStream = true, // Default to true for best UX
    } = body;

    if (!lyrics || lyrics.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Lyrics required (min 10 chars)' }, { status: 400 });
    }

    // 2. Auth
    const apiKey = process.env.MINIMAXI_API_KEY || process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Service configuration error (API Key)' }, { status: 500 });
    }

    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Please login first' }, { status: 401 });
    }

    // 2.2 Credit Check (Pre-check to prevent unpaid AI costs)
    const { hasEnoughCredits } = await import('@/credits/credits');
    const hasCredits = await hasEnoughCredits({ userId, requiredCredits: 2 });
    if (!hasCredits) {
      return NextResponse.json({ success: false, error: 'Insufficient credits (Code: 1008)' }, { status: 402 });
    }

    // Prepare Title
    const effectiveTitle =
      title?.trim() || (lyrics.split('\n').find((l) => l.trim().length > 0) || 'Generated Track').slice(0, 50);

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

    const musicResult = await generateMusic({
      apiKey,
      prompt: effectivePrompt,
      lyrics,
      outputFormat,
      audioFormat,
      stream: useStream, // Pass the control parameter
    });

    if (!musicResult.success || (!musicResult.audioContent && !musicResult.stream)) {
      return NextResponse.json(
        {
          success: false,
          error: `Music Generation Failed: ${musicResult.error} (Code: ${musicResult.statusCode})`,
          details: musicResult.details,
          code: musicResult.statusCode,
        },
        { status: musicResult.statusCode || 500 }
      );
    }

    // --- Persistence (Initial Record) ---
    const db = await getDb();
    const songId = randomUUID();
    const dbStartTime = performance.now();

    await db.insert(songTable).values({
      id: songId,
      userId,
      title: effectiveTitle,
      lyrics,
      prompt,
      sourceText,
      sourceUrl,
      newsSummary,
      audioUrl: 'pending-stream',
      processingStatus: 'processing',
      creditsDeducted: false,
      isAdminGenerated: session?.user?.role === 'admin',
    });
    console.log(`[Performance] Initial DB record created in ${(performance.now() - dbStartTime).toFixed(2)}ms`);

    // --- MODE A: Streaming Flow ---
    if (useStream && musicResult.stream) {
      createStreamEntry(songId);

      (async () => {
        const reader = musicResult.stream!.getReader();
        let fullAudioHex = '';
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep partial line in buffer

            for (const line of lines) {
              if (line.trim().startsWith('data:')) {
                try {
                  const jsonStr = line.replace('data:', '').trim();
                  const json = JSON.parse(jsonStr);
                  const hex = json?.data?.audio;
                  if (hex) {
                    fullAudioHex += hex;
                    const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b: string) => Number.parseInt(b, 16)));
                    pushToStream(songId, bytes);
                  }
                } catch (pErr) {
                  console.error('[Streaming] Parse error inside chunk:', pErr);
                }
              }
            }
          }
          console.log(`[Streaming] Finished. SongId: ${songId}, Size: ${fullAudioHex.length}`);
          finishStream(songId);

          // Trigger background persistence
          processMusicBackground(fullAudioHex, {
            lyrics, prompt, title: effectiveTitle, sourceText, sourceUrl,
            outputFormat: 'hex', audioFormat, songId, userId
          }, coverImagePromise)
          .catch(bgErr => console.error('[Streaming] BG error:', bgErr));
        } catch (sErr: any) {
          console.error('[Streaming] Error:', sErr);
          finishStream(songId);
          // Mark as failed in DB
          const db = await getDb();
          await db.update(songTable).set({
            processingStatus: 'failed_streaming',
            creditError: sErr.message // Log error message in creditError field as fallback
          }).where(eq(songTable.id, songId)).catch(e => console.error('Failed to update DB error:', e));
        }
      })();

      return NextResponse.json({
        success: true,
        audio: `/api/songs/${songId}/stream`,
        song: { id: songId, title: effectiveTitle, audioUrl: `/api/songs/${songId}/stream` },
        meta: { songId, format: 'url' }
      });
    }

    // --- MODE B: Non-Streaming Flow ---
    console.log('[Non-Streaming] Waiting for full generation...');
    let finalAudioHex = musicResult.audioContent || '';

    if (!finalAudioHex && musicResult.stream) {
      const reader = musicResult.stream.getReader();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            try {
              const hex = JSON.parse(line.replace('data:', '').trim())?.data?.audio;
              if (hex) finalAudioHex += hex;
            } catch {}
          }
        }
      }
    }

    // Trigger background persistence (Async, don't await to speed up response)
    processMusicBackground(
      finalAudioHex,
      {
        lyrics, prompt, title: effectiveTitle, sourceText, sourceUrl,
        outputFormat: 'hex', audioFormat, songId, userId
      },
      coverImagePromise
    ).catch(e => console.error('[Non-Streaming] BG Error:', e));

    return NextResponse.json({
      success: true,
      audio: finalAudioHex,
      song: {
        id: songId,
        title: effectiveTitle,
        audioUrl: null, // Client will use the HEX data for now
      },
      meta: {
        songId,
        format: 'hex',
        mode: 'non-streaming'
      }
    });
  } catch (error: any) {
    console.error('[generate-music] Handler Exception:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
