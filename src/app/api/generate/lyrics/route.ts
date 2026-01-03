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
