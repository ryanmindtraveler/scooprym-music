import { processRadarCreation } from '@/lib/creation/radar-creation-job';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const maxDuration = 300;
export const POST = verifySignatureAppRouter(async (request: Request) => {
  const payload = z.object({ candidateId: z.string().uuid() }).safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: 'Invalid job' }, { status: 400 });
  try {
    await processRadarCreation(payload.data.candidateId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[radar-creation] worker failed', error);
    return NextResponse.json({ error: 'Job did not complete. Saved checkpoints will be reused.' }, { status: 503 });
  }
});
