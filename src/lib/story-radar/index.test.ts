import { describe, expect, it } from 'vitest';
import { mergeRadarBatches } from './index';
import type { RadarSourceBatch } from './types';

function batch(status: RadarSourceBatch['report']['status']): RadarSourceBatch {
  return {
    candidates: [],
    report: {
      name: 'Test',
      url: 'https://example.com',
      status,
      fetched: 0,
      accepted: 0,
      needsReview: 0,
      older: 0,
      invalid: 0,
      latestPublishedAt: null,
      durationMs: 0,
    },
  };
}

describe('跨渠道汇总', () => {
  it('高分旧闻不能把新报道在入库前挤掉', () => {
    const old = batch('ok');
    old.candidates = Array.from({ length: 101 }, (_, index) => ({
      provider: 'rss',
      sourceUrl: `https://example.com/old-${index}`,
      sourceTitle: `Old story ${index}`,
      sourceDomain: 'example.com',
      sourceImageUrl: null,
      category: 'celebrity_drama',
      matchedTerms: ['feud'],
      relevanceScore: 100,
      publishedAt: new Date('2026-01-01'),
    }));
    const fresh = batch('ok');
    fresh.candidates = [
      { ...old.candidates[0], sourceUrl: 'https://example.com/today', publishedAt: new Date(), relevanceScore: 10 },
    ];
    const result = mergeRadarBatches([old, fresh]);
    expect(result.candidates).toHaveLength(102);
    expect(result.candidates.some((candidate) => candidate.sourceUrl.endsWith('/today'))).toBe(true);
  });
  it('正常空结果、部分失败、全部失败和禁用源有不同状态', () => {
    expect(mergeRadarBatches([batch('empty'), batch('disabled')]).status).toBe('completed');
    expect(mergeRadarBatches([batch('ok'), batch('failed')]).status).toBe('partial');
    expect(mergeRadarBatches([batch('failed'), batch('disabled')]).status).toBe('failed');
  });
});
