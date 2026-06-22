export type FullSongsSourceMode = 'link' | 'topic' | 'story' | 'mixed';

export interface FullSongsBrief {
  summary: string;
  angle: string;
}

export interface FullSongsPromptBundle {
  musicDirectionPrompt: string;
  lyricsWritingPrompt?: string;
  musicProductionPrompt?: string;
  coverArtPrompt?: string;
}
