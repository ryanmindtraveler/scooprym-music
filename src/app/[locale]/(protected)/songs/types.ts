export interface SongItem {
  id: string;
  title: string;
  createdAt: Date;
  durationSec: number | null;
  plays: number;
  audioUrl?: string | null;
  category?: string | null;
  coverImageUrl?: string | null;
  lyrics?: string | null;
  prompt?: string | null;
  sourceText?: string | null;
  sourceUrl?: string | null;
  newsSummary?: string | null;
  isPublished?: boolean;
}
