import { describe, expect, it } from 'vitest';
import {
  COMMENT_MAX_LENGTH,
  getCommentLength,
  truncateCommentContent,
  validateCommentContent,
} from './comment-moderation';

describe('validateCommentContent', () => {
  it('接受正常八卦吐槽、表情和 Unicode 文本', () => {
    expect(validateCommentContent('This plot twist is completely unhinged 🍿').valid).toBe(true);
    expect(validateCommentContent('这也太离谱了吧 😂').valid).toBe(true);
  });

  it('拒绝空评论和超长评论', () => {
    expect(validateCommentContent('  ').code).toBe('EMPTY');
    expect(validateCommentContent('a'.repeat(COMMENT_MAX_LENGTH + 1)).code).toBe('TOO_LONG');
  });

  it.each([
    'Visit https://spam.example now',
    'Go to www.example.com for more',
    'Find me at spammer@example.com',
    'Use the deal at cheapstuff.xyz',
    'Visit http dot example.com',
    'Visit cheapstuff dot com',
  ])('拒绝网址或联系方式：%s', (content) => {
    expect(validateCommentContent(content).code).toBe('LINK_NOT_ALLOWED');
  });

  it.each([
    'DM me for the deal',
    'Link in my bio',
    'Use my promo code',
    'Telegram: spam_deals',
    '加我微信领取优惠',
    '扫码进群',
  ])('拒绝广告或引流话术：%s', (content) => {
    expect(validateCommentContent(content).code).toBe('ADVERTISING_NOT_ALLOWED');
  });

  it('移除不可见字符后再执行检测', () => {
    expect(validateCommentContent('https:\u200B//spam.example').code).toBe('LINK_NOT_ALLOWED');
  });

  it('按 Unicode 字符安全计数和截断，不拆开表情', () => {
    const emojis = '🔥'.repeat(COMMENT_MAX_LENGTH + 1);
    expect(getCommentLength(emojis)).toBe(COMMENT_MAX_LENGTH + 1);
    expect(getCommentLength(truncateCommentContent(emojis))).toBe(COMMENT_MAX_LENGTH);
  });
});
