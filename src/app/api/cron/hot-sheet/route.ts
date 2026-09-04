import { archiveDailyHotSheet } from '@/lib/hot-sheet-archive';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await archiveDailyHotSheet());
  } catch (error) {
    console.error('[hot-sheet] Daily archive failed', error);
    return NextResponse.json({ error: 'Daily collection failed' }, { status: 500 });
  }
}
