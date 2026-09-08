export type SongProcessingStatus =
  | 'queued'
  | 'processing'
  | 'generating_audio'
  | 'audio_generated'
  | 'uploading_audio'
  | 'audio_uploaded'
  | 'generating_cover'
  | 'finalizing'
  | 'completed'
  | 'failed_generation'
  | 'failed_interrupted'
  | 'failed_cover'
  | 'processing_queue_failed'
  | 'failed_audio_upload'
  | 'failed_quality_check'
  | 'failed_internal_error'
  | 'failed_credit_deduction'
  | 'completed_without_cover';

export type SongClientStatus = 'processing' | 'generating_cover' | 'completed' | 'failed';

export const SONG_FAILURE_PROCESSING_STATUSES: SongProcessingStatus[] = [
  'failed_generation',
  'failed_interrupted',
  'failed_cover',
  'processing_queue_failed',
  'failed_audio_upload',
  'failed_quality_check',
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
    case 'queued':
      return {
        status: 'processing',
        message: 'Your song is queued for generation...',
        musicStatus: 'processing',
        coverStatus: 'processing',
      };
    case 'processing':
    case 'generating_audio':
      return {
        status: 'processing',
        message: 'The track is being composed...',
        musicStatus: 'processing',
        coverStatus: 'processing',
      };
    case 'audio_generated':
    case 'uploading_audio':
      return {
        status: 'processing',
        message: 'The finished audio is being saved...',
        musicStatus: 'processing',
        coverStatus: 'processing',
      };
    case 'audio_uploaded':
    case 'generating_cover':
      return {
        status: 'generating_cover',
        message: 'Audio is ready. Cover art is still generating...',
        musicStatus: 'uploaded',
        coverStatus: 'generating',
      };
    case 'finalizing':
      return {
        status: 'generating_cover',
        message: 'Finalizing the track and cover...',
        musicStatus: 'uploaded',
        coverStatus: hasCoverImageUrl ? 'completed' : 'generating',
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
    case 'failed_quality_check':
    case 'failed_credit_deduction':
    case 'failed_generation':
    case 'failed_interrupted':
    case 'failed_cover':
    case 'failed_internal_error':
    case 'processing_queue_failed':
      return {
        status: 'failed',
        message: 'Processing failed',
        musicStatus:
          processingStatus === 'failed_credit_deduction' || processingStatus === 'failed_quality_check'
            ? 'uploaded'
            : 'failed',
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
