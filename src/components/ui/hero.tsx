'use client';

import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';
import React from 'react';
import { ConstantVelocityMarquee } from './constant-marquee';
import { GhostIcon } from './ghost-icon';

interface HeroSectionProps extends Omit<HTMLMotionProps<'section'>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  semanticTitle?: string;
  extraContent?: React.ReactNode;
  actions?: React.ReactNode;
  bottomMarquee?: string;
  showMarquees?: boolean;
  callToAction?: {
    text: string;
    href: string;
  };
}

const waveformHeights = [32, 76, 48, 96, 58, 112, 44, 88, 64, 104, 52, 82, 38, 72, 56, 100, 42, 84];

const HeroUI = React.forwardRef<HTMLElement, HeroSectionProps>(
  (
    {
      className,
      title,
      subtitle,
      semanticTitle,
      extraContent,
      actions,
      bottomMarquee,
      showMarquees = true,
      callToAction,
      ...props
    },
    ref
  ) => {
    const constraintsRef = React.useRef<HTMLElement>(null);
    const prefersReducedMotion = useReducedMotion();
    React.useImperativeHandle(ref, () => constraintsRef.current!);

    // 主分支的视觉语法：音乐器材、围观反应与互联网混乱感形成三层动态空间。
    const heroItems = [
      { id: 'mic', emoji: '🎙️', x: '35%', y: '42%', size: 'text-4xl md:text-7xl', rotate: -15, delay: 0, blur: 'blur-none', opacity: 1 },
      { id: 'headphones', emoji: '🎧', x: '65%', y: '42%', size: 'text-4xl md:text-7xl', rotate: 15, delay: 0.3, blur: 'blur-none', opacity: 1 },
      { id: 'piano', emoji: '🎹', x: '40%', y: '58%', size: 'text-4xl md:text-7xl', rotate: -10, delay: 1, blur: 'blur-none', opacity: 1 },
      { id: 'mixer', emoji: '🎚️', x: '60%', y: '58%', size: 'text-4xl md:text-7xl', rotate: 10, delay: 1.5, blur: 'blur-none', opacity: 1 },
      { id: 'cd', emoji: '💿', x: '32%', y: '50%', size: 'text-3xl md:text-6xl', rotate: 45, delay: 2.2, blur: 'blur-none', opacity: 1 },
      { id: 'speaker', emoji: '📢', x: '68%', y: '50%', size: 'text-3xl md:text-6xl', rotate: -20, delay: 1.8, blur: 'blur-none', opacity: 1 },
      { id: 'robot', emoji: '🤖', x: '48%', y: '35%', size: 'text-3xl md:text-6xl', rotate: -10, delay: 4.6, blur: 'blur-none', opacity: 1 },
      { id: 'box', emoji: '📦', x: '52%', y: '65%', size: 'text-3xl md:text-6xl', rotate: 10, delay: 4.9, blur: 'blur-none', opacity: 1 },
      { id: 'clown', emoji: '🤡', x: '20%', y: '30%', size: 'text-5xl md:text-8xl', rotate: 0, delay: 1.4, blur: 'blur-none', opacity: 1 },
      { id: 'tea', emoji: '🍵', x: '80%', y: '30%', size: 'text-5xl md:text-8xl', rotate: 10, delay: 1.7, blur: 'blur-none', opacity: 1 },
      { id: 'popcorn', emoji: '🍿', x: '15%', y: '50%', size: 'text-4xl md:text-8xl', rotate: -20, delay: 2, blur: 'blur-none', opacity: 1 },
      { id: 'eyes', emoji: '👀', x: '50%', y: '18%', size: 'text-4xl md:text-7xl', rotate: -10, delay: 3, blur: 'blur-none', opacity: 1 },
      { id: 'bird', emoji: '🐦', x: '25%', y: '70%', size: 'text-4xl md:text-8xl', rotate: -5, delay: 2.8, blur: 'blur-none', opacity: 1 },
      { id: 'shush', emoji: '🤫', x: '75%', y: '70%', size: 'text-4xl md:text-8xl', rotate: 10, delay: 3.2, blur: 'blur-none', opacity: 1 },
      { id: 'cap', emoji: '🧢', x: '85%', y: '50%', size: 'text-4xl md:text-7xl', rotate: 15, delay: 3.5, blur: 'blur-none', opacity: 1 },
      { id: 'camera', emoji: '📸', x: '30%', y: '80%', size: 'text-4xl md:text-8xl', rotate: 10, delay: 3.8, blur: 'blur-none', opacity: 1 },
      { id: 'spy', emoji: '🕵️', x: '70%', y: '80%', size: 'text-4xl md:text-8xl', rotate: -15, delay: 4, blur: 'blur-none', opacity: 1 },
      { id: 'nail', emoji: '💅', x: '10%', y: '40%', size: 'text-4xl md:text-7xl', rotate: 20, delay: 4.2, blur: 'blur-none', opacity: 1 },
      { id: 'snake', emoji: '🐍', x: '90%', y: '40%', size: 'text-4xl md:text-7xl', rotate: 25, delay: 4.5, blur: 'blur-none', opacity: 1 },
      { id: 'mask', emoji: '🎭', x: '80%', y: '60%', size: 'text-4xl md:text-7xl', rotate: 15, delay: 4.3, blur: 'blur-none', opacity: 1 },
      { id: 'rocket', emoji: '🚀', x: '5%', y: '5%', size: 'text-5xl md:text-9xl', rotate: -45, delay: 0.2, blur: 'blur-none', opacity: 1 },
      { id: 'money', emoji: '💸', x: '5%', y: '90%', size: 'text-5xl md:text-9xl', rotate: 25, delay: 0.5, blur: 'blur-none', opacity: 1 },
      { id: 'alien', emoji: '👽', x: '95%', y: '5%', size: 'text-6xl md:text-[10rem]', rotate: 20, delay: 0.6, blur: 'blur-none', opacity: 1 },
      { id: 'bolt', emoji: '⚡', x: '50%', y: '95%', size: 'text-6xl md:text-[10rem]', rotate: 0, delay: 1.2, blur: 'blur-none', opacity: 1 },
      { id: 'fire', emoji: '🔥', x: '30%', y: '95%', size: 'text-4xl md:text-8xl', rotate: -15, delay: 0.8, blur: 'blur-none', opacity: 1 },
      { id: 'bomb', emoji: '💣', x: '95%', y: '50%', size: 'text-4xl md:text-8xl', rotate: 15, delay: 1.1, blur: 'blur-none', opacity: 1 },
      { id: 'mindblown', emoji: '🤯', x: '5%', y: '50%', size: 'text-4xl md:text-8xl', rotate: 0, delay: 2.5, blur: 'blur-none', opacity: 1 },
      { id: 'skull', emoji: '💀', x: '50%', y: '5%', size: 'text-4xl md:text-7xl', rotate: 180, delay: 4.1, blur: 'blur-none', opacity: 1 },
      { id: 'invader', emoji: '👾', x: '90%', y: '90%', size: 'text-4xl md:text-8xl', rotate: -10, delay: 4.8, blur: 'blur-none', opacity: 1 },
    ];

    return (
      <motion.section
        ref={constraintsRef}
        className={cn('relative flex min-h-[90dvh] w-full items-center justify-center overflow-hidden py-28 md:py-32', className)}
        {...props}
      >
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-color-burn"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="absolute inset-0" style={{ filter: 'blur(80px)' }}>
            <motion.div
              className="absolute -left-[28%] -top-[10%] size-[65vw] rounded-full mix-blend-multiply opacity-60"
              style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)', height: '120vw' }}
              animate={prefersReducedMotion ? undefined : { scale: [1, 1.05, 1] }}
              transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
            <motion.div
              className="absolute -right-[28%] -top-[10%] size-[65vw] rounded-full mix-blend-multiply opacity-60"
              style={{ background: 'linear-gradient(225deg, #f472b6 0%, #c084fc 100%)', height: '120vw' }}
              animate={prefersReducedMotion ? undefined : { scale: [1, 1.05, 1] }}
              transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
            <motion.div
              className="absolute -top-[10%] left-[20%] size-[60vw] rounded-full mix-blend-multiply opacity-80"
              style={{
                height: '120vw',
                background: 'radial-gradient(circle, rgba(192,132,252,0.6) 0%, rgba(244,114,182,0.5) 40%, transparent 70%)',
              }}
              animate={prefersReducedMotion ? undefined : { scale: [0.95, 1.05, 0.95], opacity: [0.6, 0.8, 0.6] }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {heroItems.map((item) => (
          <GhostIcon key={item.id} {...item} constraintsRef={constraintsRef} reduceMotion={Boolean(prefersReducedMotion)} />
        ))}

        <div className="relative z-20 mx-auto mt-16 flex max-w-7xl flex-col items-center px-4 text-center md:mt-20">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1.2, type: 'spring', bounce: 0.2 }}
            className="relative mb-8 flex flex-col items-center"
          >
            <div className="relative z-10 inline-block px-4 py-4 sm:px-12">
              <h1 className="sr-only">{semanticTitle ?? 'ScoopRYM'}</h1>
              <motion.div
                className="relative z-20 mx-auto pr-[0.14em] font-sans text-6xl font-black italic leading-[0.96] tracking-[-0.07em] sm:text-7xl md:text-[clamp(5rem,5.55vw,7.25rem)]"
                style={{
                  backgroundImage: 'linear-gradient(to right, #22d3ee, #e879f9, #facc15, #22d3ee)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                }}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        backgroundPosition: ['0% center', '-200% center'],
                        filter: [
                          'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                          'drop-shadow(0 4px 20px rgba(255,255,255,0.3))',
                          'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                        ],
                      }
                }
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
              >
                {title ?? 'ScoopRYM'}
              </motion.div>

              <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex h-24 -translate-x-1/2 items-end gap-2 mix-blend-overlay opacity-50">
                {waveformHeights.map((height, index) => (
                  <motion.div
                    key={height}
                    className="w-3 rounded-t-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)] sm:w-4"
                    animate={prefersReducedMotion ? undefined : { height: [20, height, 20] }}
                    transition={{ duration: 0.65 + (index % 4) * 0.1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </div>

            {subtitle && (
              <motion.h2
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.5, duration: 0.8 }}
                className="mx-auto mt-8 flex max-w-4xl flex-col items-center rounded-[1.75rem] border border-white/60 bg-[#fffdf8]/30 px-6 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.52),0_12px_30px_rgba(74,49,89,0.12)] ring-1 ring-white/25 backdrop-blur-xl sm:rounded-full sm:px-9 md:px-12 md:py-5"
              >
                {subtitle}
              </motion.h2>
            )}

            {extraContent && (
              <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.65, duration: 0.7 }}
                className="mx-auto mt-8 inline-block max-w-4xl rounded-full border border-white/40 bg-white/60 px-6 py-4 text-center text-base font-semibold leading-relaxed tracking-[-0.015em] text-slate-700 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-white/40 backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02] sm:text-lg md:px-12 md:py-5"
              >
                {extraContent}
              </motion.p>
            )}

            {actions && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.7, duration: 0.7 }}
                className="relative z-30 mt-5"
              >
                {actions}
              </motion.div>
            )}

            {callToAction && (
              <a
                href={callToAction.href}
                className="mt-7 inline-flex h-12 items-center rounded-full bg-slate-950 px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
              >
                <Play className="mr-2 size-4 fill-current" aria-hidden="true" />
                {callToAction.text}
              </a>
            )}
          </motion.div>
        </div>

        {showMarquees && (
          <div className="pointer-events-none absolute -left-[5%] top-[18%] z-30 w-[110%] -rotate-2 overflow-hidden border-y-4 border-black bg-[#ecec3a] py-3 opacity-95 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
            <ConstantVelocityMarquee velocity={prefersReducedMotion ? 0 : 150}>
              {Array(5)
                .fill('🚨 TRENDING NOW 🚨 EXCLUSIVE DROPS ONLY 🚨 TRENDING NOW 🚨')
                .map((text, index) => (
                  <span
                    key={`${text}-${index}`}
                    className="mx-6 text-2xl font-black italic tracking-widest text-black md:text-3xl"
                  >
                    {text}
                  </span>
                ))}
            </ConstantVelocityMarquee>
          </div>
        )}

        {showMarquees && bottomMarquee && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 overflow-hidden border-y-4 border-black bg-[#ecec3a] py-3 shadow-xl">
            <ConstantVelocityMarquee velocity={prefersReducedMotion ? 0 : 150}>
              {Array(6)
                .fill(bottomMarquee)
                .map((text, index) => (
                  <span key={`${text}-${index}`} className="mx-4 text-xl font-black uppercase tracking-tighter text-black md:text-3xl">
                    {text}
                  </span>
                ))}
            </ConstantVelocityMarquee>
          </div>
        )}
      </motion.section>
    );
  }
);

HeroUI.displayName = 'HeroUI';

export { HeroUI };
