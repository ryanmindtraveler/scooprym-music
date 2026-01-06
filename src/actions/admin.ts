'use server';

import { getDb } from '@/db';
import { payment, song, user } from '@/db/schema';
import { count, desc, eq, sql, and, gt, gte } from 'drizzle-orm';

/**
 * Fetch Key Performance Indicators (KPIs)
 */
export async function getAdminStats() {
  const db = getDb();

  // Helper to calculate percentage growth
  const calculateGrowth = (current: number, recent: number) => {
    const previous = current - recent;
    if (previous === 0) return recent > 0 ? 100 : 0;
    return ((recent / previous) * 100);
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
    .where(
      and(
        eq(payment.type, 'subscription'),
        gt(payment.periodEnd, new Date())
      )
    );

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
    .from(song)
    .where(eq(song.processingStatus, 'processing'));

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

  const songs = await db
    .select({
      id: song.id,
      title: song.title,
      coverImageUrl: song.coverImageUrl,
      audioUrl: song.audioUrl,
      prompt: song.prompt,
      tags: song.prompt, // Using prompt as tags for now if separate tags aren't stored array
      duration: song.durationSec,
      createdAt: song.createdAt,
      user: {
        name: user.name,
        image: user.image,
        email: user.email,
      },
    })
    .from(song)
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

  // Create an array of last 7 days strings
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Group by date (Adjusted to UTC+8 for Chinese Context as per user environment)
  // We offset the DB timestamp by 8 hours to align with the JS 'last7Days' generation
  // which runs in the system timezone (CST/UTC+8).
  const rawStats = await db
    .select({
      date: sql<string>`to_char(${song.createdAt} + interval '8 hours', 'Mon DD')`,
      count: count(),
    })
    .from(song)
    .where(gte(song.createdAt, sevenDaysAgo))
    .groupBy(sql`to_char(${song.createdAt} + interval '8 hours', 'Mon DD')`)
    .orderBy(sql`to_char(${song.createdAt} + interval '8 hours', 'Mon DD')`);

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
