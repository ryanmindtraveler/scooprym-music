/**
 * @file url-extractor-service.ts
 * @description specialized content extraction strategies for different platforms.
 * Implementation of Strategy C: Local libraries + Specialized Scrapers.
 */

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

// --- Platform Detectors ---

export function detectUrlType(url: string): UrlType {
  // YouTube: Standard, Shorts, Embeds, Shortlinks
  if (/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)/i.test(url)) {
    return 'youtube';
  }
  // Twitter/X
  if (/(?:twitter\.com|x\.com)\/\w+\/status\//i.test(url)) {
    return 'twitter';
  }
  // TikTok: Web + Mobile Shortlinks (vt/vm)
  if (/(?:tiktok\.com\/|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(url)) {
    return 'tiktok';
  }
  // Instagram: Web + Shortlinks
  if (/(?:instagram\.com|instagr\.am)\/(?:p|reels?|reel)\//i.test(url)) {
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
      const { data } = await axios.get(oembedUrl, { timeout: 3000 });
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

      // FALLBACK 2: Return success with just metadata if we have at least a title
      // This ensures we don't fail completely just because there are no subtitles
      if (title && title !== 'YouTube Video') {
        console.log(`[extractor] Falling back to YouTube metadata for ${url}`);
        return {
          success: true,
          urlType: 'youtube',
          title,
          author,
          description: 'Note: Subtitles/Transcript not available for this video.',
          content: `(Transcript unavailable. Using video title: "${title}")`,
        };
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
      timeout: 25000, // Increased to 25s to handle complex pages
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
    // Fake a browser user agent to avoid basic blocks
    const { data } = await axios.get(url, {
      timeout: 15000, // Increased to 15s
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

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
  const type = detectUrlType(url);
  console.log(`[extractor] Service detected type: ${type} for URL: ${url}`);

  switch (type) {
    case 'youtube':
      return await extractYoutube(url);
    case 'twitter':
    case 'tiktok':
    case 'instagram':
      // For free tier, we treat these as generic Jina fallbacks
      // because actual parsing requires paid API or heavy puppeteer
      return await extractGeneric(url, type);
    default:
      return await extractGeneric(url, 'generic');
  }
}

/**
 * Format helper for the AI Prompt
 */
export function formatExtractedContentForAI(extracted: ExtractedContent, originalUrl: string): string {
  if (!extracted.success) {
    return `Source URL: ${originalUrl}\n\n[System Note: Could not extract content. Error: ${extracted.error}]`;
  }

  const lines = [
    `=== Source: ${extracted.urlType.toUpperCase()} ===`,
    `URL: ${originalUrl}`,
    `Title: ${extracted.title || 'N/A'}`,
  ];

  if (extracted.author) lines.push(`Author: ${extracted.author}`);
  if (extracted.description) lines.push(`Summary: ${extracted.description}`);

  if (extracted.content) {
    // Truncate for AI context limit (approx 3000 chars is usually safe for lyrics context)
    const safeContent =
      extracted.content.length > 3000 ? extracted.content.substring(0, 3000) + '... (truncated)' : extracted.content;

    lines.push(`\n--- Extracted Content ---\n${safeContent}`);
  }

  return lines.join('\n');
}

export function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
