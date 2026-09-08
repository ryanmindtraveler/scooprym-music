import { getDb } from '@/db';
import { generationAttempt, radarCreationJob, songCreationRun } from '@/db/schema';
import { getSession } from '@/lib/auth/server';
import { getRadarGeneratedSongs } from '@/lib/story-radar/generated-songs';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = z
    .array(z.string().uuid())
    .max(50)
    .safeParse(new URL(request.url).searchParams.get('ids')?.split(',').filter(Boolean) ?? []);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid candidate IDs' }, { status: 400 });
  if (!parsed.data.length) return NextResponse.json({ success: true, jobs: [], generatedSongs: [] });
  const db = await getDb();
  const jobs = await db
    .select({
      candidateId: radarCreationJob.candidateId,
      status: radarCreationJob.status,
      stage: songCreationRun.currentStage,
      workflowStatus: sql<
        string | null
      >`case when ${generationAttempt.processingStatus} like 'failed_%' or ${generationAttempt.processingStatus} = 'processing_queue_failed' then 'failed' else ${songCreationRun.status} end`,
      songId: songCreationRun.songId,
      error: sql<
        string | null
      >`coalesce(${generationAttempt.processingError}, ${songCreationRun.lastError}, ${radarCreationJob.error})`,
    })
    .from(radarCreationJob)
    .leftJoin(songCreationRun, eq(songCreationRun.id, radarCreationJob.runId))
    .leftJoin(
      generationAttempt,
      sql`${generationAttempt.id} = (select ga.id from scooprym.generation_attempt ga where ga.song_id = ${songCreationRun.songId} order by ga.created_at desc, ga.id desc limit 1)`
    )
    .where(inArray(radarCreationJob.candidateId, parsed.data))
    .orderBy(desc(radarCreationJob.createdAt))
    .limit(50);
  const generatedSongs = await getRadarGeneratedSongs(parsed.data);
  return NextResponse.json({ success: true, jobs, generatedSongs }, { headers: { 'Cache-Control': 'no-store' } });
}
