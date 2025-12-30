export interface GenerateMusicApiResponse {
  success: boolean;
  error?: string;
  song?: {
    id: string;
    title: string;
    audioUrl: string;
    coverImageUrl?: string | null;
  };
  meta?: {
    songId?: string;
    format?: 'url' | 'hex';
  };
  audio?: string;
}

export interface ProcessingStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  musicStatus?: string;
  coverStatus?: string;
  song?: {
    audioUrl?: string;
    coverImageUrl?: string;
  };
}
