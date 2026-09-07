import { describe, expect, it } from 'vitest';
import {
  MAX_DAILY_STORY_VOTES,
  PUBLIC_STORY_CANDIDATE_LIMIT,
  getNextVoteReset,
  getRecentVoteDays,
  getVoteDay,
  rankPublicStoryCandidates,
} from './story-voting';

describe('story voting calendar', () => {
  it('uses California calendar days for daily ballots', () => {
    const now = new Date('2026-08-28T06:59:30.000Z');
    expect(getVoteDay(now)).toBe('2026-08-27');
    expect(getNextVoteReset(now).toISOString()).toBe('2026-08-28T07:00:00.000Z');
  });

  it('returns the rolling three-day vote weights', () => {
    expect(getRecentVoteDays(new Date('2026-08-27T12:00:00.000Z'))).toEqual([
      { day: '2026-08-27', weight: 1 },
      { day: '2026-08-26', weight: 0.6 },
      { day: '2026-08-25', weight: 0.3 },
    ]);
  });

  it('limits one daily ballot to three stories', () => {
    expect(MAX_DAILY_STORY_VOTES).toBe(3);
  });
});

describe('public story candidate ranking', () => {
  it('fills the public ballot to ten with older eligible stories after fresh stories', () => {
    const now = new Date('2026-08-31T12:00:00.000Z');
    const candidates = Array.from({ length: 14 }, (_, index) => ({
      id: `story-${index}`,
      status: index === 0 ? 'shortlisted' : 'new',
      relevanceScore: 100 - index,
      publishedAt: new Date(now.getTime() - index * 24 * 60 * 60 * 1_000),
    }));

    const ranked = rankPublicStoryCandidates(candidates, now);

    expect(ranked).toHaveLength(PUBLIC_STORY_CANDIDATE_LIMIT);
    expect(ranked.map((candidate) => candidate.id)).toEqual([
      'story-0',
      'story-1',
      'story-2',
      'story-3',
      'story-4',
      'story-5',
      'story-6',
      'story-7',
      'story-8',
      'story-9',
    ]);
  });

  it('keeps undated candidates behind dated candidates', () => {
    const now = new Date('2026-08-31T12:00:00.000Z');
    const ranked = rankPublicStoryCandidates(
      [
        { id: 'unknown', status: 'shortlisted', relevanceScore: 100, publishedAt: null },
        { id: 'old', status: 'new', relevanceScore: 1, publishedAt: new Date('2026-01-01T00:00:00.000Z') },
      ],
      now
    );

    expect(ranked.map((candidate) => candidate.id)).toEqual(['old', 'unknown']);
  });
});
