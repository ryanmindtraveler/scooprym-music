export const STALLED_MUSIC_MINUTES = 15;
export const RECOVERABLE_MUSIC_STATUSES = [
  'queued',
  'processing',
  'generating_audio',
  'audio_generated',
  'uploading_audio',
  'audio_uploaded',
  'generating_cover',
  'finalizing',
] as const;

/** 只自动接续持久化边界，模型结果不明时必须停止，不能再次付费生成。 */
export function planStalledMusicRecovery(status: string) {
  if (status === 'audio_generated' || status === 'audio_uploaded') return { dispatch: true, status, error: null };
  if (status === 'queued')
    return {
      dispatch: false,
      status: 'processing_queue_failed',
      error: 'Queue delivery stalled. Retry scheduling from Studio.',
    };
  if (status === 'uploading_audio')
    return {
      dispatch: false,
      status: 'failed_audio_upload',
      error: 'Audio transfer was interrupted. Resume the saved audio in Studio.',
    };
  if (status === 'generating_cover' || status === 'finalizing')
    return {
      dispatch: false,
      status: 'failed_cover',
      error: 'Audio is saved. Cover production was interrupted. Inspect the result and retry cover only in Studio.',
    };
  return {
    dispatch: false,
    status: 'failed_interrupted',
    error:
      'Music generation was interrupted; the provider result is unknown. Automatic regeneration is disabled. Check the provider result before explicitly creating a new version.',
  };
}
