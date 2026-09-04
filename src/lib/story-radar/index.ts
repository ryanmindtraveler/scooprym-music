import { fetchStoryRadarCandidates as fetchGdeltStoryCandidates } from './gdelt';
import { fetchRssStoryCandidates } from './rss';
import type { StoryRadarCandidate } from './types';

export async function collectStoryRadarCandidates() {
  const batches: StoryRadarCandidate[][] = [await fetchRssStoryCandidates()];

  if (process.env.STORY_RADAR_GDELT_ENABLED === 'true') {
    try {
      batches.push(await fetchGdeltStoryCandidates());
    } catch (error) {
      console.warn('GDELT story radar provider is unavailable:', error);
    }
  }

  const deduplicated = new Map<string, StoryRadarCandidate>();
  for (const candidate of batches.flat()) {
    const existing = deduplicated.get(candidate.sourceUrl);
    if (!existing || candidate.relevanceScore > existing.relevanceScore) {
      deduplicated.set(candidate.sourceUrl, candidate);
    }
  }

  return [...deduplicated.values()].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 100);
}
