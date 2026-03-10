import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { featuresContent } from '@/config/features';
import { constructMetadata } from '@/lib/metadata';
import { getBaseUrl } from '@/lib/urls/urls';
import {
  ArrowRightIcon,
  CheckCircle2,
  CpuIcon,
  FingerprintIcon,
  PencilIcon,
  Settings2Icon,
  SparklesIcon,
  ZapIcon,
  CheckCheckIcon,
  InfoIcon,
  MessageCircleIcon,
  PhoneIcon,
  UserCircle2Icon,
  VideoIcon,
  AlertTriangleIcon,
  RadioIcon,
  HashIcon,
  ActivityIcon,
  FlameIcon,
  TerminalIcon,
  AudioWaveformIcon,
  BinaryIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from 'next-intl';

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
  return Object.keys(featuresContent).map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params, searchParams }: Props
): Promise<Metadata> {
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
    keywords: [...feature.keywords.en, ...feature.keywords.zh],
  });
}

export default async function FeaturePage(
  { params, searchParams }: Props
) {
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
  const baseUrl = getBaseUrl();

  return (
    <div className="flex min-h-screen flex-col bg-indigo-900 text-white">
      <BreadcrumbJsonLd
        items={[
          { name: isZh ? 'Home' : 'Home', item: `${baseUrl}/${locale}` },
          { name: 'Features', item: `${baseUrl}/${locale}/#features` },
          { name: title, item: `${baseUrl}/${locale}/features/${slug}` },
        ]}
      />
      <FaqJsonLd items={faqs} />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 animate-gradient-xy opacity-50"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #db2777 50%, #22d3ee 100%)',
          }}
        />
        <div className="absolute inset-0 bg-indigo-950/70" />
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[80px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10">
          <Link
            href={`/${locale}/#features`}
            className="group inline-flex items-center gap-2 text-sm font-medium text-white/65 transition-colors hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">{'<-'}</span>
            {isZh ? 'Back to feature cards' : 'Back to feature cards'}
          </Link>
        </div>

        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="space-y-6">
            <div className={`inline-flex rounded-3xl bg-white/10 p-5 shadow-2xl backdrop-blur-xl ${feature.iconColor}`}>
              {icon}
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tighter sm:text-6xl xl:text-7xl">{h1}</h1>
            <p className="max-w-3xl bg-linear-to-r from-yellow-300 to-pink-300 bg-clip-text text-xl font-bold leading-relaxed text-transparent sm:text-2xl">
              {heroText}
            </p>
            <p className="max-w-3xl text-lg leading-8 text-white/80 sm:text-xl">{description}</p>

            <div className="flex flex-wrap gap-3">
              {feature.keywords.en.slice(0, 4).map((keyword) => (
                <span key={keyword} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/85">
                  {keyword}
                </span>
              ))}
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="h-14 rounded-full bg-white px-8 text-base font-bold text-indigo-900 shadow-xl transition-all hover:scale-105 hover:bg-white/90 sm:h-16 sm:px-10 sm:text-lg"
                asChild
              >
                <Link href={`/${locale}/#generator`}>{isZh ? 'Start generating' : 'Start generating'}</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl">
              <Image
                src={feature.imageUrl}
                alt={`${title} hero image`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-tr from-indigo-950/55 via-transparent to-transparent" />
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
                {isZh ? 'Target keyword angles' : 'Target keyword angles'}
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {feature.keywords.en.map((keyword) => (
                  <li key={keyword} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/85">
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-16 space-y-16">
          {feature.layoutType !== 'case-archive' && (
            <section className="rounded-[2rem] border border-white/15 bg-white/8 p-8 backdrop-blur-xl sm:p-10">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                {isZh ? 'What this page is really about' : 'What this page is really about'}
              </h2>
              <div className="mt-6 space-y-4 text-base leading-8 text-white/80 sm:text-lg">
                {intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {feature.layoutType === 'case-archive' ? (
            <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-3 rounded-full border border-pink-500/30 bg-pink-500/10 px-6 py-2 text-sm font-black tracking-[0.3em] uppercase text-pink-400 backdrop-blur-md">
                  <SparklesIcon className="size-4 animate-pulse" />
                  {isZh ? '绝密档案库' : 'Classified Files'}
                </div>
                <h2 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl italic bg-linear-to-b from-white via-white to-white/20 bg-clip-text text-transparent">
                  {isZh ? '2025-26 荒诞档案' : '25/26 Absurdity Log'}
                </h2>
                <p className="max-w-2xl text-xl text-white/50 leading-relaxed font-medium">
                  {isZh ? '全球社交媒体深度提取的 9 个真实整活案例，已为您的一键生歌做好“暴击”准备。' : '9 real-world viral anomalies from global feeds, analyzed and ready for your AI rap transformation.'}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  ...benefits.map(b => ({ ...b, description: b.desc })),
                  ...useCases.map(u => ({ ...u, description: u.desc })),
                  ...(feature.trendingExamples?.[langKey] || [])
                ].map((item, idx) => (
                  <article
                    key={item.title}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-10 transition-all duration-500 hover:border-pink-500/30 hover:bg-white/10 hover:shadow-[0_0_50px_-12px_rgba(236,72,153,0.3)]"
                  >
                    {/* Background Index Decor */}
                    <div className="absolute -right-4 -top-8 select-none font-mono text-[10rem] font-black leading-none text-white/5 transition-all duration-500 group-hover:text-pink-500/10 group-hover:-translate-y-2">
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-8 flex items-center justify-between">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500/20 to-purple-500/20 text-pink-400 ring-1 ring-white/10">
                          <ZapIcon className="size-7" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-pink-400/50">
                          LOG_ID: {Math.random().toString(36).substring(7).toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-3xl font-black leading-[1.1] tracking-tight text-white group-hover:text-pink-100 transition-colors">
                        {item.title}
                      </h3>

                      <div className="mt-4 h-1 w-12 rounded-full bg-linear-to-r from-pink-500 to-transparent transition-all duration-500 group-hover:w-24 group-hover:from-pink-400 group-hover:to-pink-600" />

                      <p className="mt-8 text-lg font-medium leading-relaxed text-white/50 grow group-hover:text-white/80 transition-colors italic">
                        "{item.description}"
                      </p>

                      <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Detection Date</span>
                          <span className="text-sm font-bold text-pink-400">2025/26 ANALYSIS</span>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all duration-300 group-hover:rotate-45 group-hover:border-pink-500/50 group-hover:bg-pink-500/10 group-hover:text-pink-400">
                          <ArrowRightIcon className="size-5" />
                        </div>
                      </div>
                    </div>

                    {/* Scanline Effect */}
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-pink-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:animate-scanline group-hover:opacity-100" />
                  </article>
                ))}
              </div>
            </section>
          ) : feature.layoutType === 'hot-billboard' ? (
            <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-6 py-2 text-sm font-black tracking-widest uppercase text-orange-400 backdrop-blur-md">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                  </span>
                  {isZh ? '全球热歌榜' : 'Global Hot Hits'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl italic bg-linear-to-r from-orange-400 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                  {isZh ? '2025-26 爆款风云榜' : '25/26 Billboard Top 9'}
                </h2>
                <p className="max-w-2xl text-xl text-white/60 leading-relaxed font-medium">
                  {isZh ? '收录全球娱乐圈最炸裂的狗血抓马和史诗级冥场面，一键打造成下一首血洗短视频的洗脑神曲。' : 'The most explosive celebrity drama and pop culture chaos, curated and ready to be remixed into your next viral hit.'}
                </p>
              </div>

              <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
                {[
                  ...benefits.map(b => ({ ...b, description: b.desc })),
                  ...useCases.map(u => ({ ...u, description: u.desc })),
                  ...(feature.trendingExamples?.[langKey] || [])
                ].map((item, idx) => (
                  <article
                    key={item.title}
                    className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 transition-all duration-300 hover:border-orange-500/50 hover:bg-white/5 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)]"
                  >
                    {/* Rank Number */}
                    <div className="flex items-center justify-center min-w-[80px]">
                      <span className={`text-6xl font-black italic tracking-tighter ${idx < 3 ? 'bg-linear-to-b from-orange-300 to-rose-600 bg-clip-text text-transparent drop-shadow-lg' : 'text-white/20 group-hover:text-white/40 transition-colors'}`}>
                        {idx + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="grow flex flex-col gap-2">
                       <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-orange-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-base text-white/50 leading-relaxed md:line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Stats / Action Area */}
                    <div className="flex flex-row md:flex-col items-center gap-4 md:min-w-[120px] justify-between w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-t-0">
                      <div className="flex flex-col items-start md:items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Peak Trend</span>
                        <div className="flex items-center gap-1 text-orange-400">
                          <ZapIcon className="size-4 animate-pulse" />
                          <span className="font-mono font-bold">{100 - (idx * 10)}M+</span>
                        </div>
                      </div>

                      <button type="button" className="flex size-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 transition-all hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:scale-110 group-hover:bg-orange-500/20 group-hover:text-orange-400 group-hover:border-orange-500/30">
                        <ArrowRightIcon className="size-5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : feature.layoutType === 'leaked-chat' ? (
            <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-6 py-2 text-sm font-black tracking-widest uppercase text-green-400 backdrop-blur-md">
                  <MessageCircleIcon className="size-4 animate-bounce" />
                  {isZh ? '私密泄露记录' : 'Leaked Chat Logs'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl bg-linear-to-b from-green-400 to-emerald-700 bg-clip-text text-transparent">
                  {isZh ? '全网顶流大翻车' : 'The Tea Room'}
                </h2>
                <p className="max-w-2xl text-xl text-white/60 leading-relaxed font-medium">
                  {isZh ? '为您独家截获2025-26年全球最大牌的公关灾难和互撕大戏，用最锐利的Beat将它们全部串烤。' : 'Intercepted PR disasters, viral apologies, and public feuds—ready to be roasted on a heavy beat.'}
                </p>
              </div>

              <div className="mx-auto w-full max-w-4xl rounded-[2.5rem] border border-white/10 bg-black/60 p-4 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
                   <div className="flex items-center gap-4">
                     <div className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-green-400 to-emerald-600">
                        <UserCircle2Icon className="size-8 text-black/50" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-lg font-bold text-white">Anonymous Leaker</span>
                        <span className="text-xs text-green-400 animate-pulse">Online</span>
                     </div>
                   </div>
                   <div className="hidden sm:flex items-center gap-2 text-white/30">
                     <div className="p-2 rounded-full hover:bg-white/10 transition-colors"><PhoneIcon className="size-5" /></div>
                     <div className="p-2 rounded-full hover:bg-white/10 transition-colors"><VideoIcon className="size-5" /></div>
                     <div className="p-2 rounded-full hover:bg-white/10 transition-colors"><InfoIcon className="size-5" /></div>
                   </div>
                </div>

                {/* Chat Messages */}
                <div className="flex flex-col gap-6">
                  {[
                    ...benefits.map(b => ({ ...b, description: b.desc })),
                    ...useCases.map(u => ({ ...u, description: u.desc })),
                    ...(feature.trendingExamples?.[langKey] || [])
                  ].map((item, idx) => {
                    const isSender = idx % 2 === 0;
                    return (
                      <article
                        key={item.title}
                        className={`flex flex-col w-full max-w-[85%] ${isSender ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <span className="text-xs text-white/30 mb-1 px-2 font-mono">
                          {isZh ? '今天' : 'Today'} {10 + (idx % 12)}:{String(15 + idx * 7).padStart(2, '0')} {isSender ? 'AM' : 'PM'}
                        </span>
                        <div
                          className={`relative rounded-3xl p-5 text-left transition-transform hover:scale-[1.02] cursor-default
                            ${isSender
                              ? 'bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-blue-500/20'
                              : 'bg-zinc-800 text-white rounded-bl-sm border border-white/5 shadow-lg'
                            }
                          `}
                        >
                           <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
                             {item.title}
                             {isSender && <CheckCheckIcon className="size-4 text-blue-200" />}
                           </h3>
                           <p className="text-sm md:text-base leading-relaxed opacity-90">
                             {item.description}
                           </p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Chat Input Mock */}
                <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-3 opacity-50">
                  <div className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-3 text-sm flex items-center text-white/40">
                    {isZh ? '键入你的猛料...' : 'Type a message...'}
                  </div>
                  <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <ArrowRightIcon className="size-5 text-white" />
                  </div>
                </div>
              </div>
            </section>
          ) : feature.layoutType === 'breaking-news' ? (
            <section className="space-y-12">
              <style>{`
                @keyframes marquee {
                  0% { transform: translateX(100vw); }
                  100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                  animation: marquee 20s linear infinite;
                }
              `}</style>
              {/* Breaking News Header */}
              <div className="relative border-y-[6px] border-red-600 bg-red-700/20 backdrop-blur-md overflow-hidden py-3 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <div className="absolute inset-y-0 left-0 bg-red-600 px-4 md:px-8 py-3 z-10 font-black tracking-widest text-white uppercase flex items-center gap-3 italic">
                  <div className="size-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                  {isZh ? '突发新闻' : 'BREAKING NEWS'}
                </div>
                <div className="whitespace-nowrap flex pl-[200px] md:pl-[300px]">
                  <p className="animate-marquee text-xl md:text-2xl font-black text-white/90 uppercase tracking-wide flex items-center">
                    {isZh
                      ? '✦ 欢迎来到地球OL ✦ 这里没有Bug，只有Feature ✦ 所有的荒诞都会被写成说唱 ✦ 准备好见证新闻崩塌 ✦'
                      : '✦ WELCOME TO EARTH ONLINE ✦ NO BUGS JUST FEATURES ✦ TURNING ABSURDITY INTO HEAVY RAP BEATS ✦'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 text-center mt-12 mb-16 px-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2 text-sm font-black tracking-widest uppercase text-red-400 backdrop-blur-md">
                  <RadioIcon className="size-4 animate-pulse" />
                  {isZh ? '全网离谱大赏现场' : 'Live from the Simulation'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl bg-linear-to-b from-red-400 to-rose-700 bg-clip-text text-transparent drop-shadow-md">
                  {isZh ? '今日魔幻头条' : 'Glitch in the Matrix'}
                </h2>
                <p className="max-w-2xl text-xl text-white/60 leading-relaxed font-medium">
                  {isZh ? '把这些荒诞不经、看起来像AI合成的真实新闻，变成最野的Hip-Hop轰炸。' : 'Turn these real, bizarre, AI-sounding news events into the hardest Hip-Hop reports.'}
                </p>
              </div>

              {/* Lower Thirds Grid */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-4">
                 {[
                    ...benefits.map(b => ({ ...b, description: b.desc, type: 'ALERT' })),
                    ...useCases.map(u => ({ ...u, description: u.desc, type: 'UPDATE' })),
                    ...(feature.trendingExamples?.[langKey] || []).map(t => ({ ...t, type: 'LIVE' }))
                  ].map((item, idx) => (
                    <article key={item.title} className="relative group overflow-hidden bg-zinc-900 border border-white/10 flex flex-col justify-end min-h-[320px] rounded-lg">
                      <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/80 z-0" />

                      {/* Placeholder background simulation for a "news footage" feeling */}
                      <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

                      {/* Lower Third Graphic */}
                      <div className="relative z-10 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                        <div className="flex items-end px-4">
                           <div className="bg-red-600 text-white font-black px-3 py-1 text-sm md:text-[15px] tracking-wider uppercase shadow-md flex items-center gap-1 leading-none">
                             {item.type === 'ALERT' && <AlertTriangleIcon className="size-4" />}
                             {item.type}
                           </div>
                           <div className="bg-white text-black font-bold px-4 py-1 flex-1 truncate text-sm md:text-[15px] shadow-md uppercase leading-none">
                             {isZh ? '前方回传' : 'FIELD REPORT'}
                           </div>
                        </div>
                        <div className="mx-4 mb-4 bg-[#0a1e3f]/95 backdrop-blur-md p-4 md:p-5 border-l-[6px] border-[#fbbf24] shadow-xl">
                          <h3 className="text-lg md:text-xl font-black text-white mb-2 leading-tight drop-shadow-md">
                            {item.title}
                          </h3>
                          <p className="text-yellow-100/90 text-sm md:text-base font-medium leading-snug line-clamp-3">
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
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-6 py-2 text-sm font-black tracking-widest uppercase text-cyan-400 backdrop-blur-md">
                  <ActivityIcon className="size-4 animate-pulse" />
                  {isZh ? '赛博精神档案展' : 'The Cyber Gallery'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl bg-linear-to-b from-cyan-300 to-blue-700 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                  {isZh ? '全网顶级迷因' : 'Peak Brainrot'}
                </h2>
                <p className="max-w-2xl text-xl text-white/60 leading-relaxed font-medium">
                  {isZh ? '解构 2025-26 最疯狂的网络烂梗、病毒切片与赛博恐慌，将它们铸造为无法罢听的合成器说唱。' : 'Deconstructing the most viral internet memes, copypastas, and cyber panic of 2025-26 into synth-heavy rap anthems.'}
                </p>
              </div>

              {/* Bento Grid Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-360 mx-auto px-4 auto-rows-[minmax(250px,auto)]">
                {[
                  ...benefits.map(b => ({ ...b, description: b.desc, type: 'VIRAL', colSpan: 'md:col-span-2', rowSpan: 'md:row-span-1' })),
                  ...useCases.map(u => ({ ...u, description: u.desc, type: 'TREND', colSpan: 'md:col-span-1', rowSpan: 'md:row-span-2' })),
                  ...(feature.trendingExamples?.[langKey] || []).map(t => ({ ...t, type: 'MEME', colSpan: 'md:col-span-2 lg:col-span-1', rowSpan: 'md:row-span-1' }))
                ].map((item, idx) => (
                  <article
                    key={item.title}
                    className={`group relative overflow-hidden rounded-4xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl p-6 md:p-8 hover:border-cyan-500/30 transition-all duration-500 flex flex-col justify-between ${item.colSpan} ${item.rowSpan}`}
                  >
                    {/* Glowing background blob on hover */}
                    <div className="absolute -inset-24 bg-linear-to-br from-cyan-500/20 via-blue-500/0 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl z-0 pointer-events-none" />

                    {/* Grid Pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="relative z-10 flex justify-between items-start mb-6">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/20 text-xs font-mono text-cyan-400">
                         {item.type === 'VIRAL' ? <FlameIcon className="size-3" /> : <HashIcon className="size-3" />}
                         {item.type}
                       </span>
                       <span className="text-white/20 font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                         SYS.ERR_{String(idx + 1).padStart(3, '0')}
                       </span>
                    </div>

                    <div className="relative z-10 space-y-4">
                      <h3 className="text-2xl md:text-3xl font-black text-white/90 leading-tight tracking-tight group-hover:text-cyan-50 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-white/50 text-base md:text-lg leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>

                    {/* Decorative cyber line */}
                    <div className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-linear-to-r from-cyan-500 via-blue-500 to-transparent transition-all duration-700 ease-out z-10" />
                  </article>
                ))}
              </div>
            </section>
          ) : feature.layoutType === 'code-sequencer' ? (
             <section className="space-y-16">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 rounded border border-green-500/50 bg-green-500/10 px-6 py-2 text-sm font-mono tracking-widest text-green-400">
                  <TerminalIcon className="size-4" />
                  {isZh ? '初始化序列...' : 'INIT_SEQUENCE...'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl bg-linear-to-b from-green-400 to-emerald-800 bg-clip-text text-transparent font-mono drop-shadow-[0_0_15px_rgba(74,222,128,0.4)] uppercase">
                  {isZh ? '系统故障说唱' : 'System Error'}
                </h2>
                <p className="max-w-2xl text-xl text-green-500/60 leading-relaxed font-mono">
                  {isZh ? '>> 将日常所有的微小暴击和荒诞 Bug 编译为最炸裂的 Drill / Trap 伴奏。' : '> Compiling everyday glitches and minor annoyances into hard-hitting Drill / Trap beats.'}
                </p>
              </div>

              {/* Code Sequencer Grid */}
              <div className="max-w-7xl mx-auto px-4 grid gap-4 lg:grid-cols-2">
                {[
                  ...benefits.map(b => ({ ...b, description: b.desc, type: 'ERROR_LOG', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-950/20' })),
                  ...useCases.map(u => ({ ...u, description: u.desc, type: 'WARNING', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-950/20' })),
                  ...(feature.trendingExamples?.[langKey] || []).map(t => ({ ...t, type: 'EXECUTE', color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-950/20' }))
                ].map((item, idx) => (
                  <article
                    key={item.title}
                    className={`group relative overflow-hidden rounded bg-black border ${item.border} p-6 flex flex-col md:flex-row md:items-center gap-6 transition-all hover:bg-zinc-900 focus-within:ring-2 focus-within:ring-green-500`}
                  >
                     {/* DAW Strip Simulator */}
                     <div className="hidden md:flex flex-col gap-1 items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <div className="w-1.5 h-6 bg-zinc-700 group-hover:bg-zinc-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-8 bg-zinc-700 group-hover:bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                        <div className="w-1.5 h-12 bg-zinc-600 group-hover:bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                        <div className="w-1.5 h-5 bg-zinc-700 group-hover:bg-zinc-500 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                     </div>

                     <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] md:text-xs border ${item.border} ${item.bg} ${item.color} uppercase`}>
                             {item.type === 'EXECUTE' ? <BinaryIcon className="size-3" /> : <AudioWaveformIcon className="size-3" />}
                             [TRK_{String(idx + 1).padStart(2, '0')}] {item.type}
                           </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white font-mono tracking-tight group-hover:text-green-400 transition-colors">
                          <span className="text-zinc-600 select-none mr-2">{'>'}</span>{item.title}
                        </h3>
                        <p className="text-zinc-400 font-mono text-sm md:text-base leading-relaxed pl-4 border-l-2 border-zinc-800 group-hover:border-zinc-600 transition-colors">
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
                <h2 className="text-3xl font-black italic tracking-tight sm:text-4xl">{benefitsHeading}</h2>
                <div className="grid gap-6 lg:grid-cols-3">
                  {benefits.map((benefit) => (
                    <article key={benefit.title} className="rounded-3xl border border-white/10 bg-white/8 p-8 backdrop-blur-md">
                      <div className={`mb-4 inline-flex rounded-full bg-white/10 p-2 ${feature.iconColor}`}>
                        <CheckCircle2 className="size-6" />
                      </div>
                      <h3 className="text-xl font-bold">{benefit.title}</h3>
                      <p className="mt-4 leading-7 text-white/75">{benefit.desc}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="space-y-8">
                <h2 className="text-3xl font-black italic tracking-tight sm:text-4xl">{useCasesHeading}</h2>
                <div className="grid gap-6 lg:grid-cols-3">
                  {useCases.map((useCase) => (
                    <article
                      key={useCase.title}
                      className="rounded-3xl border border-white/10 bg-linear-to-b from-white/12 to-transparent p-8 backdrop-blur-md"
                    >
                      <h3 className="text-xl font-bold">{useCase.title}</h3>
                      <p className="mt-4 leading-7 text-white/75">{useCase.desc}</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {feature.layoutType !== 'case-archive' && feature.trendingExamples?.[langKey] && feature.trendingExamples[langKey].length > 0 && (
            <section className="space-y-8">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black italic tracking-tight sm:text-4xl">
                  {isZh ? '🔥 2025-2026 近期高能热梗示范' : '🔥 2025-2026 Trending Scenarios'}
                </h2>
                <p className="text-white/70">
                  {isZh
                    ? '来看看全网最近都在用哪些真实离谱事件做说唱：'
                    : 'Check out the most absurd viral cases creators are turning into hits right now:'}
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {feature.trendingExamples[langKey].map((example) => (
                  <article
                    key={example.title}
                    className="group relative overflow-hidden rounded-4xl border border-white/10 bg-black/40 p-8 transition-colors hover:bg-white/5"
                  >
                    <div className="absolute right-0 top-0 -mr-4 -mt-4 rounded-full bg-pink-500/20 p-8 blur-2xl transition-all group-hover:bg-pink-500/40" />
                    <div className="relative z-10">
                      <span className="mb-4 inline-block rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-bold text-pink-300">
                        {example.date}
                      </span>
                      <h3 className="text-xl font-bold leading-tight">{example.title}</h3>
                      <p className="mt-4 leading-7 text-white/70">{example.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-8">
            <h2 className="text-3xl font-black italic tracking-tight sm:text-4xl">{faqHeading}</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {faqs.map((faq) => (
                <article key={faq.question} className="rounded-3xl border border-white/10 bg-white/8 p-8 backdrop-blur-md">
                  <h3 className="text-lg font-bold">{faq.question}</h3>
                  <p className="mt-4 leading-7 text-white/75">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                {isZh ? 'Explore related feature pages' : 'Explore related feature pages'}
              </h2>
              <p className="mt-3 max-w-2xl text-white/75">
                {isZh
                  ? 'These pages cover adjacent content angles so users and search engines can understand how your themes differ.'
                  : 'These pages cover adjacent content angles so users and search engines can understand how your themes differ.'}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPages.map((related) => (
                <Link
                  key={related.slug}
                  href={`/${locale}/features/${related.slug}`}
                  className="group rounded-3xl border border-white/10 bg-white/8 p-6 backdrop-blur-md transition hover:bg-white/12"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold">{related.title[langKey]}</h3>
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-4 leading-7 text-white/75">{related.description[langKey]}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-white/20 bg-white/10 p-10 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] backdrop-blur-2xl sm:p-16">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              {isZh ? 'Ready to turn this angle into roast and parody rap?' : 'Ready to turn this angle into roast and parody rap?'}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
              {isZh
                ? 'Turn absurd news, gossip, and social chaos into sharper, more shareable roast and parody rap.'
                : 'Turn absurd news, gossip, and social chaos into sharper, more shareable roast and parody rap.'}
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="h-14 rounded-full bg-linear-to-r from-yellow-400 to-pink-500 px-10 text-base font-bold text-white shadow-xl transition-transform hover:scale-105 sm:h-16 sm:text-lg"
                asChild
              >
                <Link href={`/${locale}/#generator`}>{isZh ? 'Start creating' : 'Start creating'}</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
