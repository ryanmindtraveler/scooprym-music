/**
 * @file types.ts
 * @description Shared type definitions for Text AI features (Lyrics, Rewrite, Chat, etc.)
 */

export interface GenerateLyricsResponse {
  success: boolean;
  title?: string;
  lyrics?: string;
  summary?: string;
  error?: string;
}

export interface RewriteLyricsResponse {
  success: boolean;
  rewrittenText?: string;
  error?: string;
}

export interface AnalyseContentResponse {
  success: boolean;
  data?: {
    title?: string;
    content?: string;
    summary?: string;
    keywords?: string[];
  };
  error?: string;
}
