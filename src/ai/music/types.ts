/**
 * @file types.ts
 * @description Shared type definitions for Music AI features.
 */

/**
 * Result returned by the internal library function (MiniMax wrapper)
 */
export interface GenerateMusicResult {
  success: boolean;
  audioContent?: string;
  /** 提供商实际返回的载荷类型；可能与请求值不同。 */
  outputFormat?: 'url' | 'hex';
  error?: string;
  details?: string;
  statusCode?: number;
  stream?: ReadableStream<Uint8Array>;
}

/**
 * Response returned by the Next.js API route to the client
 */
export interface GenerateMusicApiResponse {
  success: boolean;
  audio: string; // Audio identifier or content
  song?: {
    id: string;
    title: string;
    coverImageUrl?: string;
    audioUrl?: string;
  };
  meta?: {
    format: string; // 'url' | 'hex'
    songId: string;
  };
  error?: string;
}

/**
 * Status response for polling
 */
export interface ProcessingStatusResponse {
  success: boolean;
  status: 'processing' | 'generating_cover' | 'completed' | 'failed';
  musicStatus: 'processing' | 'uploaded' | 'failed';
  coverStatus: 'processing' | 'generating' | 'completed' | 'failed' | 'skipped';
  creditsDeducted: boolean;
  song?: {
    coverImageUrl?: string;
    audioUrl?: string;
  };
}
