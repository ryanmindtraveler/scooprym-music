import { dataUrlToImageBuffer, generateCoverWithRetry } from '@/ai/image/lib/cover-generation';
import { getDb } from '@/db/index';
import { song as songTable } from '@/db/schema';
import { getSession } from '@/lib/server';
import { uploadFile } from '@/storage';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/generate/cover/retry
 * Allows users to manually regenerate a failed cover image.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input Validation
    const body = await req.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json({ success: false, error: 'Song ID is required' }, { status: 400 });
    }

    const db = await getDb();

    // 3. Verify Ownership & Get Song Data
    const [song] = await db
      .select()
      .from(songTable)
      .where(and(eq(songTable.id, songId), eq(songTable.userId, userId)))
      .limit(1);

    if (!song) {
      return NextResponse.json({ success: false, error: 'Song not found or unauthorized' }, { status: 404 });
    }

    // 4. Generate New Cover
    // Use "prompt" (music style/vibe) or "sourceText" (story content) -> "sourceText" argument
    // The generateCover logic uses `sourceText` as the main context description.
    const coverImageUrl = await generateCoverWithRetry({
      title: song.title || 'Untitled Track',
      lyrics: song.lyrics || '',
      sourceText: song.prompt && song.prompt.length > 5 ? song.prompt : song.sourceText || '',
    });

    if (!coverImageUrl) {
      return NextResponse.json({ success: false, error: 'Failed to generate cover image' }, { status: 500 });
    }

    // 5. Upload to Storage
    const { buffer, mime, extension } = await dataUrlToImageBuffer(coverImageUrl);
    const uploadResult = await uploadFile(
      buffer,
      `song-cover-retry-${Date.now()}.${extension}`,
      mime,
      `song-covers/${userId}`
    );

    // 6. Update Database
    await db
      .update(songTable)
      .set({
        coverImageUrl: uploadResult.url,
        coverImageKey: uploadResult.key,
        updatedAt: new Date(),
      })
      .where(eq(songTable.id, songId));

    return NextResponse.json({
      success: true,
      coverImageUrl: uploadResult.url,
    });
  } catch (error: any) {
    console.error('[Cover Retry] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
