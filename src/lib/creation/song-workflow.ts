/**
 * @file song-workflow.ts
 * @description 管理音乐生成请求校验、任务幂等指纹与持久化 Worker 状态机。
 */

import { createHash } from 'crypto';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { MINIMAX_MUSIC_MODEL } from '@/ai/config/models';
import { getDb } from '@/db/index';
import { generationAttempt, song as songTable, story as storyTable } from '@/db/schema';
import { audioInputHash, findAudioCheckpoint } from '@/lib/creation/audio-checkpoint';
import { prepareCoverAsset } from '@/lib/creation/cover-asset';
import { enqueueMusicContinuation } from '@/lib/creation/music-continuation';
import {
  completeWorkflowStage,
  failWorkflowStep,
  getWorkflowRunBySongId,
  startWorkflowStage,
} from '@/lib/creation/song-creation-workflow';
import { inspectSongProduct } from '@/lib/creation/song-product-check';
import { normalizeStructuredLyrics } from '@/lib/music/lyrics-utils';
import { deleteFile, uploadFile } from '@/storage';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { performance } from 'perf_hooks';
import { z } from 'zod';

export const MAX_GENERATED_AUDIO_BYTES = 25 * 1024 * 1024;
const AUDIO_DOWNLOAD_TIMEOUT_MS = 90_000;
const MAX_AUDIO_REDIRECTS = 5;
const ACTIVE_JOB_STATUSES = [
  'processing',
  'generating_audio',
  'audio_generated',
  'uploading_audio',
  'audio_uploaded',
  'generating_cover',
  'finalizing',
] as const;
const FALLBACK_COVER_URL = '/images/funny-censored-fallback.png';

type HostnameLookup = (hostname: string) => Promise<ReadonlyArray<{ address: string; family: number }>>;

const lookupHostAddresses: HostnameLookup = async (hostname) => lookup(hostname, { all: true, verbatim: true });

const blockedAudioV4Addresses = new BlockList();
const blockedAudioV6Addresses = new BlockList();

for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedAudioV4Addresses.addSubnet(network, prefix, 'ipv4');
}

for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['::ffff:0:0', 96],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 23],
  ['2001:2::', 48],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
] as const) {
  blockedAudioV6Addresses.addSubnet(network, prefix, 'ipv6');
}

const optionalTrimmedText = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(maxLength).optional()
  );

const optionalHttpUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .trim()
    .max(2048)
    .url()
    .refine((value) => {
      const parsed = new URL(value);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.username && !parsed.password;
    }, 'Only credential-free HTTP(S) source URLs are allowed')
    .optional()
);

const promptBundleSchema = z
  .object({
    musicDirectionPrompt: z.string().trim().min(1).max(2000),
    lyricsWritingPrompt: optionalTrimmedText(4000),
    musicProductionPrompt: optionalTrimmedText(2000),
    productionVariantId: optionalTrimmedText(100),
    coverArtPrompt: optionalTrimmedText(4000),
  })
  .strict();

const storyBriefSchema = z
  .object({
    summary: optionalTrimmedText(4000),
    angle: optionalTrimmedText(2000),
  })
  .strict();

export const musicGenerationRequestSchema = z
  .object({
    songId: z.string().uuid(),
    workflowRunId: z.string().uuid().optional(),
    // MiniMax 官方音乐接口的项目歌词上限为 3500 字符；入口明确拒绝超限，禁止静默裁剪。
    lyrics: z.string().trim().min(10).max(3_500),
    prompt: optionalTrimmedText(2000),
    outputFormat: z.enum(['url', 'hex']).default('url'),
    audioFormat: z.enum(['mp3', 'wav', 'pcm']).default('mp3'),
    title: optionalTrimmedText(200),
    sourceUrl: optionalHttpUrl,
    sourceText: optionalTrimmedText(50_000),
    sourceSummary: optionalTrimmedText(4000),
    newsSummary: optionalTrimmedText(4000),
    seoTopic: optionalTrimmedText(72),
    musicDirectionPrompt: optionalTrimmedText(2000),
    musicProductionPrompt: optionalTrimmedText(2000),
    productionVariantId: optionalTrimmedText(100),
    coverArtPrompt: optionalTrimmedText(4000),
    promptBundle: promptBundleSchema.optional(),
    storyBrief: storyBriefSchema.optional(),
    // 兼容现有客户端；异步任务始终由服务端决定执行方式。
    useStream: z.boolean().optional(),
  })
  .strict();

export type MusicGenerationRequest = z.infer<typeof musicGenerationRequestSchema>;
export type AudioFormat = MusicGenerationRequest['audioFormat'];
export type OutputFormat = MusicGenerationRequest['outputFormat'];

export function cleanLyricsForGeneration(lyrics: string) {
  const cleaned = normalizeStructuredLyrics(lyrics)
    // 括号内可能是需要演唱的呼应、和声或短 ad-lib，官方音乐模型支持并能利用这些内容。
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned.length >= 5 ? cleaned : lyrics.trim();
}

/**
 * MiniMax 官方音乐接口接收最长 3500 字符的结构化歌词。
 * 供应商边界只负责清理格式，绝不能改写、截断或删除已经通过编辑流程的歌词。
 */
export function prepareMiniMaxLyricsForGeneration(lyrics: string) {
  return cleanLyricsForGeneration(lyrics);
}

export function createMusicRequestFingerprint(request: MusicGenerationRequest) {
  const effectiveSourceSummary = request.sourceSummary || request.newsSummary || request.storyBrief?.summary || '';
  const effectiveDirection =
    request.musicDirectionPrompt || request.promptBundle?.musicDirectionPrompt || request.prompt || '';
  const effectiveProduction =
    request.musicProductionPrompt ||
    request.promptBundle?.musicProductionPrompt ||
    request.prompt ||
    effectiveDirection;

  const canonicalRequest = {
    songId: request.songId,
    workflowRunId: request.workflowRunId || '',
    lyrics: request.lyrics,
    prompt: request.prompt || '',
    outputFormat: request.outputFormat,
    audioFormat: request.audioFormat,
    title: request.title || '',
    sourceUrl: request.sourceUrl || '',
    sourceText: request.sourceText || '',
    sourceSummary: effectiveSourceSummary,
    seoTopic: request.seoTopic || '',
    musicDirectionPrompt: effectiveDirection,
    musicProductionPrompt: effectiveProduction,
    productionVariantId: request.productionVariantId || request.promptBundle?.productionVariantId || '',
    coverArtPrompt: request.coverArtPrompt || request.promptBundle?.coverArtPrompt || '',
  };

  return createHash('sha256').update(JSON.stringify(canonicalRequest), 'utf8').digest('hex');
}

export interface AudioFileDescriptor {
  extension: 'mp3' | 'wav' | 'pcm';
  mimeType: 'audio/mpeg' | 'audio/wav' | 'audio/L16';
}

export function getAudioFileDescriptor(audioFormat: AudioFormat): AudioFileDescriptor {
  switch (audioFormat) {
    case 'wav':
      return { extension: 'wav', mimeType: 'audio/wav' };
    case 'pcm':
      return { extension: 'pcm', mimeType: 'audio/L16' };
    default:
      return { extension: 'mp3', mimeType: 'audio/mpeg' };
  }
}

function assertAudioSignature(buffer: Buffer, audioFormat: AudioFormat) {
  if (buffer.length === 0) {
    throw new Error('Generated audio is empty');
  }

  if (audioFormat === 'wav') {
    const hasWaveHeader =
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WAVE';
    if (!hasWaveHeader) {
      throw new Error('Generated WAV has an invalid header');
    }
  }

  if (audioFormat === 'mp3') {
    const hasId3Header = buffer.length >= 3 && buffer.subarray(0, 3).toString('ascii') === 'ID3';
    const hasFrameSync = buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
    if (!hasId3Header && !hasFrameSync) {
      throw new Error('Generated MP3 has an invalid header');
    }
  }
}

export function decodeGeneratedAudioHex(content: string, audioFormat: AudioFormat) {
  const normalized = content.trim().replace(/^0x/i, '');
  if (!normalized || normalized.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(normalized)) {
    throw new Error('Generated audio contains invalid hexadecimal data');
  }
  if (normalized.length / 2 > MAX_GENERATED_AUDIO_BYTES) {
    throw new Error('Generated audio exceeds the maximum allowed size');
  }

  const buffer = Buffer.from(normalized, 'hex');
  assertAudioSignature(buffer, audioFormat);
  return buffer;
}

async function readResponseWithLimit(response: Response) {
  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(declaredSize) && declaredSize > MAX_GENERATED_AUDIO_BYTES) {
    throw new Error('Generated audio exceeds the maximum allowed size');
  }

  if (!response.body) {
    throw new Error('Generated audio response has no body');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_GENERATED_AUDIO_BYTES) {
      await reader.cancel('Generated audio exceeds the maximum allowed size');
      throw new Error('Generated audio exceeds the maximum allowed size');
    }
    chunks.push(value);
  }

  return Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk)),
    totalBytes
  );
}

function isPublicAudioAddress(address: string) {
  const family = isIP(address);
  if (family === 4) {
    return !blockedAudioV4Addresses.check(address, 'ipv4');
  }
  if (family === 6) {
    return !blockedAudioV6Addresses.check(address, 'ipv6');
  }
  return false;
}

function isBenchmarkAudioIpv4(address: string) {
  const octets = address.split('.').map(Number);
  return (
    octets.length === 4 &&
    octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255) &&
    octets[0] === 198 &&
    (octets[1] === 18 || octets[1] === 19)
  );
}

/**
 * Clash/Mihomo 的 Fake-IP 模式会在本地开发环境把公开 CDN 域名统一解析到
 * RFC 2544 的 198.18.0.0/15。仅当 URL 使用域名、全部解析结果均为该网段，
 * 且当前不是生产环境时允许继续由代理获取；IP 字面量、混合结果和其他私网
 * 地址仍然拒绝。响应仍会经过逐跳重定向、大小、MIME 与音频签名校验。
 */
function isDevelopmentAudioFakeIpResolution(
  addresses: ReadonlyArray<{ address: string; family: number }>,
  environment = process.env.NODE_ENV
) {
  return (
    environment !== 'production' &&
    addresses.length > 0 &&
    addresses.every(({ address, family }) => family === 4 && isBenchmarkAudioIpv4(address))
  );
}

async function assertPublicAudioUrl(url: URL, lookupImplementation: HostnameLookup) {
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) {
    throw new Error('Generated audio URL must be a credential-free HTTP(S) URL');
  }

  const hostname = url.hostname
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
    .toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('Generated audio URL must resolve to a public host');
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await lookupImplementation(hostname);

  const containsBlockedAddress = addresses.some(({ address }) => !isPublicAudioAddress(address));
  const isLocalProxyFakeIp =
    literalFamily === 0 && containsBlockedAddress && isDevelopmentAudioFakeIpResolution(addresses);

  if (addresses.length === 0 || (containsBlockedAddress && !isLocalProxyFakeIp)) {
    throw new Error('Generated audio URL must resolve only to public IP addresses');
  }

  if (isLocalProxyFakeIp) {
    console.warn(`[song-workflow] Allowing development proxy Fake-IP for generated audio host: ${hostname}`);
  }
}

async function downloadGeneratedAudioOnce(
  content: string,
  audioFormat: AudioFormat,
  fetchImplementation: typeof fetch = fetch,
  lookupImplementation: HostnameLookup = lookupHostAddresses
) {
  let url: URL;
  try {
    url = new URL(content);
  } catch {
    throw new Error('Generated audio URL is invalid');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUDIO_DOWNLOAD_TIMEOUT_MS);

  try {
    for (let redirectCount = 0; redirectCount <= MAX_AUDIO_REDIRECTS; redirectCount += 1) {
      await assertPublicAudioUrl(url, lookupImplementation);

      const response = await fetchImplementation(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirectCount === MAX_AUDIO_REDIRECTS) {
          throw new Error('Generated audio URL exceeded the redirect limit');
        }

        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Generated audio redirect is missing a Location header');
        }

        url = new URL(location, url);
        continue;
      }

      if (!response.ok) {
        throw Object.assign(new Error(`Generated audio download failed (${response.status})`), {
          statusCode: response.status,
        });
      }

      const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
      if (contentType && !contentType.startsWith('audio/') && contentType !== 'application/octet-stream') {
        throw new Error(`Generated audio returned an unexpected content type: ${contentType}`);
      }

      const buffer = await readResponseWithLimit(response);
      assertAudioSignature(buffer, audioFormat);
      return buffer;
    }

    throw new Error('Generated audio URL exceeded the redirect limit');
  } finally {
    clearTimeout(timeout);
  }
}

/** 仅重试安全的 GET 下载，不重试会计费的音乐生成请求。 */
export async function downloadGeneratedAudio(
  content: string,
  audioFormat: AudioFormat,
  fetchImplementation: typeof fetch = fetch,
  lookupImplementation: HostnameLookup = lookupHostAddresses
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await downloadGeneratedAudioOnce(content, audioFormat, fetchImplementation, lookupImplementation);
    } catch (error) {
      const status = (error as { statusCode?: number })?.statusCode;
      const transient =
        error instanceof TypeError ||
        (error instanceof Error && error.name === 'AbortError') ||
        status === 429 ||
        (status !== undefined && status >= 500);
      if (attempt === 0 && transient) {
        console.warn('[song-workflow] Audio download interrupted; retrying transfer only.');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          'Audio download timed out after two transfer attempts. The generated audio checkpoint was preserved; retry saving audio, not music generation.'
        );
      }
      throw error;
    }
  }
  throw new Error('Audio download failed');
}

export async function materializeGeneratedAudio(
  content: string,
  outputFormat: OutputFormat,
  audioFormat: AudioFormat,
  fetchImplementation: typeof fetch = fetch
) {
  return outputFormat === 'hex'
    ? decodeGeneratedAudioHex(content, audioFormat)
    : downloadGeneratedAudio(content, audioFormat, fetchImplementation);
}

export interface BackgroundProcessResult {
  success: boolean;
  retryable?: boolean;
  skipped?: boolean;
  processingStatus?: string | null;
  audioUrl?: string;
  coverImageUrl?: string;
  error?: string;
}

/**
 * 对已经永久保存的音频、封面与元数据执行独立成品门禁。
 * 该步骤不调用生成模型，可在修复元数据或重新生成封面后单独重试。
 */
export async function runPersistedSongProductCheck({
  songId,
  userId,
  attemptId,
  coverFallback = false,
  coverDimensions = null,
}: {
  songId: string;
  userId?: string;
  attemptId?: string;
  coverFallback?: boolean;
  coverDimensions?: { width: number; height: number } | null;
}) {
  const db = await getDb();
  const attemptFilter = attemptId
    ? and(eq(generationAttempt.songId, songId), eq(generationAttempt.id, attemptId))
    : eq(generationAttempt.songId, songId);
  const whereClause = userId ? and(attemptFilter, eq(songTable.userId, userId)) : attemptFilter;
  const [record] = await db
    .select({
      attemptId: generationAttempt.id,
      title: songTable.title,
      lyrics: songTable.lyrics,
      audioUrl: songTable.audioUrl,
      audioKey: songTable.audioKey,
      coverImageUrl: songTable.coverImageUrl,
      coverImageKey: songTable.coverImageKey,
      durationSec: songTable.durationSec,
      sourceUrl: storyTable.sourceUrl,
      sourceText: storyTable.sourceText,
      sourceSummary: storyTable.newsSummary,
    })
    .from(generationAttempt)
    .innerJoin(songTable, eq(songTable.id, generationAttempt.songId))
    .leftJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .where(whereClause)
    .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
    .limit(1);
  if (!record) throw new Error('Song product assets do not exist');

  // 兼容旧任务：将已经可以无损恢复的 HTML/转义换行统一回写，避免成品门禁误杀并要求重新付费生成。
  const normalizedLyrics = normalizeStructuredLyrics(record.lyrics || '').trim();
  if (normalizedLyrics && normalizedLyrics !== record.lyrics) {
    await db
      .update(songTable)
      .set({ lyrics: normalizedLyrics, updatedAt: new Date() })
      .where(userId ? and(eq(songTable.id, songId), eq(songTable.userId, userId)) : eq(songTable.id, songId));
  }

  const workflowRun = await getWorkflowRunBySongId(songId);
  const stepId = workflowRun ? await startWorkflowStage(workflowRun.id, 'checking_product') : undefined;
  const result = inspectSongProduct({
    ...record,
    lyrics: normalizedLyrics || record.lyrics,
    coverFallback,
    coverDimensions,
  });

  await db
    .update(generationAttempt)
    .set({
      processingStatus: result.passed ? 'completed' : 'failed_quality_check',
      processingError: result.passed ? null : result.issues.join(' | '),
      updatedAt: new Date(),
    })
    .where(and(eq(generationAttempt.id, record.attemptId), eq(generationAttempt.songId, songId)));

  if (workflowRun && stepId) {
    if (result.passed) {
      await completeWorkflowStage(workflowRun.id, stepId, 'checking_product', {
        nextStage: 'publish_ready',
        runStatus: 'completed',
        metadata: result,
      });
    } else {
      await failWorkflowStep(workflowRun.id, stepId, new Error(`Product check failed: ${result.issues.join(' | ')}`));
    }
  }

  return result;
}

export async function failActiveMusicJob(songId: string, error: unknown, expectedAttemptId?: string) {
  const message = getErrorMessage(error);
  try {
    const db = await getDb();
    const [attempt] = await db
      .select({ id: generationAttempt.id })
      .from(generationAttempt)
      .where(eq(generationAttempt.songId, songId))
      .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
      .limit(1);
    if (!attempt || (expectedAttemptId && attempt.id !== expectedAttemptId)) return message;

    await db
      .update(generationAttempt)
      .set({
        processingStatus: 'failed_internal_error',
        processingError: message,
        updatedAt: new Date(),
      })
      .where(
        and(eq(generationAttempt.id, attempt.id), inArray(generationAttempt.processingStatus, [...ACTIVE_JOB_STATUSES]))
      );
  } catch (dbError) {
    console.error(`[song-workflow] Unable to persist unexpected terminal status for ${songId}:`, dbError);
  }

  return message;
}

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown generation error');
  return message.slice(0, 2000);
}

async function removeUploads(keys: Array<string | null | undefined>) {
  await Promise.all(
    keys
      .filter((key): key is string => !!key)
      .map((key) =>
        deleteFile(key).catch((error) => {
          console.error(`[song-workflow] Failed to remove orphaned upload ${key}:`, error);
        })
      )
  );
}

/**
 * 原子领取并执行一个已持久化的音乐任务。
 * 外部 API 调用均发生在短暂的 CAS 更新之后，不在数据库事务或锁内执行。
 */
export async function processMusicJob(
  songId: string,
  options: { coverOnly?: boolean; stageBoundary?: boolean; expectedAttemptId?: string } = {}
): Promise<BackgroundProcessResult> {
  const db = await getDb();
  const startedAt = performance.now();

  let job: Awaited<ReturnType<typeof claimMusicJob>>;
  try {
    job = await claimMusicJob(songId, options.coverOnly, options.expectedAttemptId);
  } catch (error) {
    return {
      success: false,
      retryable: true,
      error: `Unable to claim generation job: ${getErrorMessage(error)}`,
    };
  }

  if (!job) {
    let existing: { processingStatus: string | null } | undefined;
    try {
      [existing] = await db
        .select({ processingStatus: generationAttempt.processingStatus })
        .from(generationAttempt)
        .where(eq(generationAttempt.songId, songId))
        .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
        .limit(1);
    } catch (error) {
      return {
        success: false,
        retryable: true,
        error: `Unable to inspect generation job: ${getErrorMessage(error)}`,
      };
    }
    const processingStatus = existing?.processingStatus || null;
    const isCompleted = processingStatus === 'completed' || processingStatus === 'completed_without_cover';

    return {
      success:
        isCompleted ||
        processingStatus === 'processing' ||
        processingStatus === 'generating_audio' ||
        processingStatus === 'audio_generated' ||
        processingStatus === 'uploading_audio' ||
        processingStatus === 'audio_uploaded' ||
        processingStatus === 'generating_cover' ||
        processingStatus === 'finalizing',
      skipped: true,
      processingStatus,
      error: existing ? undefined : 'Generation job does not exist',
    };
  }

  const failJob = async (processingStatus: string, error: unknown) => {
    const message = getErrorMessage(error);
    try {
      await db
        .update(generationAttempt)
        .set({
          processingStatus,
          processingError: message,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(generationAttempt.id, job.attemptId),
            eq(generationAttempt.songId, job.id),
            inArray(generationAttempt.processingStatus, [...ACTIVE_JOB_STATUSES])
          )
        );
    } catch (dbError) {
      console.error(`[song-workflow] Unable to persist terminal status for ${job.id}:`, dbError);
    }
    return { success: false, processingStatus, error: message } satisfies BackgroundProcessResult;
  };

  if (job.generationBillingMode !== 'internal_admin') {
    return failJob('failed_internal_error', 'Unsupported generation billing mode');
  }

  if (!job.lyrics || !job.generationPrompt) {
    return failJob('failed_internal_error', 'Generation job is missing trusted model inputs');
  }
  if (!['url', 'hex'].includes(job.outputFormat) || !['mp3', 'wav', 'pcm'].includes(job.audioFormat)) {
    return failJob('failed_internal_error', 'Generation job contains an unsupported audio format');
  }

  let workflowRun: Awaited<ReturnType<typeof getWorkflowRunBySongId>>;
  try {
    workflowRun = await getWorkflowRunBySongId(job.id);
  } catch (error) {
    // 查询故障不是“没有恢复记录”，不能因此重新调用付费模型。
    return failJob('failed_audio_upload', error);
  }
  let activeWorkflowStep: string | undefined;
  const continueAt = async (stage: 'audio_generated' | 'audio_uploaded'): Promise<BackgroundProcessResult> => {
    const [saved] = await db
      .update(generationAttempt)
      .set({ processingStatus: stage, updatedAt: new Date() })
      .where(
        and(
          eq(generationAttempt.id, job.attemptId),
          eq(generationAttempt.processingStatus, stage === 'audio_generated' ? 'generating_audio' : 'uploading_audio')
        )
      )
      .returning({ id: generationAttempt.id });
    if (!saved) return { success: true, skipped: true, processingStatus: stage };
    try {
      await enqueueMusicContinuation(job.id, job.attemptId, stage);
      return { success: true, processingStatus: stage };
    } catch (error) {
      // 恢复点已经落库，当前消息重投只会接续下一阶段，不会重做付费音乐生成。
      return { success: false, retryable: true, processingStatus: stage, error: getErrorMessage(error) };
    }
  };
  const startStage = async (
    stage: 'generating_audio' | 'uploading_audio' | 'generating_cover' | 'finalizing' | 'checking_product',
    provider?: string,
    model?: string
  ) => {
    if (!workflowRun) return undefined;
    activeWorkflowStep = await startWorkflowStage(workflowRun.id, stage, { provider, model });
    return activeWorkflowStep;
  };
  const failStage = async (error: unknown) => {
    if (!workflowRun || !activeWorkflowStep) return;
    await failWorkflowStep(workflowRun.id, activeWorkflowStep, error).catch((persistenceError) => {
      console.error(`[song-workflow] Unable to persist workflow failure for ${job.id}:`, persistenceError);
    });
  };

  const audioFormat = job.audioFormat as AudioFormat;
  const descriptor = getAudioFileDescriptor(audioFormat);
  let audioUpload: Awaited<ReturnType<typeof uploadFile>>;

  if (job.claimedFrom === 'audio_uploaded') {
    if (!job.audioUrl || !job.audioKey) {
      return failJob('failed_internal_error', 'Audio resume checkpoint is missing its stored audio asset');
    }
    audioUpload = { url: job.audioUrl, key: job.audioKey };
  } else {
    let generatedAudioContent: string;
    let generatedOutputFormat: OutputFormat;
    const inputHash = audioInputHash(job.lyrics, job.generationPrompt, audioFormat);
    let checkpoint: string | null;
    try {
      checkpoint = workflowRun ? await findAudioCheckpoint(workflowRun.id, inputHash) : null;
    } catch (error) {
      // 读取恢复点失败时停止，不能将数据库异常误当成需要重新付费生成。
      return failJob('failed_audio_upload', error);
    }
    if (checkpoint) {
      generatedAudioContent = checkpoint;
      generatedOutputFormat = 'url';
      console.info('[song-workflow] Resuming saved provider audio; skipping music generation.');
    } else {
      if (job.claimedFrom === 'audio_generated') {
        return failJob(
          'failed_audio_upload',
          'Saved provider audio checkpoint is unavailable. Automatic regeneration is disabled.'
        );
      }
      await startStage('generating_audio', 'minimax', MINIMAX_MUSIC_MODEL);
      try {
        const { generateMusic } = await import('@/ai/music/lib/generation');
        const musicResult = await generateMusic({
          prompt: job.generationPrompt,
          lyrics: job.lyrics,
          outputFormat: options.stageBoundary ? 'url' : (job.outputFormat as OutputFormat),
          audioFormat: job.audioFormat as AudioFormat,
          stream: false,
        });
        if (!musicResult.success || !musicResult.audioContent) {
          throw new Error(musicResult.error || 'Music provider returned no audio');
        }
        generatedAudioContent = musicResult.audioContent;
        generatedOutputFormat = (musicResult.outputFormat ||
          (options.stageBoundary ? 'url' : job.outputFormat)) as OutputFormat;
      } catch (error) {
        console.error(`[song-workflow] Music generation failed for ${job.id}:`, error);
        await failStage(error);
        return failJob('failed_generation', error);
      }

      try {
        if (workflowRun && activeWorkflowStep) {
          await completeWorkflowStage(workflowRun.id, activeWorkflowStep, 'generating_audio', {
            nextStage: 'uploading_audio',
            metadata: {
              outputFormat: generatedOutputFormat,
              audioInputHash: inputHash,
              ...(generatedOutputFormat === 'url' ? { generatedAudioUrl: generatedAudioContent } : {}),
            },
          });
        }
      } catch (error) {
        // 模型已经成功；恢复点写入失败不能归类为可重新生成的模型失败。
        await failStage(error);
        return failJob('failed_audio_upload', error);
      }
      if (options.stageBoundary && workflowRun && generatedOutputFormat === 'url') {
        return continueAt('audio_generated');
      }
    }

    await startStage('uploading_audio');
    try {
      const buffer = await materializeGeneratedAudio(generatedAudioContent, generatedOutputFormat, audioFormat);
      audioUpload = await uploadFile(
        buffer,
        `song-${job.id}.${descriptor.extension}`,
        descriptor.mimeType,
        `songs/${job.userId}`
      );
      await db.transaction(async (tx) => {
        await tx
          .update(songTable)
          .set({
            audioUrl: audioUpload.url,
            audioKey: audioUpload.key,
            updatedAt: new Date(),
          })
          .where(and(eq(songTable.id, job.id), eq(songTable.userId, job.userId)));
        await tx
          .update(generationAttempt)
          .set({
            processingStatus: options.stageBoundary ? 'uploading_audio' : 'audio_uploaded',
            processingError: null,
            updatedAt: new Date(),
          })
          .where(and(eq(generationAttempt.id, job.attemptId), eq(generationAttempt.songId, job.id)));
      });
    } catch (error) {
      console.error(`[song-workflow] Audio upload failed for ${job.id}:`, error);
      await failStage(error);
      return failJob('failed_audio_upload', error);
    }
    if (workflowRun && activeWorkflowStep) {
      await completeWorkflowStage(workflowRun.id, activeWorkflowStep, 'uploading_audio', {
        nextStage: 'audio_uploaded',
        metadata: { audioFormat, storageKey: audioUpload.key },
      });
    }
    if (options.stageBoundary) return continueAt('audio_uploaded');
  }

  await startStage('generating_cover', 'openrouter');
  let coverUpload: Awaited<ReturnType<typeof uploadFile>> | null = null;
  const coverFallback = false;
  let coverDimensions: { width: number; height: number } | null = null;
  try {
    await db
      .update(generationAttempt)
      .set({ processingStatus: 'generating_cover', updatedAt: new Date() })
      .where(and(eq(generationAttempt.id, job.attemptId), eq(generationAttempt.songId, job.id)));
    const asset = await prepareCoverAsset({
      songId: job.id,
      userId: job.userId,
      title: job.title,
      lyrics: job.lyrics || '',
      sourceText: job.sourceText?.trim() || job.newsSummary?.trim() || job.title,
      artPrompt: job.coverArtPrompt || undefined,
      previousCoverKey: job.coverImageKey,
    });
    coverDimensions = asset.dimensions;
    coverUpload = asset;
  } catch (error) {
    // 音频已持久化；封面失败必须停在真实失败阶段，不能伪装完成后才被发布检查拦截。
    const failure = new Error(
      `Audio is saved. ${getErrorMessage(error)} Retry cover only; music will not be regenerated.`
    );
    console.warn(`[song-workflow] Cover failed for ${job.id}:`, getErrorMessage(error));
    await failStage(failure);
    return failJob('failed_cover', failure);
  }
  if (workflowRun && activeWorkflowStep) {
    await completeWorkflowStage(workflowRun.id, activeWorkflowStep, 'generating_cover', {
      nextStage: 'finalizing',
      metadata: { fallback: coverFallback, storageKey: coverUpload?.key || null },
    });
  }

  const finalCoverUrl = coverUpload?.url || job.coverImageUrl || FALLBACK_COVER_URL;
  const finalCoverKey = coverUpload?.key || job.coverImageKey || null;
  await startStage('finalizing');
  let finalized: { id: string } | undefined;
  try {
    finalized = await db.transaction(async (tx) => {
      const [finalizingAttempt] = await tx
        .update(generationAttempt)
        .set({
          processingStatus: 'finalizing',
          processingError: null,
          creditError: null,
          // 管理员生产使用内部成本账本，不进入用户积分结算。
          creditsDeducted: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(generationAttempt.id, job.attemptId),
            eq(generationAttempt.songId, job.id),
            inArray(generationAttempt.processingStatus, ['audio_uploaded', 'generating_cover', 'finalizing'])
          )
        )
        .returning({ id: generationAttempt.id });

      if (!finalizingAttempt) return undefined;

      const [updatedSong] = await tx
        .update(songTable)
        .set({
          audioUrl: audioUpload.url,
          audioKey: audioUpload.key,
          coverImageUrl: finalCoverUrl,
          coverImageKey: finalCoverKey,
          updatedAt: new Date(),
        })
        .where(and(eq(songTable.id, job.id), eq(songTable.userId, job.userId)))
        .returning({ id: songTable.id });

      if (!updatedSong) throw new Error('Song disappeared before generation completed');
      return updatedSong;
    });
  } catch (error) {
    await failStage(error);
    return failJob('failed_internal_error', error);
  }

  if (!finalized) {
    await failStage('Generation job was deleted, cancelled, or expired before completion');
    return {
      success: false,
      processingStatus: 'failed_internal_error',
      error: 'Generation job was deleted, cancelled, or expired before completion',
    };
  }

  if (workflowRun && activeWorkflowStep) {
    await completeWorkflowStage(workflowRun.id, activeWorkflowStep, 'finalizing', {
      nextStage: 'checking_product',
      metadata: { coverFallback },
    });
  }

  const productCheck = await runPersistedSongProductCheck({
    songId: job.id,
    userId: job.userId,
    attemptId: job.attemptId,
    coverFallback,
    coverDimensions,
  });
  if (!productCheck.passed) {
    return {
      success: false,
      processingStatus: 'failed_quality_check',
      error: `Product check failed: ${productCheck.issues.join(' | ')}`,
    };
  }

  await removeUploads([
    job.audioKey && job.audioKey !== audioUpload.key ? job.audioKey : null,
    job.coverImageKey && coverUpload?.key && job.coverImageKey !== coverUpload.key ? job.coverImageKey : null,
  ]);

  console.log(
    `[song-workflow] Completed ${job.id} in ${Math.round(performance.now() - startedAt)}ms (internal admin billing)`
  );
  return {
    success: true,
    processingStatus: 'completed',
    audioUrl: audioUpload.url,
    coverImageUrl: finalCoverUrl,
  };
}

async function claimMusicJob(songId: string, coverOnly = false, expectedAttemptId?: string) {
  const db = await getDb();
  const [candidate] = await db
    .select({ attemptId: generationAttempt.id, processingStatus: generationAttempt.processingStatus })
    .from(generationAttempt)
    .innerJoin(songTable, eq(songTable.id, generationAttempt.songId))
    .where(and(eq(generationAttempt.songId, songId), eq(songTable.isAdminGenerated, true)))
    .orderBy(desc(generationAttempt.createdAt), desc(generationAttempt.id))
    .limit(1);

  if (!candidate) return undefined;
  if (expectedAttemptId && candidate.attemptId !== expectedAttemptId) return undefined;
  // 维护恢复明确只补封面时，即便任务状态发生竞争，也绝不领取新的音乐生成任务。
  if (coverOnly && candidate.processingStatus !== 'audio_uploaded') return undefined;

  const claimableStatus =
    candidate.processingStatus === 'audio_uploaded'
      ? 'audio_uploaded'
      : candidate.processingStatus === 'audio_generated'
        ? 'audio_generated'
        : 'queued';
  const claimedStatus =
    claimableStatus === 'audio_uploaded'
      ? 'generating_cover'
      : claimableStatus === 'audio_generated'
        ? 'uploading_audio'
        : 'generating_audio';

  const [claimedAttempt] = await db
    .update(generationAttempt)
    .set({
      processingStatus: claimedStatus,
      processingError: null,
      updatedAt: new Date(),
    })
    .where(and(eq(generationAttempt.id, candidate.attemptId), eq(generationAttempt.processingStatus, claimableStatus)))
    .returning({
      attemptId: generationAttempt.id,
      prompt: generationAttempt.prompt,
      generationPrompt: generationAttempt.generationPrompt,
      coverArtPrompt: generationAttempt.coverArtPrompt,
      outputFormat: generationAttempt.outputFormat,
      audioFormat: generationAttempt.audioFormat,
      generationBillingMode: generationAttempt.generationBillingMode,
    });

  if (!claimedAttempt) return undefined;

  const [job] = await db
    .select({
      id: songTable.id,
      userId: songTable.userId,
      title: songTable.title,
      lyrics: songTable.lyrics,
      audioUrl: songTable.audioUrl,
      audioKey: songTable.audioKey,
      coverImageUrl: songTable.coverImageUrl,
      coverImageKey: songTable.coverImageKey,
      sourceText: storyTable.sourceText,
      newsSummary: storyTable.newsSummary,
      sourceUrl: storyTable.sourceUrl,
      durationSec: songTable.durationSec,
    })
    .from(songTable)
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .where(eq(songTable.id, songId))
    .limit(1);

  if (!job) {
    await db
      .update(generationAttempt)
      .set({
        processingStatus: 'failed_internal_error',
        processingError: 'Song or source story does not exist',
        updatedAt: new Date(),
      })
      .where(eq(generationAttempt.id, claimedAttempt.attemptId));
    return undefined;
  }

  return { ...job, ...claimedAttempt, claimedFrom: claimableStatus };
}
