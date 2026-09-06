import { enqueueRadarCreation } from '@/lib/radar-creation-enqueue';
import { getSession } from '@/lib/server';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const job = await enqueueRadarCreation((await params).id, session.user.id);
    return NextResponse.json({ success: true, job }, { status: 202 });
  } catch (error) {
    console.error('[radar-creation] enqueue failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not enqueue the story. Check background queue configuration and try again.' },
      { status: 503 }
    );
  }
}
