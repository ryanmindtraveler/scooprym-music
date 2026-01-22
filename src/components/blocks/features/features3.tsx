'use client';

import { motion } from 'framer-motion';
import { CpuIcon, FingerprintIcon, PencilIcon, Settings2Icon, SparklesIcon, ZapIcon } from 'lucide-react';

export default function Features3Section() {
  return (
    <section id="features" className="relative px-4 py-32 overflow-hidden bg-indigo-900">
      {/* 1. Background - Matching Hero Fluid Mesh (Lighter/Vibrant Phase) */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-80 animate-gradient-xy"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #22d3ee 100%)',
          }}
        />
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[30px]" />
      </div>

      <div className="mx-auto max-w-7xl space-y-12 lg:space-y-20 relative z-10 text-white">
        <div className="text-center space-y-4">
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block bg-white/20 backdrop-blur-md border border-white/30 px-6 py-2 rounded-full shadow-lg"
          >
            <span className="font-bold uppercase tracking-widest text-sm text-white drop-shadow-sm">
              Why Us?
            </span>
          </motion.div> */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-md"
          >
            Turn Chaos into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">Comedy</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-2xl font-bold max-w-2xl mx-auto drop-shadow-sm"
          >
            News, gossip, and memes—roast them all with AI-generated diss tracks.
          </motion.p>
        </div>

        <div className="relative mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'News Parody',
              desc: 'Political satires & social news. If they say it, you can diss it.',
              icon: ZapIcon,
              color: 'text-yellow-300',
            },
            {
              title: 'Gossip Roast',
              desc: 'The latest tea, served hot. Turn celebrity meltdowns into hit singles.',
              icon: SparklesIcon,
              color: 'text-pink-300',
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
            {
              title: 'Instant Earworm',
              desc: 'Designed for TikTok. Short, catchy, and impossible to get out of your head.',
              icon: Settings2Icon,
              color: 'text-orange-300',
            },
            {
              title: 'Zero Filter',
              desc: 'Pure satire. No rules, just jokes. The ultimate parody machine.',
              icon: PencilIcon,
              color: 'text-purple-300',
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[40px] shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.2)] hover:bg-white/20 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Spotlight Effect Overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(600px circle at var(--mouse-x, 50%) 0%, rgba(255,255,255,0.15), transparent 40%)',
                }}
              />
              {/* Fallback Static Spotlight for simple hover if mouse tracking not enabled */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div
                  className={`p-4 rounded-2xl bg-white/10 backdrop-blur-md shadow-sm group-hover:scale-110 transition-transform duration-300 ${feature.color}`}
                >
                  <feature.icon className="size-8" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tight">{feature.title}</h3>
              </div>
              <p className="text-lg font-medium text-white/90 leading-relaxed relative z-10">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
