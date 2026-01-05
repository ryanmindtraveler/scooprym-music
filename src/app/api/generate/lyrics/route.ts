import { type TextProvider, generateLyrics } from '@/ai/text/lib/generation';
import { NextResponse } from 'next/server';
import { mapGenerationError } from '@/lib/music/error-handler';

/**
 * POST 请求处理函数：根据新闻链接或用户描述生成歌词
 */
export async function POST(req: Request) {
  try {
    const {
      newsUrl,
      prompt,
      modelProvider,
    }: {
      newsUrl?: string;
      prompt?: string;
      modelProvider?: TextProvider;
    } = await req.json();

    if (!newsUrl && !prompt) {
      const unifiedError = mapGenerationError({ success: false, error: 'Missing newsUrl or prompt', statusCode: 400 });
      return NextResponse.json(unifiedError, { status: 400 });
    }

    // 0. Rate Limiting
    const { getRateLimiter } = await import("@/lib/ratelimit");
    // Lyrics validation doesn't always have session on strict server-side context if called by non-authed?
    // Assuming auth optional for lyrics demo, or enforce?
    // Based on previous logic, auth wasn't strictly checked here, so we limit by IP.

    // Attempt to get session if possible, or fallback to IP
    const { getSession } = await import('@/lib/server');
    const session = await getSession();
    const identifier = session?.user?.id || (req.headers.get("x-forwarded-for") ?? "127.0.0.1");

    const { success } = await getRateLimiter().limit(identifier);
    if (!success) {
        return NextResponse.json(
            { success: false, error: "Too many requests. Please try again in a minute.", code: 429 },
            { status: 429 }
        );
    }

    // 调用核心生成逻辑
    const lyricsData = await generateLyrics({
      newsUrl,
      prompt,
      provider: modelProvider,
    });

    if (!lyricsData) {
      const unifiedError = mapGenerationError({ success: false, error: 'Failed to generate lyrics (empty response)', statusCode: 500 });
      return NextResponse.json(unifiedError, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...lyricsData,
    });
  } catch (error: any) {
    console.error('lyrics-generation error:', error);
    const unifiedError = mapGenerationError(error);
    const httpStatus = unifiedError.code && unifiedError.code >= 200 && unifiedError.code <= 599
      ? unifiedError.code
      : 500;

    return NextResponse.json(unifiedError, { status: httpStatus });
  }
}
