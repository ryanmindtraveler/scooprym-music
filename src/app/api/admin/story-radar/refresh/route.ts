import { refreshEditorialRadar } from '@/lib/editorial-workflow';
import { getSession } from '@/lib/server';
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
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Story radar refresh failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Story radar refresh failed',
      },
      { status: 502 }
    );
  }
}
