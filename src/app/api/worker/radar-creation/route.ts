import { summarizeProviderError } from '@/ai/text/lib/provider-fallback';
import { isTerminalRadarCreationError } from '@/lib/creation/radar-creation-errors';
import { processRadarCreation } from '@/lib/creation/radar-creation-job';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const maxDuration = 300;
export const POST = verifySignatureAppRouter(async (request: Request) => {
  const payload = z.object({ candidateId: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!payload.success)
    return NextResponse.json(
      { error: 'Invalid job' },
      { status: 489, headers: { 'Upstash-NonRetryable-Error': 'true' } }
    );
  try {
    await processRadarCreation(payload.data.candidateId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[radar-creation] worker failed', summarizeProviderError(error));
    if (isTerminalRadarCreationError(error)) {
      return NextResponse.json(
        { error: 'This job needs corrected input or permissions before it can continue.' },
        { status: 489, headers: { 'Upstash-NonRetryable-Error': 'true' } }
      );
    }
    return NextResponse.json({ error: 'Job did not complete. Saved checkpoints will be reused.' }, { status: 503 });
  }
});
