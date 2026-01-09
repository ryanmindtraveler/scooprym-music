import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { QuickGenerateForm } from '@/components/home/quick-generate-form';
import { TrendingGalleryClient } from '@/components/home/trending-gallery-client';
import { Card } from '@/components/ui/card';

import { getSession } from '@/lib/server';
import { Flame, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { getDb } from '@/db';
import { songFavorite, song as songTable, user } from '@/db/schema';
import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// 定义歌曲数据项的接口，用于前端组件的数据类型规范
interface SongItem {
  id: string;
  title: string;
  createdAt: Date;
  durationSec: number | null;
  plays: number;
  audioUrl?: string | null;
  category?: string;
  coverImageUrl?: string | null;
  prompt?: string | null;
  lyrics?: string | null;
  sourceText?: string | null;
  newsSummary?: string | null;
  isLiked: boolean;
}

/**
 * 热门画廊组件 (服务端组件)
 * 职责：直接连接数据库，获取管理员生成的最新歌曲数据，并传递给客户端组件渲染
 */
/**
 * 热门画廊组件 (服务端组件)
 * 职责：直接连接数据库，获取管理员生成的最新歌曲数据，并传递给客户端组件渲染
 */
async function TrendingGallery({ currentPage }: { currentPage: number }) {
  const pageSize = 18;
  const offset = (currentPage - 1) * pageSize;

  // 1. 获取数据库连接
  const db = await getDb();
  const session = await getSession();
  const userId = session?.user?.id;

  // 基础查询条件
  const whereConditions = and(eq(user.role, 'admin'), eq(songTable.isPublished, true));

  // 2.1 查询总数
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(songTable)
    .innerJoin(user, eq(songTable.userId, user.id))
    .where(whereConditions);

  const totalCount = totalCountResult?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // 2.2 分页查询数据库
  const rows = await db
    .select()
    .from(songTable)
    .innerJoin(user, eq(songTable.userId, user.id))
    .where(whereConditions)
    .orderBy(desc(songTable.createdAt))
    .limit(pageSize)
    .offset(offset)
    .then((res) => res.map((row) => row.song));

  // 获取用户收藏的歌曲ID集合
  const likedSongIds = new Set<string>();
  if (userId) {
    const favorites = await db
      .select({ songId: songFavorite.songId })
      .from(songFavorite)
      .where(eq(songFavorite.userId, userId));
    favorites.forEach((f) => likedSongIds.add(f.songId));
  }

  // 3. 数据转换
  const songs: SongItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt!,
    durationSec: r.durationSec ?? null,
    plays: r.plays ?? 0,
    audioUrl: r.audioUrl,
    category: 'News', // 目前硬编码分类为 News
    coverImageUrl: r.coverImageUrl ?? null,
    prompt: r.prompt ?? null,
    lyrics: r.lyrics ?? null,
    sourceText: r.sourceText ?? null,
    newsSummary: r.newsSummary ?? null,
    isLiked: likedSongIds.has(r.id),
  }));

  // 4. 渲染客户端组件，将处理好的数据作为 props 传入
  return <TrendingGalleryClient songs={songs} currentPage={currentPage} totalPages={totalPages} />;
}

/**
 * 骨架屏组件
 */
function TrendingGallerySkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 mb-8">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[160px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 首页主页面 (默认导出)
 * 这是一个 Async Server Component
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;

  // 获取服务端翻译函数
  const t = await getTranslations();

  // 定义面包屑导航路径
  const breadcrumbs = [
    {
      label: t('Dashboard.home.title', { default: 'Home' }),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      {/* 顶部导航栏，传入面包屑数据 */}
      <DashboardHeader breadcrumbs={breadcrumbs} />

      {/* 页面主要内容容器 */}
      <div className="flex flex-1 flex-col min-h-full pb-24">
        {/* === 第一部分：快速创作区 === */}
        {/* 占据视口高度的 20%，最小高度 200px，居中显示 */}
        <section className="w-full py-8 px-4 md:px-8">
          <div className="w-full max-w-[1800px] mx-auto">
            <QuickGenerateForm />
          </div>
        </section>

        {/* === 第二部分：热门展示区 === */}
        {/* flex-1 使其占据页面剩余的所有空间 */}
        <section className="flex-1 p-4 md:p-8">
          <div className="max-w-[1800px] mx-auto w-full space-y-8">
            {/* 标题区域：包含火焰图标和文字 */}
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Flame className="size-6" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter">
                Trending <span className="text-primary">now</span>
              </h2>
            </div>

            {/* 调用上面定义的异步组件来展示列表 */}
            <Suspense fallback={<TrendingGallerySkeleton />}>
              <TrendingGallery currentPage={currentPage} />
            </Suspense>
          </div>
        </section>
      </div>
    </>
  );
}
