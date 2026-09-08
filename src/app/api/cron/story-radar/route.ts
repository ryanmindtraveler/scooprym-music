import { RadarScanInProgressError, scanAndStoreRadar } from '@/lib/story-radar/scan';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** 高频采集只补充新闻库存，不生成音乐，也不改变人工精选和日报出刊时间。 */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await scanAndStoreRadar();
    return NextResponse.json(result, { status: result.status === 'failed' ? 502 : 200 });
  } catch (error) {
    if (error instanceof RadarScanInProgressError)
      return NextResponse.json({ skipped: true, reason: 'scan_in_progress' });
    console.error('[story-radar] Scheduled scan failed', error);
    return NextResponse.json({ error: 'News collection failed' }, { status: 500 });
  }
}
