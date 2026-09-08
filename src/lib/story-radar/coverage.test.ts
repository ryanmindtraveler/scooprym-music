import { describe, expect, it } from 'vitest';
import { groupSimilarCoverage, isSimilarCoverage } from './coverage';

const article = {
  sourceTitle: 'Singer Taylor Swift announces new album after surprise stadium performance',
  sourceDomain: 'a.com',
  publishedAt: '2026-09-07T00:00:00Z',
};
describe('相似报道分组', () => {
  it('跨媒体近似转载合为一组，同时保留所有原始报道', () => {
    const other = { ...article, sourceDomain: 'b.com', sourceTitle: `${article.sourceTitle}!` };
    const groups = groupSimilarCoverage([article, other]);
    expect(groups).toHaveLength(1);
    expect(groups[0].articles).toEqual([article, other]);
  });
  it('相同人物的不同事件、相隔多日、不同人数和否定标题不合并', () => {
    expect(
      isSimilarCoverage(article, {
        ...article,
        sourceTitle: 'Singer Taylor Swift cancels stadium performance after severe storms',
      })
    ).toBe(false);
    expect(isSimilarCoverage(article, { ...article, publishedAt: '2026-08-01' })).toBe(false);
    expect(
      isSimilarCoverage(article, {
        ...article,
        sourceDomain: 'b.com',
        sourceTitle: article.sourceTitle.replace('announces', 'denies'),
      })
    ).toBe(false);
    expect(
      isSimilarCoverage(
        { ...article, sourceTitle: `${article.sourceTitle} for 10 fans` },
        { ...article, sourceDomain: 'b.com', sourceTitle: `${article.sourceTitle} for 100 fans` }
      )
    ).toBe(false);
  });
});
