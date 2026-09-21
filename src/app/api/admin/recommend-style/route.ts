import { recommendSourceStyle } from '@/ai/text/lib/source-analysis';
import { getSession } from '@/lib/auth/server';
import { getRateLimiter } from '@/lib/infrastructure/ratelimit';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const maxDuration = 300;
const inputSchema = z
  .object({
    newsLink: z.string().trim().max(2048).default(''),
    newsContent: z.string().trim().max(30000).default(''),
  })
  .refine((value) => Boolean(value.newsLink || value.newsContent));

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { success } = await getRateLimiter().limit(`recommend-style:${session.user.id}`);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Invalid source input' }, { status: 400 });
  try {
    return NextResponse.json(await recommendSourceStyle(input.data.newsLink, input.data.newsContent));
  } catch {
    return NextResponse.json(
      { error: 'Could not recommend a style. Check the source and try again.' },
      { status: 502 }
    );
  }
}
