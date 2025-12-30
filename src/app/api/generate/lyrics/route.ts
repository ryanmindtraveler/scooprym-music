import { type TextProvider, generateLyrics } from '@/ai/text/lib/generation';
import { NextResponse } from 'next/server';

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
      return NextResponse.json(
        { success: false, error: 'Missing newsUrl or prompt' },
        { status: 400 }
      );
    }

    // 调用核心生成逻辑
    const lyrics = await generateLyrics({
      newsUrl,
      prompt,
      provider: modelProvider,
    });

    if (!lyrics) {
      return NextResponse.json(
          { success: false, error: 'Failed to generate lyrics (empty response)' },
          { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lyrics,
    });
  } catch (error: any) {
    console.error('lyrics-generation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate lyrics' },
      { status: 500 }
    );
  }
}
