const ACTIVE_STATUSES = new Set([
  'queued',
  'processing',
  'generating_audio',
  'uploading_audio',
  'audio_uploaded',
  'generating_cover',
  'finalizing',
]);

/** 队列区分资源缺失与模型失败，不能把所有失败都显示成音频生成失败。 */
export function getFailedProductionLabel(retryableStage?: string, hasAudio = false) {
  if (retryableStage === 'generating_cover' && hasAudio) return 'Audio saved · cover missing';
  if (retryableStage === 'uploading_audio') return 'Audio transfer failed';
  if (retryableStage === 'checking_product' || retryableStage === 'finalizing') return 'Release check needs attention';
  return hasAudio ? 'Audio saved · production needs attention' : 'Audio production needs attention';
}

/** 成品检查发现缺封面时，应补封面而不是反复检查同一份残缺成品。 */
export function resolveProductionRetryStage(
  status: string | null,
  stage: string,
  hasAudio: boolean,
  hasCover: boolean
) {
  if (!status?.startsWith('failed')) return undefined;
  if (hasAudio && !hasCover) return 'generating_cover';
  return stage;
}

/** 重试不能隐式重复已经成功的付费音乐生成。 */
export function planMusicRetry(status: string | null, hasStoredAudio: boolean, hasCheckpoint: boolean) {
  if (ACTIVE_STATUSES.has(status || '')) return { error: 'This music stage is already running' } as const;
  if (status === 'completed') return { error: 'This song is already complete. No retry is needed.' } as const;
  if (hasStoredAudio) return { resumeStatus: 'audio_uploaded' } as const;
  if (status === 'failed_audio_upload' && !hasCheckpoint) {
    return {
      error:
        'The old audio transfer failed without a saved download checkpoint. Automatic regeneration is disabled to avoid another music charge. Create a new version explicitly if needed.',
    } as const;
  }
  return { resumeStatus: 'queued' } as const;
}
