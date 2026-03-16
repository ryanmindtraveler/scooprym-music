/**
 * @file song-workflow.ts (Moved from services/song.service.ts)
 * @description Encapsulates song management logic, including background processing, storage, and database updates.
 */

import { dataUrlToImageBuffer } from '@/ai/image/lib/cover-generation';
import { CREDIT_TRANSACTION_TYPE } from '@/credits/types';
import { getDb } from '@/db/index';
import { creditTransaction, song as songTable } from '@/db/schema';
import { uploadFile } from '@/storage';
import { and, eq, like, sql } from 'drizzle-orm';
import { performance } from 'perf_hooks';

/**
 * Generate SEO-friendly filename for cover image
 * Format: person-event-uuid.ext
 * Example: taylor-swift-eras-tour-e707ddb3.png
 */
function generateCoverFilename(
  title: string,
  sourceText: string | undefined,
  songId: string,
  extension: string
): string {
  // Try to extract person/entity from title or sourceText
  const content = `${title} ${sourceText || ''}`;

  // Common name patterns (celebrities, politicians, etc.)
  const namePatterns = [
    // Full names (2-3 capitalized words)
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
    // Single capitalized word that looks like a name
    /\b([A-Z][a-z]{2,})\b/,
  ];

  let person = '';
  for (const pattern of namePatterns) {
    const match = content.match(pattern);
    if (match) {
      person = match[1].toLowerCase().replace(/\s+/g, '-');
      break;
    }
  }

  // Extract event/topic from title
  // Remove common words and extract key topic
  const stopWords =
    /\b(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|need|dare|ought|used|to|of|in|for|on|with|at|by|from|as|into|through|during|before|after|above|below|between|under|again|further|then|once|here|there|when|where|why|how|all|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|just|now)\b/gi;

  let event = title
    .replace(stopWords, ' ')
    .replace(/[^\w\s-]/g, ' ') // Remove special chars
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-'); // Convert spaces to hyphens

  // Limit event length
  event = event.slice(0, 50).replace(/-+$/, '');

  // If no person extracted, use shortened UUID as person
  if (!person) {
    person = 'cover';
  }

  // Shorten UUID to first 8 chars for readability while maintaining uniqueness
  const shortId = songId.slice(0, 8);

  // Build filename: person-event-shortId.extension
  const filename = `${person}-${event}-${shortId}.${extension}`;

  return filename.replace(/-{2,}/g, '-').toLowerCase(); // Remove duplicate hyphens
}

export interface ProcessMusicOptions {
  lyrics: string;
  prompt?: string;
  title?: string;
  sourceText?: string;
  sourceUrl?: string;
  outputFormat: 'url' | 'hex';
  audioFormat: 'mp3' | 'wav' | 'pcm';
  songId: string;
  userId: string;
}

/**
 * Background task to handle post-generation steps:
 * 1. Download/Parse audio
 * 2. Upload to Storage (Audio)
 * 3. Wait for Cover Image & Upload to Storage
 * 4. Deduct Credits
 * 5. Update Database Status
 */
export interface BackgroundProcessResult {
  success: boolean;
  audioUrl?: string;
  coverImageUrl?: string;
  error?: string;
}

/**
 * Background task to handle post-generation steps:
 * 1. Download/Parse audio
 * 2. Upload to Storage (Audio)
 * 3. Wait for Cover Image & Upload to Storage
 * 4. Deduct Credits
 * 5. Update Database Status
 */
export async function processMusicBackground(
  audioContent: string | null | undefined, // Support missing audio (Async Generation)
  options: ProcessMusicOptions,
  coverImagePromise: Promise<string | null> | null // Nullable for robustness
): Promise<BackgroundProcessResult> {
  const bgStartTime = performance.now();
  const { userId, songId, title, outputFormat, audioFormat, lyrics, prompt } = options;

  console.log(`[song-workflow] Starting background processing for song ${songId}...`);
  const effectiveTitle = title?.trim() || 'Generated Track';
  const db = await getDb();

  // --- ASYNC GENERATION LOGIC ---
  let finalAudioContent = audioContent;

  if (!finalAudioContent) {
    console.log(
      `[song-workflow] No audio content provided. Starting Async Generation for ${songId} (Inline/Worker)...`
    );
    try {
      // Dynamic import to avoid circular deps with route->workflow->generation
      const { generateMusic } = await import('@/ai/music/lib/generation');
      const apiKey = process.env.MINIMAXI_API_KEY;

      if (!apiKey) throw new Error('System missing MINIMAXI_API_KEY');

      const musicResult = await generateMusic({
        apiKey,
        prompt: prompt || '',
        lyrics: lyrics || '',
        outputFormat,
        audioFormat,
        stream: false,
      });

      if (!musicResult.success || !musicResult.audioContent) {
        throw new Error(musicResult.error || 'Async Generation Failed');
      }

      finalAudioContent = musicResult.audioContent;
      console.log(
        `[song-workflow] Async Generation Succeeded for ${songId}. Content Length: ${finalAudioContent?.length}`
      );
    } catch (genError: any) {
      console.error(`[song-workflow] Async Generation Failed for ${songId}:`, genError);

      // Handle Failure: Update DB & Refund
      await db
        .update(songTable)
        .set({
          processingStatus: 'failed_generation',
          creditError: genError.message,
          creditsDeducted: false,
        })
        .where(eq(songTable.id, songId));

      const { refundCredits } = await import('@/credits/credits');
      await refundCredits({
        userId,
        amount: 2,
        description: `Generation failed (Async Workflow) [ID:${songId}]`,
      }).catch((e) => console.error('[song-workflow] Refund Failed:', e));

      return { success: false, error: genError.message };
    }
  }
  // ------------------------------

  try {
    // ==================== Parallel Execution: Audio & Cover Pipelines ====================
    const [audioUploadResult, coverGenerateResult] = await Promise.allSettled([
      // Task A: Audio Pipeline
      (async () => {
        const pipelineStart = performance.now();
        try {
          // A1. Get Buffer
          let fileBuffer: Buffer;
          const fileExt = audioFormat === 'wav' ? 'wav' : 'mp3';

          if (outputFormat === 'hex') {
            const hex = finalAudioContent;
            if (!hex || hex.length === 0) {
              throw new Error('Empty hex string received from audio generation');
            }
            const matches = hex.match(/.{1,2}/g);
            if (!matches) {
              throw new Error('Invalid hex string format');
            }
            const bytes = new Uint8Array(matches.map((b) => Number.parseInt(b, 16)));
            fileBuffer = Buffer.from(bytes);
          } else {
            // Download with timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60_000); // Increased timeout for larger files

            // @ts-ignore
            const audioRes = await fetch(finalAudioContent, { signal: controller.signal });
            clearTimeout(timeout);

            if (!audioRes.ok) throw new Error(`Download failed: ${audioRes.status}`);
            fileBuffer = Buffer.from(await audioRes.arrayBuffer());
          }

          // A2. Upload
          const uploadStartTime = performance.now();
          const uploaded = await uploadFile(
            fileBuffer,
            `song.${fileExt}`,
            fileExt === 'wav' ? 'audio/wav' : 'audio/mpeg',
            `songs/${userId}`
          );
          console.log(
            `[Performance] Audio uploaded for ${songId} in ${(performance.now() - uploadStartTime).toFixed(2)}ms`
          );

          // A3. Update DB
          await db
            .update(songTable)
            .set({
              audioUrl: uploaded.url,
              audioKey: uploaded.key,
              processingStatus: 'audio_uploaded',
              updatedAt: new Date(),
            })
            .where(eq(songTable.id, songId));

          return uploaded;
        } catch (error) {
          console.error(`[song-workflow] Audio pipeline failed for ${songId}:`, error);
          throw error;
        }
      })(),

      // Task B: Cover Pipeline
      (async () => {
        try {
          // B1. Await generation (or null if not started)
          let imageDataUrl = coverImagePromise ? await coverImagePromise : null;

          // If no image url (e.g. Inline Fallback passed null), try to generate it now
          if (!imageDataUrl) {
            try {
              const { generateCoverWithRetry } = await import('@/ai/image/lib/cover-generation');
              // Use a fallback source text if prompt is missing
              const coverSource = options.prompt || options.lyrics?.slice(0, 100) || options.title || 'Music Cover';

              imageDataUrl = await generateCoverWithRetry({
                title: options.title || 'Untitled',
                lyrics: options.lyrics || '',
                sourceText: coverSource,
              });
            } catch (coverGenErr) {
              console.error('[song-workflow] Background Cover Generation failed (non-fatal):', coverGenErr);
              // Continue to use fallback image
            }
          }

          if (imageDataUrl) {
            // B2. Convert & Upload
            const { buffer, mime, extension } = dataUrlToImageBuffer(imageDataUrl);
            // Generate SEO-friendly filename: person-event-uuid.ext
            const coverFilename = generateCoverFilename(options.title || 'song', options.sourceText, songId, extension);
            const coverUpload = await uploadFile(buffer, coverFilename, mime, `song-covers/${userId}`);

            // B3. Update DB
            await db
              .update(songTable)
              .set({
                coverImageUrl: coverUpload.url,
                coverImageKey: coverUpload.key,
              })
              .where(eq(songTable.id, songId));

            return coverUpload;
          }
          return null;
        } catch (error) {
          console.error(`[song-workflow] Cover pipeline failed for ${songId}:`, error);
          throw error;
        }
      })(),
    ]);

    // ==================== Finalize & Credits ====================

    // Only deduct credits if Audio uploaded successfully
    if (audioUploadResult.status === 'fulfilled') {
      try {
        console.log(`[song-workflow] Audio upload valid. Proceeding to deduct credits for song ${songId}...`);

        // Dynamic import to avoid circular dependency issues if any, or just for cleanliness
        const { consumeCredits } = await import('@/credits/credits');

        // Idempotency Check: Verify if we already deducted for this song
        // We check BOTH the song status AND the net credit balance for this specific song ID
        const idSuffix = `[ID:${songId}]`;

        // Parallel check
        const [existingRecordRows, netCreditRows] = await Promise.all([
          db
            .select({ creditsDeducted: songTable.creditsDeducted })
            .from(songTable)
            .where(eq(songTable.id, songId))
            .limit(1),
          db
            .select({
              // Calculate net credits for this song (Usage -2 + Refund +2 = 0)
              netAmount: sql<number>`COALESCE(SUM(${creditTransaction.amount}), 0)`,
            })
            .from(creditTransaction)
            .where(and(eq(creditTransaction.userId, userId), like(creditTransaction.description, `%${idSuffix}`))),
        ]);

        const existingRecord = existingRecordRows[0];
        const netAmount = Number(netCreditRows[0]?.netAmount || 0);

        // If netAmount is negative (e.g., -2), it means the user is already "charged" for this ID.
        // If netAmount is 0 (or positive), it means they either weren't charged or were refunded.
        if (existingRecord?.creditsDeducted || netAmount < 0) {
          console.log(
            `[song-workflow] Credits already deducted for ${songId} (Status=${existingRecord?.creditsDeducted}, Net=${netAmount}). Skipping charge.`
          );
        } else {
          const uniqueDescription = `Generate music: ${effectiveTitle} [ID:${songId}]`;
          await consumeCredits({
            userId,
            amount: 2,
            description: uniqueDescription,
          });
        }

        // Determine final status
        const coverSuccess = coverGenerateResult.status === 'fulfilled' && !!coverGenerateResult.value;
        const finalStatus = 'completed'; // Always complete, even if we use fallback

        // Use generated cover OR static fallback
        const coverUpload = coverGenerateResult.status === 'fulfilled' ? coverGenerateResult.value : null;

        const finalCoverUrl = coverUpload?.url || '/images/funny-censored-fallback.png';

        await db
          .update(songTable)
          .set({
            creditsDeducted: true,
            processingStatus: finalStatus,
            coverImageUrl: finalCoverUrl, // Ensure DB has the fallback
            updatedAt: new Date(),
          })
          .where(eq(songTable.id, songId));

        console.log(
          `[song-workflow] Background processing succeeded for ${songId}. Status: ${finalStatus} (Cover: ${coverSuccess ? 'Generated' : 'Fallback'})`
        );
        console.log(
          `[Performance] Background worker for ${songId} total time: ${(performance.now() - bgStartTime).toFixed(2)}ms`
        );

        return {
          success: true,
          audioUrl: audioUploadResult.value.url,
          coverImageUrl: finalCoverUrl,
        };
      } catch (creditError) {
        console.error(`[song-workflow] Credit deduction failed for ${songId}:`, creditError);
        await db
          .update(songTable)
          .set({
            creditsDeducted: false,
            creditError: String(creditError),
            processingStatus: 'failed_credit_deduction',
          })
          .where(eq(songTable.id, songId));

        // Even if credit deduction failed, we still have the audio
        return {
          success: true,
          audioUrl: audioUploadResult.value.url,
          error: 'Credit deduction failed',
        };
      }
    } else {
      // Audio failed
      console.error(`[song-workflow] Audio upload failed for ${songId}:`, audioUploadResult.reason);

      // Refund credits if they were already deducted (Atomic Lock)
      try {
        const updatedRows = await db
          .update(songTable)
          .set({
            creditsDeducted: false,
            processingStatus: 'failed_audio_upload',
          })
          .where(and(eq(songTable.id, songId), eq(songTable.creditsDeducted, true)))
          .returning({ id: songTable.id });

        if (updatedRows.length > 0) {
          const { refundCredits } = await import('@/credits/credits');
          await refundCredits({
            userId,
            amount: 2,
            description: `Generation failed (Storage Upload) [ID:${songId}]`,
          }).catch((e) => console.error(`[song-workflow] Refund failed for ${songId}:`, e));
        } else {
          // If no row was updated, it means it's either not deducted or already refunded
          await db.update(songTable).set({ processingStatus: 'failed_audio_upload' }).where(eq(songTable.id, songId));
        }
      } catch (refundError) {
        console.error(`[song-workflow] Failed to process refund for ${songId}:`, refundError);
      }

      return {
        success: false,
        error: `Audio upload failed: ${audioUploadResult.reason}`,
      };
    }
  } catch (globalError: any) {
    console.error(`[song-workflow] Fatal background error for ${songId}:`, globalError);

    // Attempt to update DB to prevent zombie state
    try {
      // Refund credits if they were already deducted (Atomic Lock)
      const updatedRows = await db
        .update(songTable)
        .set({
          creditsDeducted: false,
          processingStatus: 'failed_internal_error',
          creditError: globalError.message || 'Fatal workflow error',
        })
        .where(and(eq(songTable.id, songId), eq(songTable.creditsDeducted, true)))
        .returning({ id: songTable.id });

      if (updatedRows.length > 0) {
        const { refundCredits } = await import('@/credits/credits');
        await refundCredits({
          userId,
          amount: 2,
          description: `Generation failed (Fatal Error) [ID:${songId}]`,
        }).catch((e) => console.error(`[song-workflow] Fatal refund error for ${songId}:`, e));
      } else {
        await db
          .update(songTable)
          .set({
            processingStatus: 'failed_internal_error',
            creditError: globalError.message || 'Fatal workflow error',
          })
          .where(eq(songTable.id, songId));
      }
    } catch (dbError) {
      // If DB connection is also dead, just log it.
      console.error(`[song-workflow] Critical: Failed to report fatal error to DB for ${songId}:`, dbError);
    }

    return {
      success: false,
      error: globalError.message || 'Fatal background workflow error',
    };
  }
}
