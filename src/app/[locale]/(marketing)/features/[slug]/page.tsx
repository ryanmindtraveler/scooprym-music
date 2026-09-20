import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { featuresContent } from '@/config/features';
import { songTopicTerms } from '@/config/song-topics';
import { getDb } from '@/db';
import { song as songTable, story as storyTable } from '@/db/schema';
import { createLatestGenerationAttemptQuery } from '@/db/song-query';
import { LOCALES } from '@/i18n/routing';
import { constructMetadata } from '@/lib/seo/metadata';
import { getNewsCardSummary } from '@/lib/songs/song-editorial';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { and, desc, eq, ilike, ne, notInArray, or, sql } from 'drizzle-orm';
import {
  ArrowRightIcon,
  CpuIcon,
  FingerprintIcon,
  PencilIcon,
  Settings2Icon,
  SparklesIcon,
  ZapIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

const iconMap = {
  'absurd-social-phenomena': <PencilIcon className="size-16" />,
  'entertainment-topics': <Settings2Icon className="size-16" />,
  'gossip-roast': <SparklesIcon className="size-16" />,
  'news-parody': <ZapIcon className="size-16" />,
  'meme-culture': <FingerprintIcon className="size-16" />,
  'comedy-drill': <CpuIcon className="size-16" />,
} as const;

// 专题试听入口必须及时响应发布与撤回操作。
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  const slugs = Object.keys(featuresContent);
  const params: { locale: string; slug: string }[] = [];

  for (const locale of LOCALES) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const feature = featuresContent[slug];
  if (!feature) return {};

  const langKey = locale.startsWith('zh') ? 'zh' : 'en';

  return constructMetadata({
    title: feature.metaTitle[langKey].replace(/\s*\|\s*ScoopRYM$/i, ''),
    description: feature.metaDescription[langKey],
    image: feature.imageUrl,
    locale: locale as Locale,
    pathname: `/features/${slug}`,
    keywords: feature.keywords[langKey],
  });
}

export default async function FeaturePage({ params }: Props) {
  const { locale, slug } = await params;
  const feature = featuresContent[slug];
  if (!feature) notFound();

  const isZh = locale.startsWith('zh');
  const langKey = isZh ? 'zh' : 'en';
  const title = feature.title[langKey];
  const h1 = feature.h1[langKey];
  const description = feature.description[langKey];
  const heroText = feature.heroText[langKey];
  const faqHeading = feature.faqHeading[langKey];
  const faqs = feature.faqs[langKey];
  const relatedPages = feature.relatedSlugs.map((relatedSlug) => featuresContent[relatedSlug]).filter(Boolean);
  const icon = iconMap[slug as keyof typeof iconMap];
  const db = getDb();
  const latestAttempt = createLatestGenerationAttemptQuery(db);
  const topicTerms = songTopicTerms[slug] || [];
  // 风格主题按制作风格匹配，其余主题按作品名称与编辑摘要匹配。
  const searchable =
    slug === 'comedy-drill' ? latestAttempt.prompt : sql`concat_ws(' ', ${songTable.title}, ${storyTable.newsSummary})`;
  const topicSongs = await db
    .select({ id: songTable.id, title: songTable.title, newsSummary: storyTable.newsSummary })
    .from(songTable)
    .innerJoin(storyTable, eq(storyTable.id, songTable.storyId))
    .innerJoin(latestAttempt, and(eq(latestAttempt.songId, songTable.id), eq(latestAttempt.rowNumber, 1)))
    .where(
      and(
        eq(songTable.isPublished, true),
        ne(songTable.audioUrl, ''),
        ne(songTable.audioUrl, 'pending-stream'),
        notInArray(latestAttempt.processingStatus, [
          'failed_generation',
          'processing_queue_failed',
          'failed_audio_upload',
          'failed_internal_error',
          'failed_credit_deduction',
        ]),
        topicTerms.length ? or(...topicTerms.map((term) => ilike(searchable, `%${term}%`))) : sql`false`
      )
    )
    .orderBy(desc(sql`coalesce(${songTable.publishedAt}, ${songTable.createdAt})`), desc(songTable.id))
    .limit(12);

  // Theme configuration for each topic (using homepage-inspired light palettes)
  const themeMap: Record<string, { blob1: string; blob2: string; textGradient: string; accent: string }> = {
    'absurd-social-phenomena': {
      blob1: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)',
      blob2: 'linear-gradient(225deg, #f472b6 0%, #c084fc 100%)',
      textGradient: 'from-[#22d3ee] via-[#e879f9] to-[#facc15]',
      accent: 'cyan',
    },
    'entertainment-topics': {
      blob1: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      blob2: 'linear-gradient(225deg, #f472b6 0%, #db2777 100%)',
      textGradient: 'from-[#f97316] via-[#f472b6] to-[#facc15]',
      accent: 'orange',
    },
    'gossip-roast': {
      blob1: 'linear-gradient(135deg, #db2777 0%, #c084fc 100%)',
      blob2: 'linear-gradient(225deg, #818cf8 0%, #4338ca 100%)',
      textGradient: 'from-[#db2777] via-[#c084fc] to-[#facc15]',
      accent: 'purple',
    },
    'news-parody': {
      blob1: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
      blob2: 'linear-gradient(225deg, #facc15 0%, #fde047 100%)',
      textGradient: 'from-[#dc2626] via-[#ea580c] to-[#facc15]',
      accent: 'red',
    },
    'meme-culture': {
      blob1: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
      blob2: 'linear-gradient(225deg, #4f46e5 0%, #818cf8 100%)',
      textGradient: 'from-[#0891b2] via-[#22d3ee] to-[#facc15]',
      accent: 'cyan',
    },
    'comedy-drill': {
      blob1: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      blob2: 'linear-gradient(225deg, #0891b2 0%, #22d3ee 100%)',
      textGradient: 'from-[#059669] via-[#0891b2] to-[#facc15]',
      accent: 'emerald',
    },
  };

  const currentTheme = themeMap[slug] || themeMap['absurd-social-phenomena'];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <BreadcrumbJsonLd
        items={[
          { name: isZh ? '首页' : 'Home', item: getUrlWithLocale('/', locale as Locale) },
          { name: isZh ? '功能' : 'Features', item: getUrlWithLocale('/songs', locale as Locale) },
          { name: title, item: getUrlWithLocale(`/features/${slug}`, locale as Locale) },
        ]}
      />
      <FaqJsonLd items={faqs} />

      {/* Premium Background System */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-slate-50">
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-color-burn"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute inset-0" style={{ filter: 'blur(100px)' }}>
          <div
            className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full mix-blend-multiply opacity-40 animate-gradient-xy"
            style={{ background: currentTheme.blob1 }}
          />
          <div
            className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] rounded-full mix-blend-multiply opacity-40 animate-gradient-xy"
            style={{ background: currentTheme.blob2, animationDelay: '-5s' }}
          />
        </div>
        <div className="absolute inset-0 bg-white/40" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10">
          <Link
            href={getUrlWithLocale('/songs', locale as Locale)}
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
          >
            <span className="transition-transform group-hover:-translate-x-1">{'<-'}</span>
            {isZh ? '返回特性卡片' : 'Browse all songs'}
          </Link>
        </div>

        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="space-y-10">
            <div
              className={`inline-flex rounded-3xl bg-white/60 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-xl ring-1 ring-white/80 ${feature.iconColor}`}
            >
              <div className="drop-shadow-lg">{icon}</div>
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-7xl xl:text-8xl leading-[0.9] text-slate-900">
              <span
                className="block bg-linear-to-r from-[#22d3ee] via-[#e879f9] to-[#facc15] bg-clip-text text-transparent pb-4 animate-gradient-x"
                style={{ backgroundSize: '200% auto' }}
              >
                {h1}
              </span>
            </h1>

            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/60 shadow-xl shadow-slate-200/40 transform transition-all hover:scale-[1.01]">
              <p className="max-w-3xl text-xl font-extrabold leading-relaxed text-slate-800 sm:text-2xl">{heroText}</p>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 font-medium sm:text-xl">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {feature.keywords.en.slice(0, 4).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-slate-200 bg-white/60 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-sm"
                >
                  #{keyword}
                </span>
              ))}
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="h-14 rounded-full bg-slate-900 px-8 text-base font-bold text-white shadow-2xl shadow-indigo-200 transition-all hover:scale-105 hover:bg-slate-800 sm:h-16 sm:px-10 sm:text-lg"
                asChild
              >
                <Link href={getUrlWithLocale('/songs', locale as Locale)}>
                  {isZh ? '开始生成' : 'Listen to published songs'}
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[3rem] border-4 border-white bg-white/40 shadow-2xl">
              <Image
                src={feature.imageUrl}
                alt={`${title} hero image`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-tr from-slate-900/10 via-transparent to-transparent" />
            </div>
          </div>
        </section>

        <div className="mt-24 space-y-32">
          <section className="space-y-8" aria-labelledby="topic-songs">
            <h2 id="topic-songs" className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">
              Published songs
            </h2>
            <p className="text-slate-600">
              Explore recent songs on this theme. Open a song to listen, read its lyrics, and see the available story
              background.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topicSongs.map((song) => (
                <article
                  key={song.id}
                  className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-lg shadow-slate-200/40"
                >
                  <h3 className="text-xl font-bold text-slate-900">
                    <Link
                      prefetch={false}
                      href={`/songs/${getSongCanonicalSlug(song)}`}
                      className="underline decoration-pink-300 underline-offset-4"
                    >
                      {song.title}
                    </Link>
                  </h3>
                  {song.newsSummary && <p className="mt-4 leading-7 text-slate-600">{getNewsCardSummary(song)}</p>}
                </article>
              ))}
            </div>
            {topicSongs.length === 0 && <p className="text-slate-600">No published songs match this theme yet.</p>}
            <Link href="/songs" className="inline-flex font-bold underline underline-offset-4">
              Browse all published songs
            </Link>
          </section>

          <section className="space-y-8">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">{faqHeading}</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-3xl border border-white/60 bg-white/40 p-8 backdrop-blur-xl shadow-lg shadow-slate-200/40"
                >
                  <h3 className="text-lg font-black text-slate-900">{faq.question}</h3>
                  <p className="mt-4 leading-7 text-slate-600 font-medium">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">
                {isZh ? '探索相关特性页面' : 'Explore related feature pages'}
              </h2>
              <p className="mt-3 max-w-2xl text-slate-500 font-medium">
                {isZh
                  ? '这些页面涵盖了相邻的内容角度，因此用户和搜索引擎可以了解您的主题有何不同。'
                  : 'Explore more news satire, celebrity drama, and internet culture.'}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPages.map((related) => (
                <Link
                  key={related.slug}
                  href={getUrlWithLocale(`/features/${related.slug}`, locale as Locale)}
                  className="group rounded-3xl border border-white/60 bg-white/40 p-6 backdrop-blur-xl shadow-lg shadow-slate-200/40 transition-all hover:bg-white/80 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-900">{related.title[langKey]}</h3>
                    <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-white transition-transform group-hover:translate-x-1">
                      <ArrowRightIcon className="size-4" />
                    </div>
                  </div>
                  <p className="mt-4 leading-7 text-slate-600 font-medium">{related.description[langKey]}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-white/60 bg-white/40 p-10 text-center shadow-2xl shadow-slate-200/50 backdrop-blur-3xl sm:p-16">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-slate-900 leading-[1.1]">
              {isZh ? '准备好将这个视角转化为 Diss Track 或梗歌了吗？' : 'Find your next meme song'}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600 font-bold sm:text-xl">
              {isZh
                ? '将荒诞新闻、八卦和社交混乱转化为更犀利、更易传播的 Diss Track 与恶搞说唱。'
                : 'Listen to published songs inspired by headlines, drama, and internet culture.'}
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="h-14 rounded-full bg-slate-900 px-10 text-base font-bold text-white shadow-2xl shadow-indigo-200 transition-all hover:scale-105 hover:bg-slate-800 sm:h-16 sm:text-lg"
                asChild
              >
                <Link href={getUrlWithLocale('/songs', locale as Locale)}>
                  {isZh ? '立即开始创作' : 'Browse the song archive'}
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
