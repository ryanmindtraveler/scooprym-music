import { submitMusicGeneration } from '@/lib/submit-music-generation';
import { getSession } from '@/lib/server';
import { getRateLimiter } from '@/lib/ratelimit';
import { NextResponse } from 'next/server';

export const maxDuration = 300;
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const { success } = await getRateLimiter().limit(session.user.id);
  if (!success) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }
  return submitMusicGeneration(body, { id: session.user.id, role: session.user.role });
}
