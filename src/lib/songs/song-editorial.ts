import type { Song } from '@/types/song';

const MAX_HEADLINE_LENGTH = 84;

/** 旧版长摘要仅缩短卡片预览，完整内容仍保留在歌曲数据中。 */
export function getNewsCardSummary(song: Pick<Song, 'newsSummary' | 'sourceText'>) {
  const text = cleanNewsText(song.newsSummary);
  if (!text) return 'The internet has delivered another story too strange to ignore.';
  if (text.length <= 200) return text;
  const firstSentence = splitNewsLead(text).headline;
  if (firstSentence.length <= 200) return firstSentence;
  const preview = text.slice(0, 199);
  const boundary = preview.lastIndexOf(' ');
  return `${(boundary > 0 ? preview.slice(0, boundary) : preview).trimEnd()}…`;
}

function cleanNewsText(value?: string | null) {
  return (
    value
      ?.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\[[^\]]+\]/g, '')
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
  const summary = cleanNewsText(song.newsSummary);
  const title = splitNewsLead(summary).headline || cleanNewsText(song.title) || 'The internet did what?';
  const shouldTruncate = options.truncate ?? true;

  if (!shouldTruncate || title.length <= MAX_HEADLINE_LENGTH) return title;

  return `${title.slice(0, MAX_HEADLINE_LENGTH - 3).trimEnd()}…`;
}

export function getNewsDescription(song: Song) {
  const summary = cleanNewsText(song.newsSummary);
  const summaryFollowUp = splitNewsLead(summary).followUp;

  if (summaryFollowUp) {
    return getNewsCardSummary({ newsSummary: summaryFollowUp });
  }

  // 原始抓取素材可能包含导航、广告和媒体链接，不能作为公开背景兜底。
  return '';
}

/**
 * 周榜使用滚动最近 7 天的真实播放记录排序；周播放量相同时，
 * 累计播放量更高的内容优先，最后以发布时间作为稳定排序依据。
 * 如果周播放量记录不足，自动从曲库中补充高热度歌曲，确保数量充实。
 */
export function getWeeklyBiggestDrops(songs: Song[], limit = 16) {
  const sorted = [...songs].sort((first, second) => {
    const weeklyDifference = (second.weeklyPlays ?? 0) - (first.weeklyPlays ?? 0);
    if (weeklyDifference !== 0) return weeklyDifference;

    const totalDifference = second.plays - first.plays;
    if (totalDifference !== 0) return totalDifference;

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });

  const withWeeklyPlays = sorted.filter((song) => (song.weeklyPlays ?? 0) > 0);
  if (withWeeklyPlays.length >= limit) return withWeeklyPlays.slice(0, limit);

  // 如果带周播放量的歌曲不足，自动补充其余已发布歌曲
  const seenIds = new Set(withWeeklyPlays.map((s) => s.id));
  const remaining = sorted.filter((s) => !seenIds.has(s.id));
  return [...withWeeklyPlays, ...remaining].slice(0, limit);
}
