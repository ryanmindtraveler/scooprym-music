import { fetchGdeltBatch } from './gdelt';
import { fetchGoogleTrendsBatches } from './google-trends';
import { fetchRssStoryCandidates } from './rss';
import type { RadarCollection, RadarSourceBatch, StoryRadarCandidate } from './types';

export function mergeRadarBatches(batches: RadarSourceBatch[]): RadarCollection {
  const deduplicated = new Map<string, StoryRadarCandidate>();
  for (const candidate of batches.flatMap((batch) => batch.candidates)) {
    const existing = deduplicated.get(candidate.sourceUrl);
    if (!existing) {
      deduplicated.set(candidate.sourceUrl, candidate);
    } else {
      // 媒体原始订阅优先提供标题及日期，Trends 补充发现线索，不抢占来源。
      const preferred =
        existing.provider === 'google-trends' && candidate.provider !== 'google-trends'
          ? candidate
          : candidate.provider === 'google-trends' && existing.provider !== 'google-trends'
            ? existing
            : candidate.relevanceScore > existing.relevanceScore
              ? candidate
              : existing;
      const signals = new Map(
        [...(existing.trendSignals ?? []), ...(candidate.trendSignals ?? [])].map((signal) => [
          `${signal.region}:${signal.term}`,
          signal,
        ])
      );
      deduplicated.set(candidate.sourceUrl, {
        ...preferred,
        publishedAt: preferred.publishedAt ?? existing.publishedAt ?? candidate.publishedAt,
        trendSignals: signals.size ? [...signals.values()] : undefined,
      });
    }
  }
  const sources = batches.map((batch) => batch.report);
  const enabled = sources.filter((source) => source.status !== 'disabled');
  const failed = enabled.filter((source) => source.status === 'failed').length;
  return {
    // 入库之前不做排名截断；分页和事件分组属于展示层。
    candidates: [...deduplicated.values()],
    sources,
    status: failed === enabled.length ? 'failed' : failed > 0 ? 'partial' : 'completed',
  };
}

export async function collectStoryRadarCandidates() {
  const [rss, gdelt, trends] = await Promise.all([
    fetchRssStoryCandidates(),
    fetchGdeltBatch(),
    fetchGoogleTrendsBatches(),
  ]);
  return mergeRadarBatches([...rss, gdelt, ...trends]);
}
