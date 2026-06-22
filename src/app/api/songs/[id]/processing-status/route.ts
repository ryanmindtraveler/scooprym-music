import { getDb } from '@/db/index';
import { song as songTable } from '@/db/schema';
import { buildStoryBrief } from '@/features/full-songs/services/full-songs-helpers';
import { getSession } from '@/lib/server';
import { getSongSourceCompatFields, getSongSourceSummary } from '@/lib/song-source';
import { getSongStatusPresentation } from '@/lib/song-status';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const STALE_PROCESSING_TIMEOUT_MINUTES = 45;

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const [song] = await db
      .select({
        id: songTable.id,
        userId: songTable.userId,
        title: songTable.title,
        audioUrl: songTable.audioUrl,
        audioKey: songTable.audioKey,
        coverImageUrl: songTable.coverImageUrl,
        coverImageKey: songTable.coverImageKey,
        createdAt: songTable.createdAt,
        updatedAt: songTable.updatedAt,
        creditsDeducted: songTable.creditsDeducted,
        processingStatus: songTable.processingStatus,
        creditError: songTable.creditError,
        sourceSummary: songTable.newsSummary,
        newsSummary: songTable.newsSummary,
        sourceText: songTable.sourceText,
        sourceUrl: songTable.sourceUrl,
      })
      .from(songTable)
      .where(eq(songTable.id, params.id));

    if (!song) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    if (song.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const sourceSummary = getSongSourceSummary(song) || '';
    let { status, message, musicStatus, coverStatus } = getSongStatusPresentation({
      processingStatus: song.processingStatus,
      hasAudioKey: !!song.audioKey,
      hasCoverImageUrl: !!song.coverImageUrl,
    });

    const now = new Date();
    const created = new Date(song.createdAt);
    const lastProgressAt = song.updatedAt ? new Date(song.updatedAt) : created;
    const minutesSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60);
    const minutesSinceLastProgress = (now.getTime() - lastProgressAt.getTime()) / (1000 * 60);

    const shouldFailAsStale =
      minutesSinceLastProgress > STALE_PROCESSING_TIMEOUT_MINUTES &&
      status !== 'completed' &&
      status !== 'failed' &&
      (song.processingStatus === 'processing' || song.processingStatus === 'audio_uploaded');

    if (shouldFailAsStale) {
      console.log(
        `[processing-status] Detected stale task ${params.id} (${minutesSinceLastProgress.toFixed(1)} mins since last progress). Cleaning up...`
      );

      status = 'failed';
      message = 'Processing stalled and was marked as failed.';
      if (musicStatus === 'processing') musicStatus = 'failed';
      if (coverStatus === 'processing' || coverStatus === 'generating') coverStatus = 'failed';

      try {
        const dbForUpdate = await getDb();
        await dbForUpdate
          .update(songTable)
          .set({
            processingStatus: 'failed_generation',
            creditError: `Processing stalled (>${STALE_PROCESSING_TIMEOUT_MINUTES} mins since last progress)`,
          })
          .where(eq(songTable.id, params.id));
      } catch (cleanupErr) {
        console.error('[processing-status] Cleanup side-effect failed:', cleanupErr);
      }
    }

    return NextResponse.json({
      success: true,
      status,
      message,
      musicStatus,
      coverStatus,
      creditsDeducted: song.creditsDeducted || false,
      creditError: song.creditError || null,
      song: {
        id: song.id,
        title: song.title,
        audioUrl: song.audioUrl,
        coverImageUrl: song.coverImageUrl,
        createdAt: song.createdAt,
        updatedAt: song.updatedAt,
        ...getSongSourceCompatFields(song),
        storyBrief: buildStoryBrief(sourceSummary, ''),
      },
      details: {
        hasAudioKey: !!song.audioKey,
        hasCoverImageUrl: !!song.coverImageUrl,
        hasCoverImageKey: !!song.coverImageKey,
        processingStatus: song.processingStatus || 'processing',
        minutesSinceCreation: Math.round(minutesSinceCreation * 10) / 10,
        minutesSinceLastProgress: Math.round(minutesSinceLastProgress * 10) / 10,
      },
    });
  } catch (error: any) {
    console.error('Error fetching song processing status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch processing status',
      },
      { status: 500 }
    );
  }
}
