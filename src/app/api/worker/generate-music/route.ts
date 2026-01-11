import { generateCoverWithRetry } from '@/ai/image/lib/cover-generation';
import { type ProcessMusicOptions, processMusicBackground } from '@/lib/song-workflow';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Worker Endpoint: /api/worker/generate-music
 *
 * This endpoint is called ASYNCHRONOUSLY by Upstash QStash.
 * It performs the heavy lifting:
 * 1. Claims the task (implicitly by running)
 * 2. Generates the Cover Image (Parallel)
 * 3. Downloads & Uploads Audio (Parallel)
 * 4. Updates DB & Deducts Credits
 */

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioContent, options } = body as {
      audioContent: string;
      options: ProcessMusicOptions;
    };

    console.log(`[Worker] Received job for song: ${options.songId}`);

    // Re-instantiate the cover image promise logic here
    // In the original sync flow, we started this promise earlier.
    // In the async worker flow, we start it now.
    // Note: If you wanted purely parallel generation (Audio & Image started at same time),
    // you'd need to push TWO jobs or handle it differently.
    // For now, to keep it simple and robust, we regenerate the cover here.
    const coverImagePromise = generateCoverWithRetry({
      title: options.title || 'Untitled',
      lyrics: options.lyrics || '',
      sourceText: options.sourceText || '',
    });

    // Run the existing workflow logic
    const result = await processMusicBackground(audioContent, options, coverImagePromise);

    if (result.success) {
      console.log(`[Worker] Job completed successfully for ${options.songId}`);
      return NextResponse.json({ status: 'success', data: result });
    }

    console.error(`[Worker] Job failed for ${options.songId}:`, result.error);
    return NextResponse.json({ status: 'error', error: result.error }, { status: 500 });
  } catch (error: any) {
    console.error('[Worker] Unhandled exception:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}

// Security: Verify that the request actually came from QStash
export const POST = verifySignatureAppRouter(handler);
