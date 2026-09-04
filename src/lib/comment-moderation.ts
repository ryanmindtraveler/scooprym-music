export const COMMENT_MAX_LENGTH = 280;

export type CommentModerationCode = 'EMPTY' | 'TOO_LONG' | 'LINK_NOT_ALLOWED' | 'ADVERTISING_NOT_ALLOWED';

export interface CommentModerationResult {
  valid: boolean;
  code?: CommentModerationCode;
  message?: string;
  content: string;
}

const URL_PATTERN = /(?:https?:\/\/|ftp:\/\/|www\.)\S+/iu;
const EMAIL_PATTERN = /\b[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}\b/iu;
const DOMAIN_PATTERN =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|co|ai|app|me|gg|tv|xyz|link|shop|store|biz|info|cc|ly|ru|cn|de|uk|us)(?:\b|\/)/iu;
const OBFUSCATED_LINK_PATTERN =
  /(?:\b(?:https?|www)\s*(?:\[?dot\]?|[.:／])\s*[a-z0-9]|\b[a-z0-9][a-z0-9-]{1,62}\s*(?:\[?dot\]?|点)\s*(?:com|net|org|io|co|ai|app|me|gg|tv|xyz|link|shop|store|biz|info|cc|ly|ru|cn|de|uk|us)\b)/iu;
const ADVERTISING_PATTERN =
  /(?:\b(?:dm|message|contact|follow|add)\s+me\b|\blink\s+in\s+(?:my\s+)?bio\b|\b(?:buy\s+now|promo\s+code|discount\s+code|coupon\s+code|limited\s+offer|earn\s+money|free\s+money)\b|\b(?:wechat|whatsapp|telegram)\s*[:：@]\s*[a-z0-9_]+|加我|私信我|联系我|推广|返利|代理|兼职赚钱|扫码|二维码|客服微信|微信客服|电报群)/iu;

function normalizeCommentContent(content: string) {
  return content
    .normalize('NFKC')
    .replace(/(?:\u200B|\u2060|\uFEFF)/gu, '')
    .trim();
}

export function getCommentLength(content: string) {
  return Array.from(content).length;
}

export function truncateCommentContent(content: string) {
  return Array.from(content).slice(0, COMMENT_MAX_LENGTH).join('');
}

export function validateCommentContent(input: string): CommentModerationResult {
  const content = normalizeCommentContent(input);

  if (!content) {
    return { valid: false, code: 'EMPTY', message: 'Write something before posting', content };
  }

  if (getCommentLength(content) > COMMENT_MAX_LENGTH) {
    return {
      valid: false,
      code: 'TOO_LONG',
      message: `Keep comments under ${COMMENT_MAX_LENGTH} characters`,
      content,
    };
  }

  if (
    URL_PATTERN.test(content) ||
    EMAIL_PATTERN.test(content) ||
    DOMAIN_PATTERN.test(content) ||
    OBFUSCATED_LINK_PATTERN.test(content)
  ) {
    return {
      valid: false,
      code: 'LINK_NOT_ALLOWED',
      message: 'Links and contact details are not allowed in comments',
      content,
    };
  }

  if (ADVERTISING_PATTERN.test(content)) {
    return {
      valid: false,
      code: 'ADVERTISING_NOT_ALLOWED',
      message: 'Advertising and self-promotion are not allowed',
      content,
    };
  }

  return { valid: true, content };
}
