import { createHash } from 'crypto';
import { getDb } from '@/db';
import { songCreationStep } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

/** 恢复点绑定实际音乐输入，防止编辑歌词后复用旧音频。 */
export function audioInputHash(lyrics: string, prompt: string, format: string) {
  return createHash('sha256')
    .update(JSON.stringify([lyrics, prompt, format]))
    .digest('hex');
}

export function readAudioCheckpoint(metadata: unknown, inputHash: string): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const record = metadata as Record<string, unknown>;
  if (record.audioInputHash !== inputHash || typeof record.generatedAudioUrl !== 'string') return null;
  try {
    const url = new URL(record.generatedAudioUrl);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function findAudioCheckpoint(runId: string, inputHash: string) {
  const db = getDb();
  const steps = await db
    .select({ metadata: songCreationStep.outputMetadata })
    .from(songCreationStep)
    .where(
      and(
        eq(songCreationStep.runId, runId),
        eq(songCreationStep.stage, 'generating_audio'),
        eq(songCreationStep.status, 'completed')
      )
    )
    .orderBy(desc(songCreationStep.startedAt))
    .limit(20);
  for (const step of steps) {
    const url = readAudioCheckpoint(step.metadata, inputHash);
    if (url) return url;
  }
  return null;
}
