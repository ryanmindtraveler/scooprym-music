import 'server-only';

import { isIP } from 'node:net';
import { extractPublicPageMetadata, extractUrlContent, isBlockedIpAddress } from '@/ai/text/lib/url-content-extractor';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain', 'scooprym.app', 'www.scooprym.app']);
const TRACKING_PARAMETERS = new Set(['fbclid', 'gclid', 'dclid', 'msclkid', 'mc_cid', 'mc_eid']);

export class InvalidStorySubmissionUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStorySubmissionUrlError';
  }
}

/**
 * 将读者提交的链接规范化，用于数据库去重。
 * 此处只保存链接，不主动请求第三方站点；真正抓取内容时仍由内容提取器再次执行 DNS 安全校验。
 */
export function normalizeStorySubmissionUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new InvalidStorySubmissionUrlError('Enter a complete public story link.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new InvalidStorySubmissionUrlError('The story link must start with http:// or https://.');
  }
  if (parsed.username || parsed.password) {
    throw new InvalidStorySubmissionUrlError('Links containing sign-in credentials are not allowed.');
  }

  const hostname = parsed.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (
    !hostname ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.scooprym.app') ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    (isIP(hostname) !== 0 && isBlockedIpAddress(hostname))
  ) {
    throw new InvalidStorySubmissionUrlError('Use a public news or social-media link.');
  }

  parsed.hostname = hostname;
  parsed.hash = '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMETERS.has(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.searchParams.sort();
  if (parsed.pathname !== '/') parsed.pathname = parsed.pathname.replace(/\/+$/, '');

  const normalizedUrl = parsed.toString();
  if (normalizedUrl.length > 2048) {
    throw new InvalidStorySubmissionUrlError('This link is too long.');
  }

  return {
    normalizedUrl,
    sourceDomain: hostname.replace(/^www\./, ''),
  };
}

export function inferSubmissionCategory(note: string) {
  const normalized = note.toLowerCase();
  if (/celebrity|actor|actress|singer|rapper|star|hollywood|dating|divorce|feud|gossip/.test(normalized)) {
    return 'celebrity_drama' as const;
  }
  if (/bizarre|absurd|strange|wild|ridiculous|mistake|odd|unbelievable/.test(normalized)) {
    return 'absurd_headlines' as const;
  }
  return 'internet_chaos' as const;
}

export async function enrichStorySubmissionUrl(rawUrl: string) {
  const normalized = normalizeStorySubmissionUrl(rawUrl);
  try {
    const metadata = await extractPublicPageMetadata(normalized.normalizedUrl);
    return { ...normalized, ...metadata };
  } catch (metadataError) {
    const extracted = await extractUrlContent(normalized.normalizedUrl);
    if (!extracted.success) {
      throw metadataError instanceof Error ? metadataError : new Error('The public source could not be inspected.');
    }
    const publishedAt = extracted.publishedAt ? new Date(extracted.publishedAt) : null;
    return {
      ...normalized,
      title: extracted.title?.trim().slice(0, 300) || null,
      description: extracted.description?.trim().slice(0, 1000) || null,
      imageUrl: null,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    };
  }
}
