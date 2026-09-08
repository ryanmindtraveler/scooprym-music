interface CoverageArticle {
  sourceTitle: string;
  sourceDomain: string;
  publishedAt: Date | string | null;
}

function headlineWords(title: string) {
  return (
    title
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[’']/g, '')
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

/** 保守分组近似转载，不删除原始记录；不同数字、否定语义或日期不合并。 */
export function isSimilarCoverage(left: CoverageArticle, right: CoverageArticle) {
  if (!left.publishedAt || !right.publishedAt) return false;
  const distance = Math.abs(new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime());
  if (!Number.isFinite(distance) || distance > 48 * 60 * 60_000) return false;
  const a = headlineWords(left.sourceTitle);
  const b = headlineWords(right.sourceTitle);
  if (a.length < 5 || b.length < 5) return false;
  if (a.join(' ') === b.join(' ')) return true;
  if (left.sourceDomain === right.sourceDomain) return false;
  const anchors = (words: string[]) =>
    words
      .filter((word) => /\d/.test(word) || ['not', 'no', 'never', 'denies', 'denied'].includes(word))
      .sort()
      .join(' ');
  if (anchors(a) !== anchors(b)) return false;
  const stop = new Set(['a', 'an', 'the', 'and', 'of', 'to', 'in', 'on', 'for', 'with', 'at']);
  const leftWords = new Set(a.filter((word) => !stop.has(word)));
  const rightWords = new Set(b.filter((word) => !stop.has(word)));
  const common = [...leftWords].filter((word) => rightWords.has(word)).length;
  const union = new Set([...leftWords, ...rightWords]).size;
  return common >= 6 && common / union >= 0.85;
}

export function groupSimilarCoverage<T extends CoverageArticle>(articles: readonly T[]) {
  const groups: Array<{ primary: T; articles: T[] }> = [];
  for (const article of articles) {
    // 不做传递性合并，防止一串弱相似标题把不同事件串成一组。
    const group = groups.find((entry) => entry.articles.every((member) => isSimilarCoverage(member, article)));
    if (group) group.articles.push(article);
    else groups.push({ primary: article, articles: [article] });
  }
  return groups;
}
