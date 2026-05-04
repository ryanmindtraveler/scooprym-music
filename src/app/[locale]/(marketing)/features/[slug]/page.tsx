import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { featuresContent } from '@/config/features';
import { LOCALES } from '@/i18n/routing';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  AudioWaveformIcon,
  BinaryIcon,
  CheckCheckIcon,
  CheckCircle2,
  CpuIcon,
  FingerprintIcon,
  FlameIcon,
  HashIcon,
  InfoIcon,
  MessageCircleIcon,
  PencilIcon,
  PhoneIcon,
  RadioIcon,
  Settings2Icon,
  SparklesIcon,
  TerminalIcon,
  UserCircle2Icon,
  VideoIcon,
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
    title: feature.metaTitle[langKey],
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
  const intro = feature.intro[langKey];
  const benefitsHeading = feature.benefitsHeading[langKey];
  const benefits = feature.benefits[langKey];
  const useCasesHeading = feature.useCasesHeading[langKey];
  const useCases = feature.useCases[langKey];
  const faqHeading = feature.faqHeading[langKey];
  const faqs = feature.faqs[langKey];
  const relatedPages = feature.relatedSlugs.map((relatedSlug) => featuresContent[relatedSlug]).filter(Boolean);
  const icon = iconMap[slug as keyof typeof iconMap];
  const archiveSongUrls =
    slug === 'absurd-social-phenomena'
      ? [
          'https://scooprym.app/songs/the-bardstown-bender-f8a8e177-6f18-4cbd-9f70-1f479128954a',
          'https://scooprym.app/songs/al-dente-felony-4f0de696-b9d1-451a-abed-b96044514491',
          'https://scooprym.app/songs/the-gavel-and-the-gas-91658fb9-b0f0-4cdd-b586-fcebb7b2d0c7',
          'https://scooprym.app/songs/the-sunshine-state-silhouette-6523bb10-c6d0-41d6-b0a8-f04b4fd63cd1',
          'https://scooprym.app/songs/the-golden-waterfall-63ce09c5-b702-4ec9-8bd4-14b5624d9e1a',
          'https://scooprym.app/songs/lights-sirens-and-lagers-3523b8c0-3fde-4fa9-be52-64ebf3683894',
          'https://scooprym.app/songs/the-flannel-felony-316d278c-993c-47b6-973d-0e90d19a5301',
          'https://scooprym.app/songs/pasta-engine-paralysis-f358b6af-c0a9-4ca1-85ed-d450a4e2cb37',
          'https://scooprym.app/songs/chrome-claw-oklahoma-e64e85ac-19ff-4ca2-bc06-8429c9a569e4',
        ]
      : [];

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
          { name: isZh ? '功能' : 'Features', item: `${getUrlWithLocale('/', locale as Locale)}#features` },
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
              href={`${getUrlWithLocale('/', locale as Locale)}#features`}
              className="group inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
            >
            <span className="transition-transform group-hover:-translate-x-1">{'<-'}</span>
            {isZh ? '返回特性卡片' : 'Back to feature cards'}
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
                <Link href={`${getUrlWithLocale('/', locale as Locale)}#generator`}>
                  {isZh ? '开始生成' : 'Start generating'}
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

            <div className="rounded-[2.5rem] border border-white/60 bg-white/40 p-8 backdrop-blur-2xl shadow-xl shadow-slate-200/40">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                {isZh ? '目标关键词角度' : 'Target keyword angles'}
              </h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {feature.keywords.en.map((keyword) => (
                  <li
                    key={keyword}
                    className="rounded-2xl border border-white/80 bg-white/60 px-4 py-3 text-sm font-bold text-slate-600 shadow-sm"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-24 space-y-32">
          {feature.layoutType !== 'case-archive' && (
            <section className="rounded-[3rem] border border-white/60 bg-white/40 p-10 backdrop-blur-3xl shadow-2xl shadow-slate-200/50 sm:p-14">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl text-slate-900">
                {isZh ? '这个主题背后的核心叙事' : 'The core narrative behind this'}
              </h2>
              <div className="mt-8 space-y-6 text-lg leading-relaxed text-slate-600 font-medium sm:text-xl">
                {intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {feature.layoutType === 'case-archive' ? (
            <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-3 rounded-full border border-pink-500/30 bg-pink-500/10 px-6 py-2 text-sm font-black tracking-[0.3em] uppercase text-pink-500 backdrop-blur-md">
                  <SparklesIcon className="size-4 animate-pulse" />
                  {isZh ? '绝密档案库' : 'Classified Files'}
                </div>
                <h2 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl bg-linear-to-b from-slate-900 via-slate-800 to-slate-500 bg-clip-text text-transparent">
                  {isZh ? '2025-26 荒诞档案' : '25/26 Absurdity Log'}
                </h2>
                <p className="max-w-2xl text-xl text-slate-500 leading-relaxed font-bold">
                  {isZh
                    ? '全球社交媒体深度提取的 9 个真实整活案例，已为您的一键生歌做好“暴击”准备。'
                    : '9 real-world viral anomalies from global feeds, analyzed and ready for your AI song transformation.'}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  ...benefits.map((b) => ({ ...b, description: b.desc })),
                  ...useCases.map((u) => ({ ...u, description: u.desc })),
                  ...(feature.trendingExamples?.[langKey] || []),
                ].map((item, idx) => {
                  const songUrl = archiveSongUrls[idx];

                  return (
                  <article
                    key={item.title}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[3rem] border border-white/80 bg-white/60 p-10 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-200/50 backdrop-blur-xl"
                  >
                    {/* Background Index Decor */}
                    <div className="absolute -right-4 -top-8 select-none font-mono text-[10rem] font-black leading-none text-slate-900/[0.03] transition-all duration-500 group-hover:text-pink-500/[0.05] group-hover:-translate-y-2">
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-8 flex items-center justify-between">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500/10 to-purple-500/10 text-pink-500 ring-1 ring-pink-500/20 shadow-sm">
                          <ZapIcon className="size-7" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-pink-500/60">
                          LOG_ID: {((idx + 1) * 1337).toString(36).toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-3xl font-black leading-[1.1] tracking-tight text-slate-900 group-hover:text-pink-600 transition-colors">
                        {item.title}
                      </h3>

                      <div className="mt-4 h-1 w-12 rounded-full bg-linear-to-r from-pink-500 to-transparent transition-all duration-500 group-hover:w-24 group-hover:from-pink-400 group-hover:to-pink-600" />

                      <p className="mt-8 text-lg font-bold leading-relaxed text-slate-600 grow group-hover:text-slate-900 transition-colors">
                        "{item.description}"
                      </p>

                      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {isZh ? '收录日期' : 'Detection Date'}
                          </span>
                          <span className="text-sm font-black text-pink-500">
                            {isZh ? '2025/26 档案分析' : '2025/26 ANALYSIS'}
                          </span>
                        </div>
                        {songUrl ? (
                          <Link
                            href={songUrl}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-300 group-hover:rotate-45 group-hover:border-pink-500 group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-200"
                            aria-label={`Open song for ${item.title}`}
                          >
                            <ArrowRightIcon className="size-5" />
                          </Link>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-300 group-hover:rotate-45 group-hover:border-pink-500 group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-200">
                            <ArrowRightIcon className="size-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>
            </section>
          ) : feature.layoutType === 'hot-billboard' ? (
            <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-6 py-2 text-sm font-black tracking-widest uppercase text-orange-600 backdrop-blur-md">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                  </span>
                  {isZh ? '全球热歌榜' : 'Global Hot Hits'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl bg-linear-to-r from-orange-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                  {isZh ? '2025-26 爆款风云榜' : '25/26 Billboard Top 9'}
                </h2>
                <p className="max-w-2xl text-xl text-slate-500 leading-relaxed font-bold">
                  {isZh
                    ? '收录全球娱乐圈最炸裂的狗血闹剧和史诗级名场面，一键打造成下一首血洗短视频的洗脑神曲。'
                    : 'The most explosive celebrity drama and pop culture chaos, curated and ready to be remixed into your next viral hit.'}
                </p>
              </div>

              <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full">
                {[
                  ...benefits.map((b) => ({ ...b, description: b.desc })),
                  ...useCases.map((u) => ({ ...u, description: u.desc })),
                  ...(feature.trendingExamples?.[langKey] || []),
                ].map((item, idx) => (
                  <article
                    key={item.title}
                    className="group relative flex flex-col md:flex-row items-center gap-6 overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/60 p-8 transition-all duration-300 hover:scale-[1.01] hover:bg-white/80 hover:shadow-2xl hover:shadow-orange-200/50 backdrop-blur-xl"
                  >
                    {/* Rank Number */}
                    <div className="flex items-center justify-center min-w-[120px] relative">
                      <span
                        className={`text-8xl font-black tracking-tighter ${idx < 3 ? 'bg-linear-to-b from-orange-400 via-rose-500 to-purple-600 bg-clip-text text-transparent drop-shadow-sm' : 'text-slate-200 group-hover:text-slate-300 transition-colors'}`}
                      >
                        {idx + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="grow flex flex-col gap-2">
                      <h3 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-lg text-slate-600 font-medium leading-relaxed md:line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Stats / Action Area */}
                    <div className="flex flex-row md:flex-col items-center gap-6 md:min-w-[140px] justify-between w-full md:w-auto mt-6 md:mt-0 pt-6 md:pt-0 border-t border-slate-100 md:border-t-0">
                      <div className="flex flex-col items-start md:items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {isZh ? '热度峰值' : 'Peak Trend'}
                        </span>
                        <div className="flex items-center gap-1 text-orange-500">
                          <ZapIcon className="size-4 animate-pulse" />
                          <span className="font-mono font-black text-lg">{100 - idx * 10}M+</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="flex size-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 transition-all hover:bg-orange-600 hover:text-white hover:border-orange-600 hover:scale-110 hover:shadow-lg hover:shadow-orange-200"
                      >
                        <ArrowRightIcon className="size-6" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : feature.layoutType === 'leaked-chat' ? (
            <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-6 py-2 text-sm font-black tracking-widest uppercase text-green-600 backdrop-blur-md">
                  <MessageCircleIcon className="size-4 animate-bounce" />
                  {isZh ? '私密泄露记录' : 'Leaked Chat Logs'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl bg-linear-to-b from-green-500 to-emerald-700 bg-clip-text text-transparent">
                  {isZh ? '全网顶流大翻车' : 'The Tea Room'}
                </h2>
                <p className="max-w-2xl text-xl text-slate-500 leading-relaxed font-bold">
                  {isZh
                    ? '为您独家截获2025-26年全球最大牌的公关灾难和互撕大戏，用最锐利的Beat将它们全部串烤。'
                    : 'Intercepted PR disasters, viral apologies, and public feuds—ready to be roasted on a heavy beat.'}
                </p>
              </div>

              <div className="mx-auto w-full max-w-4xl rounded-[3rem] border border-white bg-white/60 p-5 md:p-10 shadow-2xl shadow-slate-200/60 backdrop-blur-3xl relative overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-green-400 to-emerald-600 shadow-lg">
                      <UserCircle2Icon className="size-9 text-white/50" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-slate-900 tracking-tight">
                        {isZh ? '匿名爆料人' : 'Anonymous Leaker'}
                      </span>
                      <span className="text-xs text-green-600 font-black animate-pulse uppercase tracking-widest">
                        {isZh ? '直播线报' : 'Live Feed'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-slate-400">
                    <div className="p-3 rounded-full hover:bg-slate-50 transition-colors">
                      <PhoneIcon className="size-5" />
                    </div>
                    <div className="p-3 rounded-full hover:bg-slate-50 transition-colors">
                      <VideoIcon className="size-5" />
                    </div>
                    <div className="p-3 rounded-full hover:bg-slate-50 transition-colors">
                      <InfoIcon className="size-5" />
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex flex-col gap-8">
                  {[
                    ...benefits.map((b) => ({ ...b, description: b.desc })),
                    ...useCases.map((u) => ({ ...u, description: u.desc })),
                    ...(feature.trendingExamples?.[langKey] || []),
                  ].map((item, idx) => {
                    const isSender = idx % 2 === 0;
                    return (
                      <article
                        key={item.title}
                        className={`flex flex-col w-full max-w-[85%] ${isSender ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <span className="text-[10px] font-black text-slate-400 mb-2 px-3 tracking-widest uppercase">
                          {isZh ? '今天' : 'Today'} {10 + (idx % 12)}:{String(15 + idx * 7).padStart(2, '0')}{' '}
                          {isSender ? 'AM' : 'PM'}
                        </span>
                        <div
                          className={`relative rounded-[2rem] p-6 text-left transition-transform hover:scale-[1.02] cursor-default shadow-sm
                            ${
                              isSender
                                ? 'bg-linear-to-br from-indigo-600 via-violet-600 to-purple-600 text-white rounded-br-sm shadow-xl shadow-indigo-200'
                                : 'bg-slate-100/80 text-slate-900 rounded-bl-sm border border-slate-200'
                            }
                          `}
                        >
                          <h3 className="text-xl font-black mb-3 flex items-center gap-2">
                            {item.title}
                            {isSender && <CheckCheckIcon className="size-4 text-white/60" />}
                          </h3>
                          <p className="text-base font-medium leading-relaxed opacity-90">{item.description}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Chat Input Mock */}
                <div className="mt-12 pt-6 border-t border-slate-100 flex items-center gap-4">
                  <div className="flex-1 rounded-full bg-slate-50 border border-slate-200 px-6 py-4 text-sm font-bold flex items-center text-slate-400">
                    {isZh ? '键入你的猛料...' : 'Type a message...'}
                  </div>
                  <div className="size-12 rounded-full bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-200 transform transition-transform hover:scale-110">
                    <ArrowRightIcon className="size-6 text-white" />
                  </div>
                </div>
              </div>
            </section>
          ) : feature.layoutType === 'breaking-news' ? (
            <section className="space-y-16">
              <style>{`
                @keyframes marquee {
                  0% { transform: translateX(100vw); }
                  100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                  animation: marquee 30s linear infinite;
                }
              `}</style>
              {/* Breaking News Header */}
              <div className="relative border-y-[8px] border-red-600 bg-white/60 backdrop-blur-xl overflow-hidden py-4 shadow-2xl shadow-red-100">
                <div className="absolute inset-y-0 left-0 bg-red-600 px-6 md:px-10 py-4 z-10 font-black tracking-widest text-white uppercase flex items-center gap-4">
                  <div className="size-4 bg-white rounded-full animate-pulse shadow-[0_0_15px_white]" />
                  {isZh ? '突发新闻' : 'BREAKING NEWS'}
                </div>
                <div className="whitespace-nowrap flex pl-[240px] md:pl-[340px]">
                  <p className="animate-marquee text-2xl md:text-3xl font-black text-red-600 uppercase tracking-tight flex items-center">
                    {isZh
                      ? '✦ 欢迎来到地球OL ✦ 这里没有Bug，只有Feature ✦ 所有的荒诞都会被写成说唱 ✦ 准备好见证新闻崩塌 ✦'
                      : '✦ WELCOME TO EARTH ONLINE ✦ NO BUGS JUST FEATURES ✦ TURNING ABSURDITY INTO HEAVY RAP BEATS ✦'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 text-center mt-12 mb-20 px-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2 text-sm font-black tracking-widest uppercase text-red-600 backdrop-blur-md">
                  <RadioIcon className="size-4 animate-pulse" />
                  {isZh ? '全网离谱大赏现场' : 'Live from the Simulation'}
                </div>
                <h2 className="text-6xl font-black tracking-tighter sm:text-7xl lg:text-9xl bg-linear-to-b from-red-500 to-rose-900 bg-clip-text text-transparent">
                  {isZh ? '今日魔幻头条' : 'Glitch in the Matrix'}
                </h2>
                <p className="max-w-2xl text-xl text-slate-500 leading-relaxed font-bold">
                  {isZh
                    ? '把这些荒诞不经、看起来像AI合成的真实新闻，变成最野的Hip-Hop轰炸。'
                    : 'Turn these real, bizarre, AI-sounding news events into the hardest Hip-Hop reports.'}
                </p>
              </div>

              {/* Lower Thirds Grid */}
              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-4">
                {[
                  ...benefits.map((b) => ({ ...b, description: b.desc, type: 'ALERT' })),
                  ...useCases.map((u) => ({ ...u, description: u.desc, type: 'UPDATE' })),
                  ...(feature.trendingExamples?.[langKey] || []).map((t) => ({ ...t, type: 'LIVE' })),
                ].map((item, idx) => (
                  <article
                    key={item.title}
                    className="relative group overflow-hidden bg-white border-2 border-slate-100 flex flex-col justify-end min-h-[400px] rounded-[2.5rem] shadow-xl shadow-slate-200/50 transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-red-100"
                  >
                    {/* Footage Simulation Overlay */}
                    <Image
                      src={feature.imageUrl}
                      alt=""
                      fill
                      className="object-cover opacity-80 mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/20 to-white/95 z-0" />

                    {/* Lower Third Graphic */}
                    <div className="relative z-10 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                      <div className="flex items-end px-4">
                        <div className="bg-red-600 text-white font-black px-4 py-2 text-[15px] tracking-wider uppercase shadow-lg flex items-center gap-2 leading-none">
                          {item.type === 'ALERT' && <AlertTriangleIcon className="size-4" />}
                          {item.type}
                        </div>
                        <div className="bg-slate-900 text-white font-black px-5 py-2 flex-1 truncate text-[15px] shadow-lg uppercase leading-none tracking-widest">
                          {isZh ? '前方回传' : 'FIELD REPORT'}
                        </div>
                      </div>
                      <div className="mx-4 mb-6 bg-white/95 backdrop-blur-md p-6 border-l-[8px] border-red-600 shadow-2xl">
                        <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-base font-bold leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : feature.layoutType === 'cyber-gallery' ? (
            <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-6 py-2 text-sm font-black tracking-widest uppercase text-cyan-600 backdrop-blur-md">
                  <ActivityIcon className="size-4 animate-pulse" />
                  {isZh ? '?????' : 'The Cyber Gallery'}
                </div>
                <h2 className="text-6xl font-black tracking-tighter sm:text-7xl lg:text-9xl bg-linear-to-b from-cyan-400 to-blue-800 bg-clip-text text-transparent drop-shadow-sm">
                  {isZh ? '??????' : 'Peak Brainrot'}
                </h2>
                <p className="max-w-2xl text-xl text-slate-500 leading-relaxed font-bold">
                  {isZh
                    ? '解构 2025-26 最疯狂的网络烂梗、病毒切片与赛博恐慌，将它们铸造为无法罢听的合成器神曲。'
                    : 'Deconstructing the most viral internet memes, copypastas, and cyber panic of 2025-26 into synth-heavy roast anthems.'}
                </p>
              </div>

              {/* Bento Grid Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-360 mx-auto px-4 auto-rows-[minmax(280px,auto)]">
                {[
                  ...benefits.map((b) => ({
                    ...b,
                    description: b.desc,
                    type: 'VIRAL',
                    colSpan: 'md:col-span-2',
                    rowSpan: 'md:row-span-1',
                  })),
                  ...useCases.map((u) => ({
                    ...u,
                    description: u.desc,
                    type: 'TREND',
                    colSpan: 'md:col-span-1',
                    rowSpan: 'md:row-span-2',
                  })),
                  ...(feature.trendingExamples?.[langKey] || []).map((t) => ({
                    ...t,
                    type: 'MEME',
                    colSpan: 'md:col-span-2 lg:col-span-1',
                    rowSpan: 'md:row-span-1',
                  })),
                ].map((item, idx) => (
                  <article
                    key={item.title}
                    className={`group relative overflow-hidden rounded-[3rem] border border-white/80 bg-white/60 backdrop-blur-3xl p-8 shadow-xl shadow-slate-200/40 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-100 transition-all duration-500 flex flex-col justify-between ${item.colSpan} ${item.rowSpan}`}
                  >
                    {/* Glowing background blob on hover */}
                    <div className="absolute -inset-24 bg-linear-to-br from-cyan-500/10 via-blue-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl z-0 pointer-events-none" />

                    <div className="relative z-10 flex justify-between items-start mb-8">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-100 text-xs font-black text-cyan-600 uppercase tracking-widest">
                        {item.type === 'VIRAL' ? <FlameIcon className="size-3" /> : <HashIcon className="size-3" />}
                        {item.type}
                      </span>
                      <span className="text-slate-300 font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        SYS.ERR_{String(idx + 1).padStart(3, '0')}
                      </span>
                    </div>

                    <div className="relative z-10 space-y-5">
                      <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tight group-hover:text-cyan-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 text-lg leading-relaxed font-bold">{item.description}</p>
                    </div>

                    {/* Decorative cyber line */}
                    <div className="absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full bg-linear-to-r from-cyan-500 via-blue-500 to-transparent transition-all duration-700 ease-out z-10" />
                  </article>
                ))}
              </div>
            </section>
          ) : feature.layoutType === 'code-sequencer' ? (
            <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-lg border-2 border-green-500/30 bg-green-50/50 px-6 py-2 text-sm font-black tracking-widest text-green-600 uppercase">
                  <TerminalIcon className="size-4" />
                  {isZh ? '?????...' : 'INIT_SEQUENCE...'}
                </div>
                <h2 className="text-6xl font-black tracking-tighter sm:text-7xl lg:text-9xl bg-linear-to-b from-green-500 to-emerald-900 bg-clip-text text-transparent drop-shadow-sm uppercase">
                  {isZh ? '??????' : 'System Error'}
                </h2>
                <p className="max-w-2xl text-xl text-slate-500 leading-relaxed font-bold">
                  {isZh
                    ? '>> 将日常所有的微小暴击和荒诞 Bug 编译为最炸裂的 Drill / Trap 伴奏。'
                    : '> Compiling everyday glitches and minor annoyances into hard-hitting Drill / Trap beats.'}
                </p>
              </div>

              {/* Code Sequencer Grid */}
              <div className="max-w-7xl mx-auto px-4 grid gap-6 lg:grid-cols-2">
                {[
                  ...benefits.map((b) => ({
                    ...b,
                    description: b.desc,
                    type: 'ERROR_LOG',
                    color: 'text-red-600',
                    border: 'border-red-100',
                    dot: 'bg-red-500',
                  })),
                  ...useCases.map((u) => ({
                    ...u,
                    description: u.desc,
                    type: 'WARNING',
                    color: 'text-amber-600',
                    border: 'border-amber-100',
                    dot: 'bg-amber-500',
                  })),
                  ...(feature.trendingExamples?.[langKey] || []).map((t) => ({
                    ...t,
                    type: 'EXECUTE',
                    color: 'text-green-600',
                    border: 'border-green-100',
                    dot: 'bg-green-500',
                  })),
                ].map((item, idx) => (
                  <article
                    key={item.title}
                    className="group relative overflow-hidden rounded-[2.5rem] bg-white border-2 border-slate-100 p-8 flex flex-col md:flex-row md:items-center gap-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-slate-200"
                  >
                    {/* DAW Strip Simulator */}
                    <div className="hidden md:flex flex-col gap-1.5 items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                      <div
                        className="w-2 h-8 bg-slate-300 group-hover:bg-slate-400 rounded-full animate-pulse"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="w-2 h-12 bg-slate-300 group-hover:bg-slate-400 rounded-full animate-pulse"
                        style={{ animationDelay: '200ms' }}
                      />
                      <div
                        className="w-2 h-16 bg-slate-300 group-hover:bg-green-500 rounded-full animate-pulse"
                        style={{ animationDelay: '400ms' }}
                      />
                      <div
                        className="w-2 h-6 bg-slate-300 group-hover:bg-slate-400 rounded-full animate-pulse"
                        style={{ animationDelay: '100ms' }}
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-black text-xs border ${item.border} bg-slate-50 ${item.color} uppercase tracking-widest`}
                        >
                          <div className={`size-2 rounded-full ${item.dot} animate-pulse`} />
                          [TRK_{String(idx + 1).padStart(2, '0')}] {item.type}
                        </span>
                        <span className="font-mono text-[10px] text-slate-300 uppercase">
                          {isZh ? '缓冲过载' : 'Buffer Overload'}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-green-600 transition-colors">
                        <span className="text-slate-200 select-none mr-2 font-mono">{'>'}</span>
                        {item.title}
                      </h3>
                      <p className="text-slate-500 font-bold text-lg leading-relaxed pl-5 border-l-4 border-slate-100 group-hover:border-green-500 transition-colors">
                        {item.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <>
              {/* Fallback for other template pages */}
              <section className="space-y-8">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">{benefitsHeading}</h2>
                <div className="grid gap-6 lg:grid-cols-3">
                  {benefits.map((benefit) => (
                    <article
                      key={benefit.title}
                      className="rounded-3xl border border-white/60 bg-white/40 p-8 backdrop-blur-xl shadow-xl shadow-slate-200/40"
                    >
                      <div className={`mb-4 inline-flex rounded-full bg-white/60 p-2 shadow-sm ${feature.iconColor}`}>
                        <CheckCircle2 className="size-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{benefit.title}</h3>
                      <p className="mt-4 leading-7 text-slate-600 font-medium">{benefit.desc}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="space-y-8">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">{useCasesHeading}</h2>
                <div className="grid gap-6 lg:grid-cols-3">
                  {useCases.map((useCase) => (
                    <article
                      key={useCase.title}
                      className="rounded-3xl border border-white/60 bg-white/40 p-8 backdrop-blur-xl shadow-xl shadow-slate-200/40 transition-transform hover:scale-[1.02]"
                    >
                      <h3 className="text-xl font-bold text-slate-900">{useCase.title}</h3>
                      <p className="mt-4 leading-7 text-slate-600 font-medium">{useCase.desc}</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {feature.layoutType !== 'case-archive' &&
            feature.trendingExamples?.[langKey] &&
            feature.trendingExamples[langKey].length > 0 && (
              <section className="space-y-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">
                    {isZh ? '🔥 2025-2026 近期高能热梗示范' : '🔥 2025-2026 Trending Scenarios'}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    {isZh
                      ? '来看看全网最近都在用哪些真实离谱事件做说唱：'
                      : 'Check out the most absurd viral cases creators are turning into hits right now:'}
                  </p>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                  {feature.trendingExamples?.[langKey]?.map((example) => (
                    <article
                      key={example.title}
                      className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/40 p-8 transition-all hover:bg-white/60 hover:shadow-xl hover:shadow-pink-100/50 backdrop-blur-xl"
                    >
                      <div className="absolute right-0 top-0 -mr-4 -mt-4 rounded-full bg-pink-500/10 p-12 blur-3xl transition-all group-hover:bg-pink-500/20" />
                      <div className="relative z-10">
                        <span className="mb-4 inline-block rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600">
                          {example.date}
                        </span>
                        <h3 className="text-xl font-black leading-tight text-slate-900 group-hover:text-pink-600 transition-colors">
                          {example.title}
                        </h3>
                        <p className="mt-4 leading-7 text-slate-600 font-medium">{example.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

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
                  : 'These pages cover adjacent content angles so users and search engines can understand how your themes differ.'}
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
              {isZh
                ? '准备好将这个视角转化为 Diss Track 或梗歌了吗？'
                : 'Ready to turn this angle into Meme Song?'}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600 font-bold sm:text-xl">
              {isZh
                ? '将荒诞新闻、八卦和社交混乱转化为更犀利、更易传播的 Diss Track 与恶搞说唱。'
                : 'Turn headlines, drama, and gossip into a sharper, more shareable Meme Song.'}
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="h-14 rounded-full bg-slate-900 px-10 text-base font-bold text-white shadow-2xl shadow-indigo-200 transition-all hover:scale-105 hover:bg-slate-800 sm:h-16 sm:text-lg"
                asChild
              >
                <Link href={`${getUrlWithLocale('/', locale as Locale)}#generator`}>
                  {isZh ? '立即开始创作' : 'Start creating'}
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
