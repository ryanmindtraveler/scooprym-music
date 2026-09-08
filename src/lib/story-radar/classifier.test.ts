import { describe, expect, it } from 'vitest';
import { canonicalizeStoryUrl, classifyStoryHeadline, isIrrelevantStoryTopic, scoreStoryCandidate } from './classifier';

describe('classifyStoryHeadline', () => {
  it('识别连续中文标题中的简繁体关键词', () => {
    expect(classifyStoryHeadline('当红明星公开回应恋情传闻')?.category).toBe('celebrity_drama');
    expect(classifyStoryHeadline('網紅直播翻車引發迷因爆紅')?.category).toBe('internet_chaos');
    expect(classifyStoryHeadline('這場烏龍鬧劇太離譜')?.category).toBe('absurd_headlines');
    expect(classifyStoryHeadline('今日天气晴朗适合出行')).toBeNull();
  });
  it('识别平台事件，并避免子串误报', () => {
    expect(classifyStoryHeadline('TikTok creator banned after livestream prank backfires')?.category).toBe(
      'internet_chaos'
    );
    expect(classifyStoryHeadline('Reddit users debate a YouTube creator’s deleted video')?.category).toBe(
      'internet_chaos'
    );
    expect(classifyStoryHeadline('Toddler reunited with family after missing the bus')).toBeNull();
  });

  it('classifies celebrity conflict without relying on a celebrity name list', () => {
    expect(classifyStoryHeadline('Pop star slams red carpet backlash after viral interview')?.category).toBe(
      'celebrity_drama'
    );
  });

  it('classifies social platform chaos', () => {
    expect(classifyStoryHeadline('TikTok creator goes viral after livestream prank backfires')?.category).toBe(
      'internet_chaos'
    );
  });

  it('classifies absurd incidents', () => {
    expect(classifyStoryHeadline('Bizarre stadium mistake leaves officials with the wrong mascot')?.category).toBe(
      'absurd_headlines'
    );
  });

  it('does not treat a generic response or lawsuit as celebrity drama', () => {
    expect(classifyStoryHeadline('Pilot responds after landing safely in the Atlantic Ocean')).toBeNull();
    expect(classifyStoryHeadline('Convenience store sues a rival over its logo')).toBeNull();
  });
});

describe('canonicalizeStoryUrl', () => {
  it('removes tracking parameters while preserving article parameters', () => {
    expect(canonicalizeStoryUrl('https://example.com/story?id=42&utm_source=rss&fbclid=abc#comments')).toBe(
      'https://example.com/story?id=42'
    );
  });
});

describe('isIrrelevantStoryTopic & scoreStoryCandidate', () => {
  it('identifies obituaries and corporate financial reports as irrelevant', () => {
    expect(isIrrelevantStoryTopic('Famous actor dies at 85 after long illness')).toBe(true);
    expect(isIrrelevantStoryTopic('Obituary: Beloved director remembered')).toBe(true);
    expect(isIrrelevantStoryTopic('Tech giant reports Q3 quarterly earnings results')).toBe(true);
    expect(isIrrelevantStoryTopic('Pop star launches funny roast against rival')).toBe(false);
  });

  it('assigns 0 score to irrelevant news topics', () => {
    const score = scoreStoryCandidate({
      title: 'Actor dies at 78 in hospital',
      domain: 'tmz.com',
      imageUrl: 'https://example.com/img.jpg',
      matchedTerms: ['drama', 'slams'],
      publishedAt: new Date(),
    });
    expect(score).toBe(0);
  });
});
