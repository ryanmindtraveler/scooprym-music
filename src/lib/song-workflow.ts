/**
 * @file song-workflow.ts (Moved from services/song.service.ts)
 * @description Encapsulates song management logic, including background processing, storage, and database updates.
 */

import { dataUrlToImageBuffer } from '@/ai/image/lib/cover-generation';
import { CREDIT_TRANSACTION_TYPE } from '@/credits/types';
import { getDb } from '@/db/index';
import { creditTransaction, song as songTable } from '@/db/schema';
import { uploadFile } from '@/storage';
import { eq, and } from 'drizzle-orm';
import { performance } from 'perf_hooks';

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
  audioContent: string,
  options: ProcessMusicOptions,
  coverImagePromise: Promise<string | null>
): Promise<BackgroundProcessResult> {
  const bgStartTime = performance.now();
  const { userId, songId, title, outputFormat, audioFormat } = options;

  console.log(`[song-workflow] Starting background processing for song ${songId}...`);
  const effectiveTitle = title?.trim() || 'Generated Track';
  const db = await getDb();

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
            const hex = audioContent;
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

            const audioRes = await fetch(audioContent, { signal: controller.signal });
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
          console.log(`[Performance] Audio uploaded for ${songId} in ${(performance.now() - uploadStartTime).toFixed(2)}ms`);

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
          // B1. Await generation
          const imageDataUrl = await coverImagePromise; // awaited here

          if (imageDataUrl) {
            // B2. Convert & Upload
            const { buffer, mime, extension } = dataUrlToImageBuffer(imageDataUrl);
            const coverUpload = await uploadFile(buffer, `song-cover.${extension}`, mime, `song-covers/${userId}`);

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
        // We check BOTH the song status AND the credit transaction history for maximum safety
        const uniqueDescription = `Generate music: ${effectiveTitle} [ID:${songId}]`;

        // Parallel check
        const [existingRecordRows, existingTransactionRows] = await Promise.all([
             db.select({ creditsDeducted: songTable.creditsDeducted })
               .from(songTable)
               .where(eq(songTable.id, songId))
               .limit(1),
             db.select({ id: creditTransaction.id })
               .from(creditTransaction)
               .where(
                  and(
                      eq(creditTransaction.userId, userId),
                      eq(creditTransaction.description, uniqueDescription),
                      eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.USAGE)
                  )
               )
               .limit(1)
        ]);

        // Using "Rows" suffix clearly indicates these are arrays from the select result
        const existingRecord = existingRecordRows[0];
        const existingTransaction = existingTransactionRows[0];

        if (existingRecord?.creditsDeducted || existingTransaction) {
           console.log(`[song-workflow] Credits already deducted for ${songId} (Transaction/Status found). Skipping charge.`);
        } else {
            await consumeCredits({
              userId,
              amount: 2,
              description: uniqueDescription,
            });
        }

        // Determine final status
        const coverSuccess = coverGenerateResult.status === 'fulfilled' && !!coverGenerateResult.value;
        const finalStatus = coverSuccess ? 'completed' : 'completed_without_cover';

        await db
          .update(songTable)
          .set({
            creditsDeducted: true,
            processingStatus: finalStatus,
            updatedAt: new Date(),
          })
          .where(eq(songTable.id, songId));

        console.log(`[song-workflow] Background processing succeeded for ${songId}. Status: ${finalStatus}`);
        console.log(`[Performance] Background worker for ${songId} total time: ${(performance.now() - bgStartTime).toFixed(2)}ms`);

        return {
            success: true,
            audioUrl: audioUploadResult.value.url,
            coverImageUrl: (coverGenerateResult.status === 'fulfilled' && coverGenerateResult.value) ? coverGenerateResult.value.url : undefined
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
            error: 'Credit deduction failed'
        };
      }
    } else {
      // Audio failed
      console.error(`[song-workflow] Audio upload failed for ${songId}:`, audioUploadResult.reason);
      await db.update(songTable).set({ processingStatus: 'failed_audio_upload' }).where(eq(songTable.id, songId));
      return {
          success: false,
          error: `Audio upload failed: ${audioUploadResult.reason}`
      };
    }
  } catch (globalError: any) {
    console.error(`[song-workflow] Fatal background error for ${songId}:`, globalError);

    // Attempt to update DB to prevent zombie state
    try {
        await db
          .update(songTable)
          .set({
            processingStatus: 'failed_internal_error',
            creditError: globalError.message || 'Fatal workflow error'
          })
          .where(eq(songTable.id, songId));
    } catch (dbError) {
        // If DB connection is also dead, just log it.
        console.error(`[song-workflow] Critical: Failed to report fatal error to DB for ${songId}:`, dbError);
    }

    return {
        success: false,
        error: globalError.message || 'Fatal background workflow error'
    };
  }
}
