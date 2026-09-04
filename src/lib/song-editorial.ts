import type { Song } from '@/types/song';

const MAX_HEADLINE_LENGTH = 84;

function cleanNewsText(value?: string | null) {
  return (
    value
      ?.replace(/\[[^\]]+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || ''
  );
}

function splitNewsLead(value: string) {
  const sentenceBoundaries = value.matchAll(/[.!?](?:\s+|$)/g);

  for (const boundary of sentenceBoundaries) {
    const end = (boundary.index ?? 0) + 1;
    const candidate = value.slice(0, end).trim();
    const lastToken = candidate.split(/\s+/).at(-1) || '';
    const isAbbreviation = /^(?:[A-Z]\.){2,}$/.test(lastToken) || /^(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs)\.$/i.test(lastToken);

    if (!isAbbreviation && value.slice(end).trim()) {
      return {
        headline: candidate,
        followUp: value.slice(end).trim(),
      };
    }
  }

  return { headline: value, followUp: '' };
}

/**
 * 首页紧凑内容位默认限制标题；Archive 等阅读场景可显式保留完整标题。
 */
export function getNewsTitle(song: Song, options: { truncate?: boolean } = {}) {
  const sourceText = cleanNewsText(song.sourceText);
  const summary = cleanNewsText(song.newsSummary);
  const title = splitNewsLead(summary || sourceText).headline || 'The internet did what?';
  const shouldTruncate = options.truncate ?? true;

  if (!shouldTruncate || title.length <= MAX_HEADLINE_LENGTH) return title;

  return `${title.slice(0, MAX_HEADLINE_LENGTH - 3).trimEnd()}…`;
}

export function getNewsDescription(song: Song) {
  const sourceText = cleanNewsText(song.sourceText);
  const summary = cleanNewsText(song.newsSummary);
  const summaryFollowUp = splitNewsLead(summary).followUp;

  if (summaryFollowUp) {
    return summaryFollowUp;
  }

  if (sourceText && sourceText !== summary) {
    const description =
      summary && sourceText.startsWith(summary) ? sourceText.slice(summary.length).trim() : sourceText;
    if (description) return description;
  }

  return 'A strange true story, distilled from the original report.';
}

/**
 * 周榜使用滚动最近 7 天的真实播放记录排序；周播放量相同时，
 * 累计播放量更高的内容优先，最后以发布时间作为稳定排序依据。
 */
export function getWeeklyBiggestDrops(songs: Song[], limit = 5) {
  return songs
    .filter((song) => (song.weeklyPlays ?? 0) > 0)
    .sort((first, second) => {
      const weeklyDifference = (second.weeklyPlays ?? 0) - (first.weeklyPlays ?? 0);
      if (weeklyDifference !== 0) return weeklyDifference;

      const totalDifference = second.plays - first.plays;
      if (totalDifference !== 0) return totalDifference;

      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    })
    .slice(0, limit);
}
