export type SongProcessingStatus =
  | 'processing'
  | 'audio_uploaded'
  | 'completed'
  | 'failed_generation'
  | 'processing_queue_failed'
  | 'failed_audio_upload'
  | 'failed_internal_error'
  | 'failed_credit_deduction'
  | 'completed_without_cover';

export type SongClientStatus = 'processing' | 'generating_cover' | 'completed' | 'failed';

export const SONG_FAILURE_PROCESSING_STATUSES: SongProcessingStatus[] = [
  'failed_generation',
  'processing_queue_failed',
  'failed_audio_upload',
  'failed_internal_error',
  'failed_credit_deduction',
];

export interface SongStatusPresentation {
  status: SongClientStatus;
  message: string;
  musicStatus: 'processing' | 'uploaded' | 'failed';
  coverStatus: 'processing' | 'generating' | 'completed' | 'failed' | 'skipped';
}

export function getSongStatusPresentation({
  processingStatus,
  hasAudioKey,
  hasCoverImageUrl,
}: {
  processingStatus?: string | null;
  hasAudioKey?: boolean;
  hasCoverImageUrl?: boolean;
}): SongStatusPresentation {
  switch (processingStatus) {
    case 'processing':
      return {
        status: 'processing',
        message: 'Audio is still processing...',
        musicStatus: 'processing',
        coverStatus: 'processing',
      };
    case 'audio_uploaded':
      return {
        status: 'generating_cover',
        message: 'Audio is ready. Cover art is still generating...',
        musicStatus: 'uploaded',
        coverStatus: 'generating',
      };
    case 'completed':
    case 'completed_without_cover':
      return {
        status: 'completed',
        message: 'Processing completed',
        musicStatus: 'uploaded',
        coverStatus: 'completed',
      };
    case 'failed_audio_upload':
    case 'failed_credit_deduction':
    case 'failed_generation':
    case 'failed_internal_error':
    case 'processing_queue_failed':
      return {
        status: 'failed',
        message: 'Processing failed',
        musicStatus: processingStatus === 'failed_credit_deduction' ? 'uploaded' : 'failed',
        coverStatus: hasCoverImageUrl ? 'completed' : 'failed',
      };
    default:
      if (!hasAudioKey) {
        return {
          status: 'processing',
          message: 'Audio is still processing...',
          musicStatus: 'processing',
          coverStatus: 'processing',
        };
      }

      if (!hasCoverImageUrl) {
        return {
          status: 'generating_cover',
          message: 'Cover art is still generating...',
          musicStatus: 'uploaded',
          coverStatus: 'generating',
        };
      }

      return {
        status: 'completed',
        message: 'Processing completed',
        musicStatus: 'uploaded',
        coverStatus: 'completed',
      };
  }
}
