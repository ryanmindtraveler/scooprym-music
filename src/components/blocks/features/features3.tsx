'use client';

import { motion } from 'framer-motion';
import { CpuIcon, FingerprintIcon, PencilIcon, Settings2Icon, SparklesIcon, ZapIcon } from 'lucide-react';
import { useLocale } from 'next-intl';

type FeatureCard = {
  title: string;
  desc: string;
  icon: typeof ZapIcon;
  color: string;
};

export default function Features3Section() {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');

  const heroCopy = isZh
    ? {
        title: (
          <>
            把混乱热点变成<span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">说唱神曲</span>
          </>
        ),
        description: '头条、八卦和热梗，都可以被 AI 改编成更抓耳、更好笑、更适合传播的说唱作品。',
      }
    : {
        title: (
          <>
            Turn Chaos into{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">Comedy</span>
          </>
        ),
        description: 'Headlines, gossip, and memes all turn into AI-generated viral rap songs.',
      };

  const features: FeatureCard[] = isZh
    ? [
        {
          title: '荒诞社会现象',
          desc: '离谱社会新闻、迷惑行为和怪现实事件，最适合做成带观察感的说唱吐槽。',
          icon: PencilIcon,
          color: 'text-purple-300',
        },
        {
          title: '娱乐话题',
          desc: '明星新闻、娱乐大瓜和流行文化热点，统统都能变成更有戏的 Rap 内容。',
          icon: Settings2Icon,
          color: 'text-orange-300',
        },
        {
          title: '八卦吐槽',
          desc: '最新的瓜、最热的料，统统都能被做成洗脑神曲。',
          icon: SparklesIcon,
          color: 'text-pink-300',
        },
        {
          title: '新闻整活',
          desc: '政治吐槽、社会新闻、离谱头条，统统都能变成说唱段子。',
          icon: ZapIcon,
          color: 'text-yellow-300',
        },
        {
          title: '梗图文化',
          desc: '迷惑热点、抽象行为、网络热梗，趁热做成 Rap。',
          icon: FingerprintIcon,
          color: 'text-cyan-300',
        },
        {
          title: '搞笑 Drill',
          desc: '硬节奏配搞笑歌词，Trap、Drill、Glitch Rap 都能拿来整活。',
          icon: CpuIcon,
          color: 'text-green-300',
        },
      ]
    : [
        {
          title: 'Absurd Social Phenomena',
          desc: 'Bizarre public behavior and weird social stories turned into sharper rap commentary.',
          icon: PencilIcon,
          color: 'text-purple-300',
        },
        {
          title: 'Entertainment Topics',
          desc: 'Celebrity news, entertainment stories, and pop culture moments remixed into rap songs.',
          icon: Settings2Icon,
          color: 'text-orange-300',
        },
        {
          title: 'Gossip Roast',
          desc: 'The latest tea, served hot. Turn celebrity meltdowns into hit singles.',
          icon: SparklesIcon,
          color: 'text-pink-300',
        },
        {
          title: 'News Parody',
          desc: 'Political satires and social news. If they say it, you can diss it.',
          icon: ZapIcon,
          color: 'text-yellow-300',
        },
        {
          title: 'Meme Culture',
          desc: 'Weird trends and viral fails? Roast them before they go cold.',
          icon: FingerprintIcon,
          color: 'text-cyan-300',
        },
        {
          title: 'Comedy Drill',
          desc: 'Hard beats, funny lyrics. Trap, Drill, and Glitch Rap tailored for laughs.',
          icon: CpuIcon,
          color: 'text-green-300',
        },
      ];

  return (
    <section id="features" className="relative overflow-hidden bg-indigo-900 px-4 py-32">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 animate-gradient-xy opacity-80"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #22d3ee 100%)',
          }}
        />
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[30px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-12 text-white lg:space-y-20">
        <div className="space-y-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black tracking-tighter drop-shadow-md md:text-7xl"
          >
            {heroCopy.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-2xl font-bold drop-shadow-sm"
          >
            {heroCopy.description}
          </motion.p>
        </div>

        <div className="relative mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ y: -10 }}
              className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-[40px] border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.2)]"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(600px circle at var(--mouse-x, 50%) 0%, rgba(255,255,255,0.15), transparent 40%)',
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative z-10 mb-6 flex min-h-[72px] items-start gap-4">
                <div
                  className={`rounded-2xl bg-white/10 p-4 shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110 ${feature.color}`}
                >
                  <feature.icon className="size-8" />
                </div>
                <h3 className="line-clamp-2 text-2xl font-black italic tracking-tight">{feature.title}</h3>
              </div>

              <p className="relative z-10 flex-1 text-lg font-medium leading-relaxed text-white/90">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
