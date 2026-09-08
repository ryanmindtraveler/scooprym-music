import { beforeEach, describe, expect, it, vi } from 'vitest';
const fallback = vi.hoisted(() => vi.fn());
vi.mock('@/ai/text/lib/provider-fallback', () => ({
  runWithTextProviderFallback: fallback,
  getStructuredOutputSettings: () => ({}),
}));
import { screenStoryCandidatesWithAI, validateScreeningResults } from './ai-screener';
const result = { id: 'a', relevanceScore: 80, category: 'internet_chaos', fitReason: 'Good fit', action: 'keep' };
describe('AI 筛选可信输出', () => {
  beforeEach(() => vi.clearAllMocks());
  it('失败不产生虚构评分', async () => {
    fallback.mockRejectedValue(new Error('Provider offline'));
    expect(await screenStoryCandidatesWithAI([{ id: 'a', title: 'test', domain: 'example.com' }])).toEqual({
      evaluations: [],
      failures: [{ id: 'a', error: 'Provider offline' }],
    });
  });
  it('拒绝陌生、遗漏和重复 ID', () => {
    expect(() => validateScreeningResults(['b'], [result])).toThrow();
    expect(() => validateScreeningResults(['a', 'b'], [result, result])).toThrow();
    expect(() => validateScreeningResults(['a', 'b'], [result])).toThrow();
    expect(validateScreeningResults(['a'], [result])).toHaveLength(1);
  });
  it('部分批次失败时只保留真实成功结果', async () => {
    const candidates = Array.from({ length: 16 }, (_, i) => ({ id: String(i), title: 'test', domain: 'example.com' }));
    fallback
      .mockResolvedValueOnce({ object: { evaluations: candidates.slice(0, 15).map((c) => ({ ...result, id: c.id })) } })
      .mockRejectedValueOnce(new Error('timeout'));
    const batch = await screenStoryCandidatesWithAI(candidates);
    expect(batch.evaluations).toHaveLength(15);
    expect(batch.failures).toEqual([{ id: '15', error: 'timeout' }]);
  });
});
