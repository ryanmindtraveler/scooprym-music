import { getDb } from '@/db/index';
import { song as songTable } from '@/db/schema';
import { getSession } from '@/lib/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * 获取歌曲后台处理状态
 *
 * 状态判断逻辑：
 * - audioKey 为空：音频文件尚未上传（处理中）
 * - coverImageUrl 为空：封面尚未生成（生成封面中）
 * - 两者都不为空：处理完成
 */
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
      })
      .from(songTable)
      .where(eq(songTable.id, params.id));

    if (!song) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    // 验证歌曲属于当前用户
    if (song.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 判断处理状态 - 基于新的processingStatus字段
    let status: 'processing' | 'generating_cover' | 'completed' | 'failed';
    let message: string;
    let musicStatus: 'processing' | 'uploaded' | 'failed';
    let coverStatus: 'processing' | 'generating' | 'completed' | 'failed' | 'skipped';

    // 根据processingStatus字段判断状态
    const processingStatus = song.processingStatus || 'processing';

    switch (processingStatus) {
      case 'processing':
        status = 'processing';
        message = '音频文件处理中...';
        musicStatus = 'processing';
        coverStatus = 'processing';
        break;
      case 'audio_uploaded':
        status = 'generating_cover';
        message = '音频上传完成，封面图片生成中...';
        musicStatus = 'uploaded';
        coverStatus = 'generating';
        break;
      case 'completed':
        status = 'completed';
        message = '处理完成';
        musicStatus = 'uploaded';
        coverStatus = 'completed';
        break;
      case 'completed_without_cover':
        status = 'completed';
        message = '处理完成（封面生成失败）';
        musicStatus = 'uploaded';
        coverStatus = 'failed';
        break;
      case 'failed_audio_upload':
        status = 'failed';
        message = '音频上传失败';
        musicStatus = 'failed';
        coverStatus = 'skipped';
        break;
      case 'failed_credit_deduction':
        status = 'failed';
        message = '音频处理完成，但扣费失败';
        musicStatus = 'uploaded';
        coverStatus = song.coverImageUrl ? 'completed' : 'failed';
        break;
      default:
        // 回退到旧的判断逻辑（向后兼容）
        if (!song.audioKey) {
          status = 'processing';
          message = '音频文件处理中...';
          musicStatus = 'processing';
          coverStatus = 'processing';
        } else if (!song.coverImageUrl) {
          status = 'generating_cover';
          message = '封面图片生成中...';
          musicStatus = 'uploaded';
          coverStatus = 'generating';
        } else {
          status = 'completed';
          message = '处理完成';
          musicStatus = 'uploaded';
          coverStatus = 'completed';
        }
    }

    // 检查是否有明显失败迹象（例如音频URL是临时标记但已超过5分钟）
    const now = new Date();
    const created = new Date(song.createdAt);
    const minutesSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60);

    if (minutesSinceCreation > 10 && status !== 'completed') {
      status = 'failed';
      message = '处理超时，可能失败';
      if (musicStatus === 'processing') musicStatus = 'failed';
      if (coverStatus === 'processing' || coverStatus === 'generating') coverStatus = 'failed';
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
      },
      details: {
        hasAudioKey: !!song.audioKey,
        hasCoverImageUrl: !!song.coverImageUrl,
        hasCoverImageKey: !!song.coverImageKey,
        processingStatus: song.processingStatus || 'processing',
        minutesSinceCreation: Math.round(minutesSinceCreation * 10) / 10,
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
