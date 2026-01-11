import { rewriteLyrics } from '@/ai/text/lib/generation';
import type { TextProvider } from '@/ai/text/lib/provider-config';
import { NextResponse } from 'next/server';

/**
 * POST请求处理函数：重写选定的歌词片段
 */
export async function POST(req: Request) {
  try {
    const {
      selectedText,
      context,
      style,
      modelProvider,
    }: {
      selectedText: string;
      context?: string;
      style?: string;
      modelProvider?: TextProvider;
    } = await req.json();

    if (!selectedText) {
      return NextResponse.json({ success: false, error: 'No text selected for rewriting' }, { status: 400 });
    }

    const rewrittenText = await rewriteLyrics({
      selectedText,
      context,
      style,
      provider: modelProvider,
    });

    return NextResponse.json({
      success: true,
      rewrittenText,
    });
  } catch (error: any) {
    console.error('rewrite-lyrics error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to rewrite lyrics' }, { status: 500 });
  }
}
