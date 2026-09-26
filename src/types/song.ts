export interface Song {
  id: string;
  seoSlug?: string | null;
  seoTopic?: string | null;
  storyId?: string;
  title: string;
  createdAt: Date | string;
  durationSec: number | null;
  plays: number;
  weeklyPlays?: number;
  audioUrl?: string | null;
  coverImageUrl?: string | null;
  lyrics?: string | null;
  prompt?: string | null;
  sourceText?: string | null;
  sourceUrl?: string | null;
  newsSummary?: string | null;
  isLiked?: boolean;
  updatedAt?: Date | string | null;
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string | null;
  processingStatus?: string | null;
  category?: string | null;
  style?: string | null;
  topReaction?: {
    type: import('@/lib/songs/song-reactions').SongReactionType;
    count: number;
  } | null;
}
