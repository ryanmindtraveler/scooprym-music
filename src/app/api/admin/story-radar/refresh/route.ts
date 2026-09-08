import { getSession } from '@/lib/auth/server';
import { refreshEditorialRadar } from '@/lib/stories/editorial-workflow';
import { RadarScanInProgressError } from '@/lib/story-radar/scan';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await refreshEditorialRadar();
    return NextResponse.json(
      {
        success: result.status !== 'failed',
        ...result,
        ...(result.status === 'failed'
          ? { error: 'All enabled news sources failed. See source health for details.' }
          : {}),
      },
      { status: result.status === 'failed' ? 502 : 200 }
    );
  } catch (error) {
    console.error('Story radar refresh failed:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof RadarScanInProgressError ? error.message : 'Story radar refresh failed. Check server logs.',
      },
      { status: error instanceof RadarScanInProgressError ? 409 : 502 }
    );
  }
}
