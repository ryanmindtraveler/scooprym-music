/**
 * @file url-extractor-service.ts
 * @description specialized content extraction strategies for different platforms.
 * Implementation of Strategy C: Local libraries + Specialized Scrapers.
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';

// --- Types ---

export type UrlType = 'youtube' | 'twitter' | 'tiktok' | 'instagram' | 'generic';

export interface ExtractedContent {
  success: boolean;
  urlType: UrlType;
  title?: string;
  description?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  error?: string;
}

const MAX_EXTRACTED_CONTENT_LENGTH = 12_000;
const MIN_EXTRACTED_CONTENT_LENGTH = 80;
const MAX_READER_RESPONSE_BYTES = 1_500_000;
const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain', 'ip6-localhost', 'ip6-loopback']);

export class UnsafeSourceUrlError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'UnsafeSourceUrlError';
  }
}

function isBlockedIpv4(address: string) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return true;
  }

  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isBenchmarkIpv4(address: string) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  return octets[0] === 198 && (octets[1] === 18 || octets[1] === 19);
}

/**
 * Clash 等本地代理的 Fake-IP 模式会在开发环境把公开域名解析到 RFC 2544
 * 基准测试网段 198.18.0.0/15。这里只兼容“全部结果均为该网段”的域名解析；
 * 生产环境、IP 字面量、混合公网/私网结果及其他私网地址仍一律拒绝。
 */
export function isDevelopmentFakeIpResolution(
  addresses: Array<{ address: string; family: number }>,
  environment = process.env.NODE_ENV
) {
  return (
    environment !== 'production' &&
    addresses.length > 0 &&
    addresses.every(({ address, family }) => family === 4 && isBenchmarkIpv4(address))
  );
}

/**
 * 判定地址是否属于本机、私网、链路本地或保留地址。
 * 对 IPv6 采用“只允许当前全球单播 2000::/3”的保守策略，并额外排除文档及转换网段。
 */
export function isBlockedIpAddress(rawAddress: string) {
  const address = rawAddress
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .split('%')[0];
  const family = isIP(address);

  if (family === 4) {
    return isBlockedIpv4(address);
  }

  if (family !== 6) {
    return true;
  }

  const mappedIpv4 = address.match(/(?:^|:)ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (mappedIpv4) {
    return isBlockedIpv4(mappedIpv4);
  }

  return (
    address === '::' ||
    address === '::1' ||
    !/^[23]/.test(address) ||
    address.startsWith('2001:db8:') ||
    address.startsWith('2001:0:') ||
    address.startsWith('2002:')
  );
}

function parseHttpSourceUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeSourceUrlError('Source URL is invalid');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UnsafeSourceUrlError('Source URL must use HTTP or HTTPS');
  }

  if (parsed.username || parsed.password) {
    throw new UnsafeSourceUrlError('Source URL must not contain credentials');
  }

  const hostname = parsed.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new UnsafeSourceUrlError('Local or private source URLs are not allowed');
  }

  if (isIP(hostname) && isBlockedIpAddress(hostname)) {
    throw new UnsafeSourceUrlError('Local, private, or reserved source addresses are not allowed');
  }

  parsed.hash = '';
  return parsed;
}

async function validateResolvedHttpUrl(rawUrl: string, allowDevelopmentFakeIp: boolean) {
  const parsed = parseHttpSourceUrl(rawUrl);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');

  if (!isIP(hostname)) {
    let addresses: Array<{ address: string; family: number }>;
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new UnsafeSourceUrlError('Source hostname could not be resolved');
    }

    const containsBlockedAddress = addresses.some(({ address }) => isBlockedIpAddress(address));
    const isLocalProxyFakeIp =
      allowDevelopmentFakeIp && containsBlockedAddress && isDevelopmentFakeIpResolution(addresses);

    if (addresses.length === 0 || (containsBlockedAddress && !isLocalProxyFakeIp)) {
      throw new UnsafeSourceUrlError('Source hostname resolves to a local, private, or reserved address');
    }

    if (isLocalProxyFakeIp) {
      console.warn(`[extractor] Allowing development proxy Fake-IP resolution for public hostname: ${hostname}`);
    }
  }

  return parsed.toString();
}

/**
 * 校验应用服务器将要直接访问的 URL。全部 DNS 结果都必须是公开地址，
 * 任何开发代理 Fake-IP、私网、回环或保留地址都会被拒绝。
 */
export async function assertPublicHttpUrl(rawUrl: string) {
  return validateResolvedHttpUrl(rawUrl, false);
}

/**
 * 校验交给 Jina/Firecrawl 等外部阅读器处理的来源 URL。
 * 仅该边界在非生产环境兼容本地代理 Fake-IP；后续本机直连回退仍会再次
 * 调用 assertPublicHttpUrl，因此不会把这个兼容规则扩散到服务器网络。
 */
export async function assertReaderSafeHttpUrl(rawUrl: string) {
  return validateResolvedHttpUrl(rawUrl, true);
}

function normalizeExtractedText(content: string) {
  return content
    .replace(/\0/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_EXTRACTED_CONTENT_LENGTH);
}

function hasUsableContent(content?: string) {
  if (!content) return false;
  const normalized = normalizeExtractedText(content);
  return (
    normalized.length >= MIN_EXTRACTED_CONTENT_LENGTH &&
    !/^\(?no text content found/i.test(normalized) &&
    !/^\(?transcript unavailable/i.test(normalized)
  );
}

// --- Platform Detectors ---

export function detectUrlType(url: string): UrlType {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'generic';
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const isHost = (domain: string) => hostname === domain || hostname.endsWith(`.${domain}`);

  if (isHost('youtube.com') || hostname === 'youtu.be') {
    return 'youtube';
  }
  if ((isHost('twitter.com') || isHost('x.com')) && /\/[^/]+\/status\//i.test(parsed.pathname)) {
    return 'twitter';
  }
  if (isHost('tiktok.com')) {
    return 'tiktok';
  }
  if ((isHost('instagram.com') || hostname === 'instagr.am') && /^\/(?:p|reels?|reel)\//i.test(parsed.pathname)) {
    return 'instagram';
  }
  return 'generic';
}

// --- Extractors ---

/**
 * 1. YouTube Extractor
 * Uses youtube-transcript to get the actual spoken content (subtitles).
 */
async function extractYoutube(rawUrl: string): Promise<ExtractedContent> {
  let url = rawUrl;
  let title = 'YouTube Video';
  let author = '';

  try {
    // 0. Normalize URL (Convert Shorts to Watch)
    // youtube-transcript library fails on /shorts/ paths.
    if (url.includes('/shorts/')) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const videoId = pathParts[pathParts.length - 1];
        if (videoId) {
          const newUrl = `https://www.youtube.com/watch?v=${videoId}`;
          console.log(`[extractor] Normalized Shorts URL: ${url} -> ${newUrl}`);
          url = newUrl;
        }
      } catch (e) {
        console.warn('[extractor] Failed to normalize shorts URL:', e);
        url = url.replace('shorts/', 'watch?v=');
      }
    }

    // 1. Get Metadata (Title/Desc) via oEmbed (Official & Free)
    // YouTube's oEmbed endpoint is public and allows CORS
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    try {
      const { data } = await axios.get(oembedUrl, {
        timeout: 3000,
        maxRedirects: 0,
        maxContentLength: 256_000,
      });
      title = data.title || title;
      author = data.author_name || author;
    } catch (e) {
      console.warn('[extractor] Failed to fetch YouTube oEmbed metadata, continuing with just transcript.');
    }

    // 2. Get Transcript
    // logic: fetch transcript -> join texts -> limit length
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(url, {
        lang: 'en', // Default to English, but it often auto-detects
      });

      if (!transcriptItems || transcriptItems.length === 0) {
        throw new Error('No transcript available');
      }

      const fullText = transcriptItems.map((item) => item.text).join(' ');

      return {
        success: true,
        urlType: 'youtube',
        title,
        author,
        description: 'Transcript extracted from video.',
        content: fullText,
      };
    } catch (transcriptError: any) {
      // Transcript failed or not available (common for music videos or short clips)
      console.warn(`[extractor] YouTube transcript failed for ${url}: ${transcriptError.message}`);

      // FALLBACK 1: Try Generic Extractor (Jina) to get page content/description
      // This is crucial for Shorts where transcripts are often missing but we need the title/context
      try {
        // Jina works better with standard watch URLs than shorts/ URLs
        // Robust conversion using URL object to handle query params safely
        let fallbackUrl = url;
        try {
          const urlObj = new URL(url);
          if (urlObj.pathname.includes('/shorts/')) {
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const videoId = pathParts[pathParts.length - 1];
            if (videoId) fallbackUrl = `https://www.youtube.com/watch?v=${videoId}`;
          }
        } catch (e) {
          fallbackUrl = url.replace('shorts/', 'watch?v=');
        }
        console.log(`[extractor] specific transcript failed, trying generic fallback for ${fallbackUrl}`);

        const fallbackResult = await extractGeneric(fallbackUrl, 'youtube');
        if (fallbackResult.success && fallbackResult.content && fallbackResult.content.length > 50) {
          console.log(`[extractor] Fallback generic extraction successful for ${url}`);

          // CLEANUP: Jina returns the WHOLE page (sidebar, comments, next videos).
          // We must strip this noise to prevent hallucinations (e.g. "Rat at Popeyes" from recommended feed).
          let cleanContent = fallbackResult.content;

          // 1. Remove "Transcript" section and everything after
          const transcriptIndex = cleanContent.indexOf('\nTranscript\n');
          if (transcriptIndex !== -1) cleanContent = cleanContent.substring(0, transcriptIndex);

          // 2. Remove "Comments" section
          const commentsIndex = cleanContent.indexOf('\nComments\n');
          if (commentsIndex !== -1) cleanContent = cleanContent.substring(0, commentsIndex);

          // 3. Remove "Sign in" noise
          const signInIndex = cleanContent.indexOf('Sign in to confirm');
          if (signInIndex !== -1) cleanContent = cleanContent.substring(0, signInIndex);

          // 5. Intelligent Description Extraction
          // Jina's YouTube MD often has stats line: "1,069 views • Jan 12, 2026 • #Hashtags"
          // Followed by the Description.
          // Followed by "Show less" or "Transcript".
          let description = '';
          const statsLineRegex = /(\d+ views|views •)/i;
          const lines = cleanContent.split('\n');
          let foundStats = false;
          const capturedDescriptionLines: string[] = [];

          for (const line of lines) {
            if (!foundStats) {
              if (statsLineRegex.test(line)) {
                foundStats = true;
              }
            } else {
              // Stop capturing if we hit typical UI buttons
              if (
                line.includes('Show less') ||
                line.includes('Transcript') ||
                line.includes('Altered or synthetic content')
              ) {
                break;
              }
              if (line.trim().length > 0) {
                capturedDescriptionLines.push(line.trim());
              }
            }
          }

          if (capturedDescriptionLines.length > 0) {
            const extractedDesc = capturedDescriptionLines.join('\n');
            // Use this as the main content if it's better than the raw blob
            if (extractedDesc.length > 20) {
              cleanContent = extractedDesc;
              description = extractedDesc;
            }
          } else {
            // Fallback: If we couldn't parse description, just use the cleaned content but truncated
            // to avoid sidebar noise.
            if (cleanContent.length > 1000) {
              console.log('[extractor] Intelligent parsing failed, truncating content to safely limit noise.');
              cleanContent = cleanContent.substring(0, 1000) + '... [truncated for relevance]';
            }
          }

          // PRIORITIZE oEmbed Title
          // Jina often returns "Extracted Web Content" or "YouTube" if it hits a wall.
          // We already fetched the official title via oEmbed at the start.
          let finalTitle = fallbackResult.title;
          if (
            (!finalTitle ||
              finalTitle === 'Extracted Web Content' ||
              finalTitle === 'YouTube' ||
              finalTitle === 'Before you continue') &&
            title &&
            title !== 'YouTube Video'
          ) {
            console.log(`[extractor] Overwriting generic Jina title with oEmbed title: "${title}"`);
            finalTitle = title;
          }

          return {
            ...fallbackResult,
            urlType: 'youtube',
            title: finalTitle,
            description: description || fallbackResult.description,
            content: cleanContent,
          };
        }
      } catch (fallbackErr) {
        console.warn('[extractor] Fallback failed:', fallbackErr);
      }

      throw transcriptError;
    }
  } catch (error: any) {
    console.error('[extractor] YouTube extraction failed:', error);
    return {
      success: false,
      urlType: 'youtube',
      error: error?.message || 'Failed to extract transcript from YouTube video.',
    };
  }
}

async function fetchPublicHtml(rawUrl: string) {
  let currentUrl = rawUrl;

  for (let redirectCount = 0; redirectCount <= 3; redirectCount++) {
    currentUrl = await assertPublicHttpUrl(currentUrl);
    const response = await axios.get(currentUrl, {
      timeout: 15_000,
      maxRedirects: 0,
      maxContentLength: MAX_READER_RESPONSE_BYTES,
      maxBodyLength: MAX_READER_RESPONSE_BYTES,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location) {
        throw new Error('Source redirected without a destination');
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    if (contentType && !contentType.includes('text/') && !contentType.includes('html')) {
      throw new Error('Source did not return readable text or HTML');
    }

    return response.data as string;
  }

  throw new Error('Source redirected too many times');
}

export interface PublicPageMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
}

function cleanMetadataValue(value: string | undefined, maxLength: number) {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

/**
 * 从已通过 SSRF 校验的公开页面提取编辑部需要的轻量元数据。
 * 图片地址只保存，不由服务器继续请求。
 */
export async function extractPublicPageMetadata(rawUrl: string): Promise<PublicPageMetadata> {
  const normalizedUrl = await assertPublicHttpUrl(rawUrl);
  const html = await fetchPublicHtml(normalizedUrl);
  const $ = cheerio.load(html);
  const title = cleanMetadataValue(
    $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text(),
    300
  );
  const description = cleanMetadataValue(
    $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content'),
    1000
  );
  const rawImage = cleanMetadataValue(
    $('meta[property="og:image:secure_url"]').attr('content') ||
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content'),
    2048
  );
  let imageUrl: string | null = null;
  if (rawImage) {
    try {
      const resolved = new URL(rawImage, normalizedUrl);
      if (
        (resolved.protocol === 'http:' || resolved.protocol === 'https:') &&
        !resolved.username &&
        !resolved.password
      ) {
        imageUrl = resolved.toString();
      }
    } catch {
      imageUrl = null;
    }
  }

  const rawPublishedAt =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('time[datetime]').first().attr('datetime');
  const parsedPublishedAt = rawPublishedAt ? new Date(rawPublishedAt) : null;

  return {
    title,
    description,
    imageUrl,
    publishedAt: parsedPublishedAt && !Number.isNaN(parsedPublishedAt.getTime()) ? parsedPublishedAt : null,
  };
}

/**
 * 2. Generic Extractor Strategy Chain
 * Strategy A: Jina Reader (Best for readability & bypassing anti-bot)
 * Strategy B: Firecrawl (Best for JS-heavy sites, necessitates API Key)
 * Strategy C: Axios + Cheerio (Basic HTML, fallback)
 */
async function extractGeneric(url: string, type: UrlType = 'generic'): Promise<ExtractedContent> {
  // Strategy A: Jina Reader Service (Free tier is generous and very effective)
  // Usage: GET https://r.jina.ai/<url>
  try {
    console.log(`[extractor] Strategy A (Jina) starting for: ${url}`);
    const jinaUrl = `https://r.jina.ai/${url}`;

    const { data: jinaMarkdown } = await axios.get(jinaUrl, {
      timeout: 25_000,
      maxRedirects: 0,
      maxContentLength: MAX_READER_RESPONSE_BYTES,
      maxBodyLength: MAX_READER_RESPONSE_BYTES,
      headers: {
        'X-With-Images-Summary': 'true',
        'X-Return-Format': 'markdown',
      },
    });

    if (jinaMarkdown && typeof jinaMarkdown === 'string' && jinaMarkdown.length > 50) {
      // Jina returns raw markdown. We parse the title/metadata from the first lines if possible,
      // but typically it just gives clean text.

      // Simple heuristic to extract a title from the first Markdown header
      const titleMatch = jinaMarkdown.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'Extracted Web Content';

      // Remove the title from the body to avoid duplication if we found it
      const cleanContent = titleMatch ? jinaMarkdown.replace(titleMatch[0], '').trim() : jinaMarkdown;

      return {
        success: true,
        urlType: type,
        title: title,
        description: 'Content extracted via Jina Reader',
        content: cleanContent,
        author: 'Jina Reader',
      };
    }
  } catch (jinaError: any) {
    console.warn(`[extractor] Strategy A (Jina) failed: ${jinaError.message}. Falling back...`);
  }

  // Strategy B: Firecrawl (Excellent for JS-heavy sites)
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      console.log(`[extractor] Strategy B (Firecrawl) starting for: ${url}`);
      // Firecrawl scrape endpoint
      const firecrawlUrl = 'https://api.firecrawl.dev/v0/scrape';

      const { data: firecrawlData } = await axios.post(
        firecrawlUrl,
        {
          url: url,
          pageOptions: {
            onlyMainContent: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
          maxRedirects: 0,
          maxContentLength: MAX_READER_RESPONSE_BYTES,
          maxBodyLength: MAX_READER_RESPONSE_BYTES,
        }
      );

      if (firecrawlData?.success && firecrawlData?.data) {
        return {
          success: true,
          urlType: type,
          title: firecrawlData.data.metadata?.title || 'Firecrawl Extracted',
          description: firecrawlData.data.metadata?.description || 'Content extracted via Firecrawl',
          content: firecrawlData.data.markdown || firecrawlData.data.content,
          author: firecrawlData.data.metadata?.author || 'Firecrawl',
        };
      }
    } catch (firecrawlError: any) {
      console.warn(`[extractor] Strategy B (Firecrawl) failed: ${firecrawlError.message}. Falling back...`);
    }
  }

  // Strategy C: Basic Axios + Cheerio (Fallback)
  try {
    console.log(`[extractor] Strategy C (Cheerio) starting for: ${url}`);
    const data = await fetchPublicHtml(url);

    const $ = cheerio.load(data);

    // Extract Open Graph / Twitter Card Metadata
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      '';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    const siteName = $('meta[property="og:site_name"]').attr('content');

    // For Generic sites, try to get main paragraph text
    let bodyText = '';
    if (type === 'generic') {
      // Remove scripts, styles, navs, iframes, svgs to clean up
      $('script, style, nav, header, footer, noscript, iframe, svg').remove();

      // Get paragraphs ensuring spaces between them
      $('p, h1, h2, h3, h4, h5, h6, li, article').each((_, el) => {
        const text = $(el).text().trim();
        // Filter out very short lines which are often navigation/UI noise
        if (text.length > 20) {
          bodyText += text + '\n\n';
        }
      });
    } else {
      // For Twitter/X, we usually can't get body text via generic fetch due to React rendering
      // We rely solely on the Title/Description from metadata for the free tier
      bodyText = `[Note: Full content could not be fetched for ${type}. Using metadata summary.]\n${description}`;
    }

    // Fallback logic: if no body text was found, use description or title
    const finalContent = bodyText.trim() || description || `(No text content found. Page title: ${title})`;

    return {
      success: true,
      urlType: type,
      title,
      content: finalContent,
      description,
      author: siteName,
    };
  } catch (error: any) {
    console.error(`[extractor] ${type} extraction failed:`, error.message);
    return {
      success: false,
      urlType: type,
      error: error?.message || `Failed to fetch content from ${url}`,
    };
  }
}

// --- Main Facade ---

export async function extractUrlContent(url: string): Promise<ExtractedContent> {
  let normalizedUrl: string;
  try {
    normalizedUrl = await assertReaderSafeHttpUrl(url);
  } catch (error) {
    return {
      success: false,
      urlType: 'generic',
      error: error instanceof Error ? error.message : 'Source URL is not allowed',
    };
  }

  const type = detectUrlType(normalizedUrl);
  console.log(`[extractor] Service detected type: ${type} for URL: ${normalizedUrl}`);

  let result: ExtractedContent;

  switch (type) {
    case 'youtube':
      result = await extractYoutube(normalizedUrl);
      break;
    case 'twitter':
    case 'tiktok':
    case 'instagram':
      // For free tier, we treat these as generic Jina fallbacks
      // because actual parsing requires paid API or heavy puppeteer
      result = await extractGeneric(normalizedUrl, type);
      break;
    default:
      result = await extractGeneric(normalizedUrl, 'generic');
      break;
  }

  if (!result.success || !hasUsableContent(result.content)) {
    return {
      success: false,
      urlType: type,
      error: result.error || 'The source page did not contain enough readable content',
    };
  }

  return {
    ...result,
    content: normalizeExtractedText(result.content || ''),
  };
}

/**
 * Format helper for the AI Prompt
 */
export function formatExtractedContentForAI(extracted: ExtractedContent, originalUrl: string): string {
  if (!extracted.success) {
    throw new Error(extracted.error || `Could not extract content from ${originalUrl}`);
  }

  const lines = [
    `=== Source: ${extracted.urlType.toUpperCase()} ===`,
    `URL: ${originalUrl}`,
    `Title: ${extracted.title || 'N/A'}`,
  ];

  if (extracted.author) lines.push(`Author: ${extracted.author}`);
  if (extracted.description) lines.push(`Summary: ${extracted.description}`);

  if (extracted.content) {
    const safeContent = normalizeExtractedText(extracted.content);

    lines.push(`\n--- Extracted Content ---\n${safeContent}`);
  }

  return lines.join('\n');
}

export function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
