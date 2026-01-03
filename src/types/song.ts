export interface Song {
  id: string;
  title: string;
  createdAt: Date | string;
  durationSec: number | null;
  plays: number;
  audioUrl?: string | null;
  coverImageUrl?: string | null;
  lyrics?: string | null;
  prompt?: string | null;
  category?: string | null;
  sourceText?: string | null;
  sourceUrl?: string | null;
  newsSummary?: string | null;
  isLiked?: boolean;
  processingStatus?: string | null;
}
