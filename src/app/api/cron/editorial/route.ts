import { runDailyEditorialWorkflow } from '@/lib/editorial-workflow';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runDailyEditorialWorkflow();
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/story-radar');
    revalidatePath('/admin/songs');
    return NextResponse.json({ success: true, result, executedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Editorial cron failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Editorial workflow failed' },
      { status: 500 }
    );
  }
}
