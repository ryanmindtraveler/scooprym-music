import type { FullSongsBrief } from '../types/full-songs';

export function buildStoryBrief(summary?: string, angle?: string): FullSongsBrief {
  return {
    summary: summary || '',
    angle: angle || '',
  };
}
