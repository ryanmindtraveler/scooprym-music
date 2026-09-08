import { getSession } from '@/lib/auth/server';
import { screenRadar, screeningRequestSchema } from '@/lib/story-radar/screening';
import { NextResponse } from 'next/server';

export const maxDuration = 300;
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const parsed = screeningRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ success: false, error: 'Invalid screening request' }, { status: 400 });
  try {
    const result = await screenRadar(parsed.data);
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    console.error('[story-radar] AI screening failed', error);
    return NextResponse.json(
      { success: false, error: 'Screening could not finish. Refresh to inspect saved results.' },
      { status: 500 }
    );
  }
}
