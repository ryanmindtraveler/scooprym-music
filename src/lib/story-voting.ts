import { getBusinessDayKey, getNextBusinessDayStart, getPreviousBusinessDayKeys } from './business-time';

export const STORY_VOTE_WEIGHTS = [1, 0.6, 0.3] as const;
export const MAX_DAILY_STORY_VOTES = 3;
export const PUBLIC_STORY_CANDIDATE_LIMIT = 10;
export const PREFERRED_STORY_WINDOW_MS = 72 * 60 * 60 * 1_000;
export const RECENT_STORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;

interface RankableStoryCandidate {
  status: string;
  relevanceScore: number;
  publishedAt: Date | null;
}

/**
 * 公开投票池优先最近三天，其次最近七天；不足时用更早的有效候选补满。
 * 分层发生在质量排序之前，避免高分旧闻挤掉正在流行的新话题。
 */
export function rankPublicStoryCandidates<T extends RankableStoryCandidate>(
  candidates: readonly T[],
  now = new Date(),
  limit = PUBLIC_STORY_CANDIDATE_LIMIT
) {
  const preferredCutoff = now.getTime() - PREFERRED_STORY_WINDOW_MS;
  const recentCutoff = now.getTime() - RECENT_STORY_WINDOW_MS;
  const freshnessTier = (publishedAt: Date | null) => {
    const timestamp = publishedAt?.getTime();
    if (!timestamp) return 3;
    if (timestamp >= preferredCutoff) return 0;
    if (timestamp >= recentCutoff) return 1;
    return 2;
  };

  return [...candidates]
    .sort((left, right) => {
      // 1. 管理员手动精选（shortlisted）拥有最高绝对优先级，必定置顶并优先进入投票池
      const leftIsShortlisted = left.status === 'shortlisted';
      const rightIsShortlisted = right.status === 'shortlisted';
      if (leftIsShortlisted !== rightIsShortlisted) return leftIsShortlisted ? -1 : 1;

      // 2. 时间新鲜度分层
      const tierDifference = freshnessTier(left.publishedAt) - freshnessTier(right.publishedAt);
      if (tierDifference !== 0) return tierDifference;

      // 3. 相关性分数与发布时间
      if (left.relevanceScore !== right.relevanceScore) return right.relevanceScore - left.relevanceScore;
      return (right.publishedAt?.getTime() || 0) - (left.publishedAt?.getTime() || 0);
    })
    .slice(0, limit);
}

export function getVoteDay(date = new Date()) {
  return getBusinessDayKey(date);
}

export function getRecentVoteDays(date = new Date()) {
  const businessDays = getPreviousBusinessDayKeys(date, STORY_VOTE_WEIGHTS.length);
  return STORY_VOTE_WEIGHTS.map((weight, index) => ({
    day: businessDays[index],
    weight,
  }));
}

export function getNextVoteReset(date = new Date()) {
  return getNextBusinessDayStart(date);
}
