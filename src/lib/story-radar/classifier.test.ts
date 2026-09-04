import { describe, expect, it } from 'vitest';
import { canonicalizeStoryUrl, classifyStoryHeadline } from './classifier';

describe('classifyStoryHeadline', () => {
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
