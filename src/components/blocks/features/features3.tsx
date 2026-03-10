'use client';

import { LocaleLink } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  CpuIcon,
  FingerprintIcon,
  PencilIcon,
  Settings2Icon,
  SparklesIcon,
  ZapIcon,
} from 'lucide-react';
import { useLocale } from 'next-intl';

type FeatureCard = {
  title: string;
  desc: string;
  icon: typeof ZapIcon;
  color: string;
  slug: string;
};

export default function Features3Section() {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');

  const heroCopy = {
    title: (
      <>
        Turn Chaos into
        <span className="bg-linear-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent"> comedy</span>
      </>
    ),
    description: 'Headlines, gossip, and memes all turn into AI-generated viral rap songs.',
  };

  const features: FeatureCard[] = [
    {
      title: 'Absurd Social Phenomena',
      desc: 'Bizarre public behavior and weird social stories turned into sharper rap commentary.',
      icon: PencilIcon,
      color: 'text-purple-300',
      slug: 'absurd-social-phenomena',
    },
    {
      title: 'Entertainment Topics',
      desc: 'Celebrity news, entertainment stories, and pop culture moments remixed into rap songs.',
      icon: Settings2Icon,
      color: 'text-orange-300',
      slug: 'entertainment-topics',
    },
    {
      title: 'Gossip Roast',
      desc: 'The latest tea, served hot. Turn celebrity meltdowns into hit singles.',
      icon: SparklesIcon,
      color: 'text-pink-300',
      slug: 'gossip-roast',
    },
    {
      title: 'News Parody',
      desc: 'Political satires and social news. If they say it, you can diss it.',
      icon: ZapIcon,
      color: 'text-yellow-300',
      slug: 'news-parody',
    },
    {
      title: 'Meme Culture',
      desc: 'Weird trends and viral fails. Roast them before they go cold.',
      icon: FingerprintIcon,
      color: 'text-cyan-300',
      slug: 'meme-culture',
    },
    {
      title: 'Comedy Drill',
      desc: 'Hard beats, funny lyrics. Trap, Drill, and Glitch Rap tailored for laughs.',
      icon: CpuIcon,
      color: 'text-green-300',
      slug: 'comedy-drill',
    },
  ];

  return (
    <section id="features" className="relative overflow-hidden bg-indigo-900 px-4 py-20 md:py-32">
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
            className="text-4xl font-black tracking-tighter drop-shadow-md sm:text-5xl md:text-7xl"
          >
            {heroCopy.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg font-bold drop-shadow-sm sm:text-xl md:text-2xl"
          >
            {heroCopy.description}
          </motion.p>
        </div>

        <div className="relative mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ y: -8 }}
              className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.2)] md:p-8"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(600px circle at var(--mouse-x, 50%) 0%, rgba(255,255,255,0.15), transparent 40%)',
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative z-10 mb-6 flex min-h-[72px] items-start gap-4">
                <div
                  className={`rounded-2xl bg-white/10 p-3 shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110 md:p-4 ${feature.color}`}
                >
                  <feature.icon className="size-7 md:size-8" />
                </div>
                <h3 className="line-clamp-2 text-xl font-black italic tracking-tight md:text-2xl">{feature.title}</h3>
              </div>

              <p className="relative z-10 flex-1 text-base font-medium leading-relaxed text-white/90 md:text-lg">
                {feature.desc}
              </p>

              <div className="relative z-10 mt-8 border-t border-white/10 pt-4">
                <LocaleLink
                  href={`/features/${feature.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group/link inline-flex items-center gap-2 text-sm font-bold transition-all hover:gap-3 ${feature.color}`}
                >
                  {isZh ? 'View details' : 'Explore feature'}
                  <ArrowRightIcon className="size-4 transition-transform group-hover/link:translate-x-1" />
                </LocaleLink>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
