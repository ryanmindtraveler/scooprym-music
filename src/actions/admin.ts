'use server';

import { getDb } from '@/db';
import {
  generationAttempt,
  hotSheetEdition,
  payment,
  radarCreationJob,
  song,
  songCommentReport,
  songCreationStep,
  songEngagementEvent,
  storyCandidate,
  storyCandidateVote,
  user,
} from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { canUseQStash } from '@/lib/infrastructure/queue';
import { getBusinessDayStart, getPreviousBusinessDayKeys } from '@/lib/shared/business-time';
import { SONG_FAILURE_PROCESSING_STATUSES } from '@/lib/songs/song-status';
import { getVoteDay } from '@/lib/stories/story-voting';
import { and, count, countDistinct, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';

type QStashLog = {
  state?: string;
  time?: number;
  responseStatus?: number;
};

async function getQStashDeliverySummary() {
  if (!canUseQStash()) {
    return { configured: false, reachable: false, delivered: 0, retrying: 0, failed: 0, lastDeliveryAt: null };
  }

  const baseUrl = (process.env.QSTASH_URL || 'https://qstash.upstash.io').replace(/\/$/, '');
  const fromDate = Date.now() - 24 * 60 * 60 * 1000;
  try {
    const response = await fetch(`${baseUrl}/v2/logs?count=100&fromDate=${fromDate}`, {
      headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new Error(`QStash logs returned ${response.status}`);
    const payload = (await response.json()) as { logs?: QStashLog[] };
    const logs = payload.logs || [];
    const deliveredLogs = logs.filter((log) => log.state === 'DELIVERED');
    return {
      configured: true,
      reachable: true,
      delivered: deliveredLogs.length,
      retrying: logs.filter((log) => ['ACTIVE', 'RETRY', 'ERROR', 'IN_PROGRESS'].includes(log.state || '')).length,
      failed: logs.filter((log) => log.state === 'FAILED').length,
      lastDeliveryAt: deliveredLogs.length
        ? new Date(Math.max(...deliveredLogs.map((log) => Number(log.time || 0)))).toISOString()
        : null,
    };
  } catch (error) {
    console.warn('[admin-dashboard] Unable to read QStash delivery logs.', error);
    return { configured: true, reachable: false, delivered: 0, retrying: 0, failed: 0, lastDeliveryAt: null };
  }
}

/**
 * Fetch Key Performance Indicators (KPIs)
 */
export async function getAdminStats() {
  const db = getDb();

  // Helper to calculate percentage growth
  const calculateGrowth = (current: number, recent: number) => {
    const previous = current - recent;
    if (previous === 0) return recent > 0 ? 100 : 0;
    return (recent / previous) * 100;
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Revenue
  const revenueTotalResult = await db
    .select({ total: sql<number>`sum(${payment.amount})` })
    .from(payment)
    .where(eq(payment.status, 'succeeded'));

  const revenueRecentResult = await db
    .select({ total: sql<number>`sum(${payment.amount})` })
    .from(payment)
    .where(and(eq(payment.status, 'succeeded'), gt(payment.createdAt, thirtyDaysAgo)));

  const totalRevenue = revenueTotalResult[0]?.total || 0;
  const recentRevenue = revenueRecentResult[0]?.total || 0;
  const revenueGrowth = calculateGrowth(totalRevenue, recentRevenue);

  // 2. Users
  const userTotalResult = await db.select({ count: count() }).from(user);
  const userRecentResult = await db.select({ count: count() }).from(user).where(gt(user.createdAt, thirtyDaysAgo));

  const totalUsers = userTotalResult[0]?.count || 0;
  const recentUsers = userRecentResult[0]?.count || 0;
  const usersGrowth = calculateGrowth(totalUsers, recentUsers);

  // 3. Songs
  const songTotalResult = await db.select({ count: count() }).from(song);
  const songRecentResult = await db.select({ count: count() }).from(song).where(gt(song.createdAt, thirtyDaysAgo));

  const totalSongs = songTotalResult[0]?.count || 0;
  const recentSongs = songRecentResult[0]?.count || 0;
  const songsGrowth = calculateGrowth(totalSongs, recentSongs);

  // 4. Active Subscriptions
  const subResult = await db
    .select({ count: count() })
    .from(payment)
    .where(and(eq(payment.type, 'subscription'), gt(payment.periodEnd, new Date())));

  // For Subs Growth, compare with active subs 30 days ago is hard without history table.
  // Proxy: New subscriptions started in last 30 days.
  const subRecentResult = await db
    .select({ count: count() })
    .from(payment)
    .where(and(eq(payment.type, 'subscription'), gt(payment.createdAt, thirtyDaysAgo)));

  const activeSubs = subResult[0]?.count || 0;
  const recentSubs = subRecentResult[0]?.count || 0;
  // This growth logic is slightly flawed for churn but acceptable as "New Acquisition Rate" proxy for now.
  const subsGrowth = calculateGrowth(activeSubs, recentSubs);

  // 5. Queue Length
  const queueResult = await db
    .select({ count: count() })
    .from(generationAttempt)
    .where(eq(generationAttempt.processingStatus, 'processing'));

  const queueLength = queueResult[0]?.count || 0;

  return {
    revenue: totalRevenue,
    revenueGrowth,
    users: totalUsers,
    usersGrowth,
    songs: totalSongs,
    songsGrowth,
    activeSubs: activeSubs,
    subsGrowth,
    queueLength: queueLength,
    recentRevenue,
    recentUsers,
    recentSongs,
    recentSubs,
  };
}

/**
 * Fetch Live Song Feed (Recent Generations)
 */
export async function getLiveSongs(limit = 20) {
  const db = getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);

  const songs = await db
    .select({
      id: song.id,
      title: song.title,
      coverImageUrl: song.coverImageUrl,
      audioUrl: song.audioUrl,
      prompt: latestAttempt.prompt,
      tags: latestAttempt.prompt, // 暂时将最近一次生成方向作为标签展示。
      duration: song.durationSec,
      createdAt: song.createdAt,
      user: {
        name: user.name,
        image: user.image,
        email: user.email,
      },
    })
    .from(song)
    .leftJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
    .leftJoin(user, eq(song.userId, user.id))
    .orderBy(desc(song.createdAt))
    .limit(limit);

  return songs;
}

/**
 * Fetch Recent Transactions
 */
export async function getRecentTransactions(limit = 10) {
  const db = getDb();

  const transactions = await db
    .select({
      id: payment.id,
      amount: payment.amount,
      type: payment.type,
      status: payment.status,
      createdAt: payment.createdAt,
      customerId: payment.customerId,
      user: {
        name: user.name,
        email: user.email,
      },
    })
    .from(payment)
    .leftJoin(user, eq(payment.userId, user.id))
    .orderBy(desc(payment.createdAt))
    .limit(limit);

  return transactions;
}

/**
 * Fetch Daily Generation Stats (Last 7 Days)
 */
export async function getDailyStats() {
  const db = getDb();
  const now = new Date();

  const businessDayKeys = getPreviousBusinessDayKeys(now, 7).reverse();
  const last7Days = businessDayKeys.map((dayKey) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' }).format(
      new Date(`${dayKey}T12:00:00.000Z`)
    )
  );
  const sevenDaysAgo = getBusinessDayStart(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1_000));

  // 数据库存 UTC 时间点，统计时转换为 America/Los_Angeles 的业务日。
  const californiaDate = sql`(${song.createdAt} AT TIME ZONE 'UTC') AT TIME ZONE 'America/Los_Angeles'`;
  const rawStats = await db
    .select({
      date: sql<string>`to_char(${californiaDate}, 'Mon DD')`,
      count: count(),
    })
    .from(song)
    .where(gte(song.createdAt, sevenDaysAgo))
    .groupBy(sql`to_char(${californiaDate}, 'Mon DD')`)
    .orderBy(sql`to_char(${californiaDate}, 'Mon DD')`);

  // Fill in missing days
  const stats = last7Days.map((dateStr) => {
    const found = rawStats.find((s) => s.date === dateStr);
    return {
      date: dateStr,
      count: found ? found.count : 0,
    };
  });

  return stats;
}

/** 最近 30 天内容消费漏斗。 */
export async function getEngagementFunnel() {
  const db = getDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      detailViews: sql<number>`count(*) filter (where ${songEngagementEvent.eventType} = 'detail_view')`,
      playStarts: sql<number>`count(*) filter (where ${songEngagementEvent.eventType} = 'play_start')`,
      qualifiedPlays: sql<number>`count(*) filter (where ${songEngagementEvent.eventType} = 'play_qualified')`,
      completedPlays: sql<number>`count(*) filter (where ${songEngagementEvent.eventType} = 'play_complete')`,
      shares: sql<number>`count(*) filter (where ${songEngagementEvent.eventType} = 'share')`,
    })
    .from(songEngagementEvent)
    .where(gte(songEngagementEvent.createdAt, since));

  return {
    detailViews: Number(row?.detailViews || 0),
    playStarts: Number(row?.playStarts || 0),
    qualifiedPlays: Number(row?.qualifiedPlays || 0),
    completedPlays: Number(row?.completedPlays || 0),
    shares: Number(row?.shares || 0),
  };
}

/**
 * 编辑部每日运营汇总。
 * 这里只聚合各业务模块的状态，不在 Overview 中复制 Radar、创作或发布功能。
 */
export async function getEditorialOperations() {
  const db = getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const now = new Date();
  const businessDayStart = getBusinessDayStart(now);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const voteDay = getVoteDay(now);

  const [
    freshRows,
    shortlistedRows,
    inProductionRows,
    adoptedTodayRows,
    voteRows,
    activeGenerationRows,
    failedGenerationRows,
    readyForReviewRows,
    scheduledRows,
    publishedTodayRows,
    topVotedRows,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(storyCandidate)
      .where(
        and(gte(storyCandidate.publishedAt, threeDaysAgo), inArray(storyCandidate.status, ['new', 'shortlisted']))
      ),
    db.select({ count: count() }).from(storyCandidate).where(eq(storyCandidate.status, 'shortlisted')),
    db.select({ count: count() }).from(storyCandidate).where(eq(storyCandidate.status, 'adopted')),
    db.select({ count: count() }).from(storyCandidate).where(gte(storyCandidate.adoptedAt, businessDayStart)),
    db
      .select({
        selections: count(storyCandidateVote.id),
        voters: countDistinct(storyCandidateVote.userId),
        stories: countDistinct(storyCandidateVote.candidateId),
      })
      .from(storyCandidateVote)
      .where(eq(storyCandidateVote.voteDay, voteDay)),
    db
      .select({ count: count() })
      .from(song)
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(inArray(latestAttempt.processingStatus, ['queued', 'processing', 'audio_uploaded'])),
    db
      .select({ count: count() })
      .from(song)
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(
          inArray(latestAttempt.processingStatus, SONG_FAILURE_PROCESSING_STATUSES),
          gte(latestAttempt.updatedAt, threeDaysAgo)
        )
      ),
    db
      .select({ count: count() })
      .from(song)
      .innerJoin(latestAttempt, and(eq(latestAttempt.songId, song.id), eq(latestAttempt.rowNumber, 1)))
      .where(
        and(
          inArray(latestAttempt.processingStatus, ['completed', 'completed_without_cover']),
          or(eq(song.isPublished, false), isNull(song.isPublished)),
          gte(latestAttempt.updatedAt, threeDaysAgo)
        )
      ),
    db
      .select({ count: count() })
      .from(song)
      .where(and(or(eq(song.isPublished, false), isNull(song.isPublished)), isNotNull(song.scheduledAt))),
    db
      .select({ count: count() })
      .from(song)
      .where(and(eq(song.isPublished, true), gte(song.publishedAt, businessDayStart))),
    db
      .select({
        id: storyCandidate.id,
        title: storyCandidate.sourceTitle,
        votes: count(storyCandidateVote.id),
      })
      .from(storyCandidateVote)
      .innerJoin(storyCandidate, eq(storyCandidate.id, storyCandidateVote.candidateId))
      .where(eq(storyCandidateVote.voteDay, voteDay))
      .groupBy(storyCandidate.id, storyCandidate.sourceTitle)
      .orderBy(desc(count(storyCandidateVote.id)))
      .limit(1),
  ]);

  const votes = voteRows[0];
  const topVoted = topVotedRows[0];

  return {
    voteDay,
    radar: {
      fresh: Number(freshRows[0]?.count || 0),
      shortlisted: Number(shortlistedRows[0]?.count || 0),
      inProduction: Number(inProductionRows[0]?.count || 0),
      adoptedToday: Number(adoptedTodayRows[0]?.count || 0),
    },
    audience: {
      selections: Number(votes?.selections || 0),
      voters: Number(votes?.voters || 0),
      stories: Number(votes?.stories || 0),
      topStory: topVoted
        ? {
            id: topVoted.id,
            title: topVoted.title,
            votes: Number(topVoted.votes || 0),
          }
        : null,
    },
    production: {
      active: Number(activeGenerationRows[0]?.count || 0),
      failed: Number(failedGenerationRows[0]?.count || 0),
    },
    publishing: {
      readyForReview: Number(readyForReviewRows[0]?.count || 0),
      scheduled: Number(scheduledRows[0]?.count || 0),
      publishedToday: Number(publishedTodayRows[0]?.count || 0),
    },
  };
}

/**
 * 运营总览基础设施数据。
 * 模型状态来自最近真实工作流，不通过额外生成内容制造费用；QStash 读取最近投递日志并与本地任务状态对照。
 */
export async function getInfrastructureOverview() {
  const db = getDb();
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const staleBefore = new Date(now.getTime() - 10 * 60 * 1000);

  const [modelRows, musicQueueRows, radarQueueRows, staleMusicRows, staleRadarRows, reportRows, archiveRows, qstash] =
    await Promise.all([
      db
        .select({
          provider: songCreationStep.provider,
          model: songCreationStep.model,
          total: count(),
          completed: sql<number>`count(*) filter (where ${songCreationStep.status} = 'completed')`,
          failed: sql<number>`count(*) filter (where ${songCreationStep.status} = 'failed')`,
          averageDurationMs: sql<number>`coalesce(avg(extract(epoch from (${songCreationStep.completedAt} - ${songCreationStep.startedAt})) * 1000) filter (where ${songCreationStep.completedAt} is not null), 0)`,
          lastSeenAt: sql<Date>`max(${songCreationStep.startedAt})`,
        })
        .from(songCreationStep)
        .where(and(gte(songCreationStep.startedAt, since), isNotNull(songCreationStep.provider)))
        .groupBy(songCreationStep.provider, songCreationStep.model),
      db
        .select({ status: generationAttempt.processingStatus, total: count() })
        .from(generationAttempt)
        .where(inArray(generationAttempt.processingStatus, ['queued', 'processing', 'processing_queue_failed']))
        .groupBy(generationAttempt.processingStatus),
      db
        .select({ status: radarCreationJob.status, total: count() })
        .from(radarCreationJob)
        .where(inArray(radarCreationJob.status, ['queued', 'running', 'failed']))
        .groupBy(radarCreationJob.status),
      db
        .select({ total: count() })
        .from(generationAttempt)
        .where(
          and(
            inArray(generationAttempt.processingStatus, ['queued', 'processing']),
            lt(generationAttempt.updatedAt, staleBefore)
          )
        ),
      db
        .select({ total: count() })
        .from(radarCreationJob)
        .where(
          and(inArray(radarCreationJob.status, ['queued', 'running']), lt(radarCreationJob.updatedAt, staleBefore))
        ),
      db.select({ total: count() }).from(songCommentReport).where(eq(songCommentReport.status, 'pending')),
      db
        .select({ day: hotSheetEdition.day, status: hotSheetEdition.status, completedAt: hotSheetEdition.completedAt })
        .from(hotSheetEdition)
        .orderBy(desc(hotSheetEdition.day))
        .limit(1),
      getQStashDeliverySummary(),
    ]);

  const queueCount = (rows: Array<{ status: string | null; total: number }>, status: string) =>
    Number(rows.find((row) => row.status === status)?.total || 0);

  return {
    models: modelRows.map((row) => ({
      provider: row.provider || 'unknown',
      model: row.model || '未记录模型',
      total: Number(row.total || 0),
      completed: Number(row.completed || 0),
      failed: Number(row.failed || 0),
      averageDurationMs: Math.round(Number(row.averageDurationMs || 0)),
      lastSeenAt: row.lastSeenAt ? new Date(row.lastSeenAt).toISOString() : null,
    })),
    qstash,
    queues: {
      music: {
        queued: queueCount(musicQueueRows, 'queued'),
        processing: queueCount(musicQueueRows, 'processing'),
        failed: queueCount(musicQueueRows, 'processing_queue_failed'),
        stale: Number(staleMusicRows[0]?.total || 0),
      },
      radar: {
        queued: queueCount(radarQueueRows, 'queued'),
        processing: queueCount(radarQueueRows, 'running'),
        failed: queueCount(radarQueueRows, 'failed'),
        stale: Number(staleRadarRows[0]?.total || 0),
      },
    },
    pendingReports: Number(reportRows[0]?.total || 0),
    hotSheet: archiveRows[0]
      ? {
          day: archiveRows[0].day,
          status: archiveRows[0].status,
          completedAt: archiveRows[0].completedAt?.toISOString() || null,
        }
      : null,
    costTrackingAvailable: false,
  };
}
