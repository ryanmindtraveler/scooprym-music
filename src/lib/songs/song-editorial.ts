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

/** 累计播放榜只按公开歌曲的总播放量排序，同分时以发布时间稳定排序。 */
export function getAllTimeBiggestDrops(songs: Song[], limit = 20) {
  return [...songs]
    .sort((first, second) => {
      const playDifference = second.plays - first.plays;
      if (playDifference !== 0) return playDifference;
      return (
        new Date(second.publishedAt || second.createdAt).getTime() -
        new Date(first.publishedAt || first.createdAt).getTime()
      );
    })
    .slice(0, limit);
}
