'use client';

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from 'framer-motion';
import { ConstantVelocityMarquee } from './constant-marquee';
import { GhostIcon } from './ghost-icon';

interface HeroSectionProps extends Omit<HTMLMotionProps<'section'>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  semanticTitle?: string;
  extraContent?: React.ReactNode;
  callToAction?: {
    text: string;
    href: string;
  };
}

const HeroUI = React.forwardRef<HTMLElement, HeroSectionProps>(
  ({ className, title, subtitle, semanticTitle, extraContent, callToAction, ...props }, ref) => {
    const constraintsRef = React.useRef<HTMLElement>(null);
    React.useImperativeHandle(ref, () => constraintsRef.current!);

    // "Semantic Orbital System" - Organized Chaos
    const heroItems = [
      // --- LAYER 1: INNER ORBIT (Music Gear & Tech) - The Tools [Radius: ~35-45%] ---
      // SIZE RESTORED: Medium-Large (Visible Tools)
      { id: 'mic', emoji: '🎙️', x: '35%', y: '42%', size: 'text-4xl md:text-7xl', rotate: -15, delay: 0, blur: 'blur-none', opacity: 1 },
      { id: 'headphones', emoji: '🎧', x: '65%', y: '42%', size: 'text-4xl md:text-7xl', rotate: 15, delay: 0.3, blur: 'blur-none', opacity: 1 },
      { id: 'piano', emoji: '🎹', x: '40%', y: '58%', size: 'text-4xl md:text-7xl', rotate: -10, delay: 1.0, blur: 'blur-none', opacity: 1 },
      { id: 'mixer', emoji: '🎚️', x: '60%', y: '58%', size: 'text-4xl md:text-7xl', rotate: 10, delay: 1.5, blur: 'blur-none', opacity: 1 },
      { id: 'cd', emoji: '💿', x: '32%', y: '50%', size: 'text-3xl md:text-6xl', rotate: 45, delay: 2.2, blur: 'blur-none', opacity: 1 },
      { id: 'speaker', emoji: '📢', x: '68%', y: '50%', size: 'text-3xl md:text-6xl', rotate: -20, delay: 1.8, blur: 'blur-none', opacity: 1 },
      { id: 'robot', emoji: '🤖', x: '48%', y: '35%', size: 'text-3xl md:text-6xl', rotate: -10, delay: 4.6, blur: 'blur-none', opacity: 1 },
      { id: 'box', emoji: '📦', x: '52%', y: '65%', size: 'text-3xl md:text-6xl', rotate: 10, delay: 4.9, blur: 'blur-none', opacity: 1 },

      // --- LAYER 2: MIDDLE ORBIT (Internet Vibe & Gossip) - The Reaction [Radius: ~50-70%] ---
      // SIZE RESTORED: Large (Prominent Reactions)
      { id: 'clown', emoji: '🤡', x: '20%', y: '30%', size: 'text-5xl md:text-8xl', rotate: 0, delay: 1.4, blur: 'blur-none', opacity: 1 },
      { id: 'tea', emoji: '🍵', x: '80%', y: '30%', size: 'text-5xl md:text-8xl', rotate: 10, delay: 1.7, blur: 'blur-none', opacity: 1 },
      { id: 'popcorn', emoji: '🍿', x: '15%', y: '50%', size: 'text-4xl md:text-8xl', rotate: -20, delay: 2.0, blur: 'blur-none', opacity: 1 },
      { id: 'eyes', emoji: '👀', x: '50%', y: '18%', size: 'text-4xl md:text-7xl', rotate: -10, delay: 3.0, blur: 'blur-none', opacity: 1 },
      { id: 'bird', emoji: '🐦', x: '25%', y: '70%', size: 'text-4xl md:text-8xl', rotate: -5, delay: 2.8, blur: 'blur-none', opacity: 1 },
      { id: 'shush', emoji: '🤫', x: '75%', y: '70%', size: 'text-4xl md:text-8xl', rotate: 10, delay: 3.2, blur: 'blur-none', opacity: 1 },
      { id: 'cap', emoji: '🧢', x: '85%', y: '50%', size: 'text-4xl md:text-7xl', rotate: 15, delay: 3.5, blur: 'blur-none', opacity: 1 },
      { id: 'camera', emoji: '📸', x: '30%', y: '80%', size: 'text-4xl md:text-8xl', rotate: 10, delay: 3.8, blur: 'blur-none', opacity: 1 },
      { id: 'spy', emoji: '🕵️', x: '70%', y: '80%', size: 'text-4xl md:text-8xl', rotate: -15, delay: 4.0, blur: 'blur-none', opacity: 1 },
      { id: 'nail', emoji: '💅', x: '10%', y: '40%', size: 'text-4xl md:text-7xl', rotate: 20, delay: 4.2, blur: 'blur-none', opacity: 1 },
      { id: 'snake', emoji: '🐍', x: '90%', y: '40%', size: 'text-4xl md:text-7xl', rotate: 25, delay: 4.5, blur: 'blur-none', opacity: 1 },
      { id: 'mask', emoji: '🎭', x: '80%', y: '60%', size: 'text-4xl md:text-7xl', rotate: 15, delay: 4.3, blur: 'blur-none', opacity: 1 },

      // --- LAYER 3: OUTER ORBIT (Hype, Future & Impact) - The Energy [Radius: ~80-95%] ---
      // SIZE RESTORED: MASSIVE (Giant Impact)
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
        className={cn(
          "relative w-full overflow-hidden flex flex-col justify-center items-center py-32 min-h-[90vh]",
          className
        )}
        {...props}
      >
        {/* 1. Global Background: "Candy Split" (Indigo/Periwinkle Base) -> Now Slate/Clean Base */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50">
            {/* GLOBAL GRAIN TEXTURE: Adds 'Film' feel to remove digital flatness */}
            <div
                className="absolute inset-0 opacity-[0.04] mix-blend-color-burn pointer-events-none z-1"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/*
                THE DUALITY MESH
                - Left: Fresh Cyan
                - Right: Sweet Pink
                - Center: Open/White
            */}
            <div className="absolute inset-0 opacity-100" style={{ filter: 'blur(80px)' }}>

                {/* 1. Left Side: Cyan-Blue Gradient */}
                <motion.div
                    className="absolute top-[-10%] left-[-28%] w-[65vw] h-[120vw] rounded-full mix-blend-multiply opacity-60"
                    style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)' }}
                    animate={{
                         scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />

                {/* 2. Right Side: Pink-Purple Gradient */}
                <motion.div
                    className="absolute top-[-10%] right-[-28%] w-[65vw] h-[120vw] rounded-full mix-blend-multiply opacity-60"
                    style={{ background: 'linear-gradient(225deg, #f472b6 0%, #c084fc 100%)' }}
                    animate={{
                         scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                />

                {/* 3. CENTER FILL: Violet/Pink Aura (Full Height Coverage) */}
                <motion.div
                     className="absolute top-[-10%] left-[20%] w-[60vw] h-[120vw] rounded-full mix-blend-multiply opacity-80"
                     style={{ background: 'radial-gradient(circle, rgba(192,132,252,0.6) 0%, rgba(244,114,182,0.5) 40%, transparent 70%)' }} // Violet -> Pink
                     animate={{
                         scale: [0.95, 1.05, 0.95],
                         opacity: [0.6, 0.8, 0.6]
                     }}
                     transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

            </div>
        </div>

        {/* 2. Floating Emojis Layer */}
        {heroItems.map((item) => (
            <GhostIcon
                key={item.id}
                {...item}
                constraintsRef={constraintsRef}
            />
        ))}

        {/* 3. Main Content Layer */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-7xl mx-auto mt-20">
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
               className="mb-8 relative flex flex-col items-center"
            >
               <div className="relative inline-block z-10 px-12 py-4">
                   <h1 className="sr-only">{semanticTitle ?? 'ScoopRYM'}</h1>
                   <motion.div
                     className="text-5xl sm:text-8xl md:text-[11.5rem] font-black italic tracking-[-0.07em] font-sans leading-tight z-20 relative drop-shadow-[0_25px_60px_rgba(0,0,0,0.2)]"
                     style={{
                        backgroundImage: 'linear-gradient(to right, #22d3ee, #e879f9, #facc15, #22d3ee)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        paddingRight: '0.2em',
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
                     }}
                     animate={{
                         backgroundPosition: ['0% center', '-200% center'],
                         filter: ['drop-shadow(0 4px 12px rgba(0,0,0,0.4))', 'drop-shadow(0 4px 20px rgba(255,255,255,0.3))', 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))']
                     }}
                     transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                     }}
                   >
                     {title}
                   </motion.div>
                   {/* Decorative Bars */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-24 flex items-end gap-2 opacity-50 z-10 pointer-events-none mix-blend-overlay">
                        {[...Array(18)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-4 bg-white rounded-t-full shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                                animate={{ height: [20, 80 + Math.random() * 60, 20] }}
                                transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, ease: "easeInOut" }}
                            />
                        ))}
                    </div>
               </div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="mt-8 bg-white/60 backdrop-blur-xl rounded-full px-6 md:px-12 py-5 border border-white/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-white/40 inline-block mx-auto transform transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug text-slate-800">
                     {subtitle || (
                         <>
                         Turn <span className="text-cyan-600 drop-shadow-sm">headlines</span>, <span className="text-pink-600 drop-shadow-sm">entertainment</span> and <span className="text-orange-600 drop-shadow-sm">gossip</span> into <span className="text-slate-900 drop-shadow-sm">AI Rap Songs</span>.
                         </>
                     )}
                  </div>
                </motion.h2>
            </motion.div>
        </div>

        {/* 4. Top Police Tape Ticker */}
        <div className="absolute top-[18%] -left-[5%] w-[110%] -rotate-2 bg-[#ecec3a] shadow-[0_10px_20_rgba(0,0,0,0.2)] z-50 overflow-hidden py-3 border-y-4 border-black pointer-events-none opacity-95">
             <ConstantVelocityMarquee velocity={150}>
                 {Array(5).fill("🚨 TRENDING NOW 🚨 EXCLUSIVE DROPS ONLY 🚨 TRENDING NOW 🚨").map((text, i) => (
                     <span key={i} className="mx-6 text-2xl md:text-3xl font-black text-black italic tracking-widest">{text}</span>
                 ))}
             </ConstantVelocityMarquee>
        </div>
      </motion.section>
    );
  }
);

HeroUI.displayName = "HeroUI";
export { HeroUI };
