import { getDb } from '@/db';
import { radarCreationJob, songCreationRun } from '@/db/schema';
import { getSession } from '@/lib/server';
import { getRadarGeneratedSongs } from '@/lib/story-radar/generated-songs';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = await getDb();
  const jobs = await db
    .select({
      candidateId: radarCreationJob.candidateId,
      status: radarCreationJob.status,
      stage: songCreationRun.currentStage,
      workflowStatus: songCreationRun.status,
      songId: songCreationRun.songId,
    })
    .from(radarCreationJob)
    .leftJoin(songCreationRun, eq(songCreationRun.id, radarCreationJob.runId))
    .orderBy(desc(radarCreationJob.createdAt))
    .limit(300);
  const generatedSongs = await getRadarGeneratedSongs();
  return NextResponse.json({ success: true, jobs, generatedSongs }, { headers: { 'Cache-Control': 'no-store' } });
}
