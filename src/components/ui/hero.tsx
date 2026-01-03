'use client';

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from 'framer-motion';
import { ConstantVelocityMarquee } from './constant-marquee';
import { GhostIcon } from './ghost-icon';

interface HeroSectionProps extends Omit<HTMLMotionProps<'section'>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extraContent?: React.ReactNode;
  callToAction?: {
    text: string;
    href: string;
  };
}

const HeroUI = React.forwardRef<HTMLElement, HeroSectionProps>(
  ({ className, title, subtitle, extraContent, callToAction, ...props }, ref) => {
    const constraintsRef = React.useRef<HTMLElement>(null);
    React.useImperativeHandle(ref, () => constraintsRef.current!);

    // "Inverted Galaxy" - Hype Center / Music Middle / Chaos Outer
    const heroItems = [
      // --- RING 1: INNER CIRCLE (Hype & Gossip - The "Hot Topic" Core) ---
      // Floating tightly around the Title (Range: 35-65%)
      { id: 'rocket', emoji: '🚀', x: '25%', y: '35%', size: 'text-7xl md:text-8xl', rotate: -25, delay: 0.2, blur: 'blur-none', opacity: 1 },
      { id: 'money', emoji: '💸', x: '75%', y: '30%', size: 'text-7xl md:text-8xl', rotate: 25, delay: 0.5, blur: 'blur-none', opacity: 1 },
      { id: 'fire', emoji: '🔥', x: '18%', y: '55%', size: 'text-7xl md:text-8xl', rotate: -15, delay: 0.8, blur: 'blur-none', opacity: 1 },
      { id: 'bomb', emoji: '💣', x: '82%', y: '60%', size: 'text-7xl md:text-8xl', rotate: 15, delay: 1.1, blur: 'blur-none', opacity: 1 },
      { id: 'clown', emoji: '🤡', x: '50%', y: '25%', size: 'text-7xl md:text-8xl', rotate: 0, delay: 1.4, blur: 'blur-none', opacity: 1 },
      { id: 'tea', emoji: '🍵', x: '45%', y: '75%', size: 'text-7xl md:text-8xl', rotate: 10, delay: 1.7, blur: 'blur-none', opacity: 1 },
      { id: 'popcorn', emoji: '🍿', x: '55%', y: '15%', size: 'text-6xl md:text-7xl', rotate: -20, delay: 2.0, blur: 'blur-none', opacity: 1 },

      // --- RING 2: MIDDLE CIRCLE (Music Gear - The Transformation Tool) ---
      // Mid-range orbit (Range: 15-85%)
      { id: 'mic', emoji: '🎙️', x: '12%', y: '45%', size: 'text-8xl md:text-9xl', rotate: -15, delay: 0, blur: 'blur-none', opacity: 1 },
      { id: 'headphones', emoji: '🎧', x: '88%', y: '45%', size: 'text-8xl md:text-9xl', rotate: 15, delay: 0.3, blur: 'blur-none', opacity: 1 },
      { id: 'piano', emoji: '🎹', x: '35%', y: '85%', size: 'text-7xl md:text-8xl', rotate: -10, delay: 1.0, blur: 'blur-none', opacity: 1 },
      { id: 'mixer', emoji: '🎚️', x: '65%', y: '85%', size: 'text-7xl md:text-8xl', rotate: 10, delay: 1.5, blur: 'blur-none', opacity: 1 },
      { id: 'cd', emoji: '💿', x: '5%', y: '15%', size: 'text-7xl md:text-8xl', rotate: 45, delay: 2.2, blur: 'blur-none', opacity: 1 },
      { id: 'speaker', emoji: '📢', x: '95%', y: '15%', size: 'text-7xl md:text-8xl', rotate: -20, delay: 1.8, blur: 'blur-none', opacity: 1 },

      // --- RING 3: OUTER CIRCLE (Chaos & Reactions - The Result) ---
      // Far Edges (Range: 5-95%) - SUPER SIZED
      { id: 'alien', emoji: '👽', x: '5%', y: '85%', size: 'text-[7rem] md:text-[9rem]', rotate: 20, delay: 0.6, blur: 'blur-none', opacity: 1 },
      { id: 'bolt', emoji: '⚡', x: '95%', y: '85%', size: 'text-[7rem] md:text-[9rem]', rotate: -10, delay: 1.2, blur: 'blur-none', opacity: 1 },
      { id: 'mindblown', emoji: '🤯', x: '50%', y: '92%', size: 'text-7xl md:text-8xl', rotate: 0, delay: 2.5, blur: 'blur-none', opacity: 1 },
      { id: 'eyes', emoji: '👀', x: '50%', y: '8%', size: 'text-6xl md:text-7xl', rotate: -10, delay: 3.0, blur: 'blur-none', opacity: 1 },

      // Fillers (Distributed Chaos)
      { id: 'bird', emoji: '🐦', x: '20%', y: '20%', size: 'text-6xl md:text-7xl', rotate: -5, delay: 2.8, blur: 'blur-none', opacity: 1 },
      { id: 'shush', emoji: '🤫', x: '80%', y: '20%', size: 'text-6xl md:text-7xl', rotate: 10, delay: 3.2, blur: 'blur-none', opacity: 1 },
      { id: 'cap', emoji: '🧢', x: '15%', y: '75%', size: 'text-6xl md:text-7xl', rotate: 15, delay: 3.5, blur: 'blur-none', opacity: 1 },
      { id: 'camera', emoji: '📸', x: '85%', y: '75%', size: 'text-6xl md:text-7xl', rotate: 10, delay: 3.8, blur: 'blur-none', opacity: 1 },
      { id: 'spy', emoji: '🕵️', x: '30%', y: '10%', size: 'text-6xl md:text-7xl', rotate: -15, delay: 4.0, blur: 'blur-none', opacity: 1 },
      { id: 'nail', emoji: '💅', x: '70%', y: '10%', size: 'text-6xl md:text-7xl', rotate: 20, delay: 4.2, blur: 'blur-none', opacity: 1 },
      { id: 'snake', emoji: '🐍', x: '8%', y: '50%', size: 'text-6xl md:text-7xl', rotate: 25, delay: 4.5, blur: 'blur-none', opacity: 1 },
      { id: 'invader', emoji: '👾', x: '92%', y: '50%', size: 'text-6xl md:text-7xl', rotate: -10, delay: 4.8, blur: 'blur-none', opacity: 1 },
      { id: 'skull', emoji: '💀', x: '40%', y: '95%', size: 'text-5xl md:text-6xl', rotate: -15, delay: 4.1, blur: 'blur-none', opacity: 1 },
      { id: 'mask', emoji: '🎭', x: '60%', y: '95%', size: 'text-5xl md:text-6xl', rotate: 15, delay: 4.3, blur: 'blur-none', opacity: 1 },
      { id: 'robot', emoji: '🤖', x: '10%', y: '65%', size: 'text-6xl md:text-7xl', rotate: -10, delay: 4.6, blur: 'blur-none', opacity: 1 },
      { id: 'box', emoji: '📦', x: '90%', y: '65%', size: 'text-6xl md:text-7xl', rotate: 10, delay: 4.9, blur: 'blur-none', opacity: 1 },
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
        {/* 1. Global Background: "Liquid Linear Gradient" */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#312e81]">
            {/* DYNAMIC FLUID LINEAR GRADIENT */}
            {/* HD FLUID MESH v9: FULL SCREEN ILLUMINATION (Holographic Dream) */}
            <div className="absolute inset-0 opacity-100 filter" style={{ filter: 'url(#liquid-flow)' }}>
                {/* 1. Airy Holographic Base (Light Indigo/Blue) */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-300 via-blue-500 to-indigo-500 opacity-60" />

                {/* 2. Edge Guardians (Fixes Dark Sides) */}
                <div className="absolute top-0 bottom-0 left-[-10%] w-[50vw] bg-linear-to-r from-cyan-500 opacity-40 blur-[100px]" />
                <div className="absolute top-0 bottom-0 right-[-10%] w-[50vw] bg-linear-to-l from-purple-400 opacity-40 blur-[100px]" />

                {/* Blob 1: Bright Cyan/Blue (Orbiting Clockwise) */}
                <motion.div
                    className="absolute top-[-20%] left-[-20%] w-[120vw] h-[120vw] rounded-full mix-blend-hard-light opacity-80 blur-[60px]"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(103,232,249,1) 0%, rgba(59,130,246,0.5) 50%, transparent 80%)',
                        willChange: 'transform',
                    }}
                    animate={{
                        x: ["0%", "50%", "0%", "-50%", "0%"],
                        y: ["-30%", "0%", "30%", "0%", "-30%"],
                        scale: [1, 1.1, 0.9, 1.1, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {/* Blob 2: SOFT ROSE (Orbiting Counter-Clockwise) */}
                <motion.div
                    className="absolute bottom-[-20%] right-[-20%] w-[120vw] h-[120vw] rounded-full mix-blend-hard-light opacity-80 blur-[60px]"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(251,113,133,1) 0%, rgba(253,164,175,0.5) 50%, transparent 80%)',
                        willChange: 'transform',
                    }}
                    animate={{
                        x: ["0%", "-50%", "0%", "50%", "0%"],
                        y: ["30%", "0%", "-30%", "0%", "30%"],
                        scale: [1.1, 0.9, 1.1, 0.9, 1.1],
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {/* Blob 3: LAVENDER MIST (Bright Core) */}
                <motion.div
                    className="absolute top-[10%] left-[10%] w-screen h-[100vw] rounded-full mix-blend-hard-light opacity-90 blur-[60px]"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(192,132,252,1) 0%, rgba(167,139,250,0.5) 50%, transparent 80%)',
                        willChange: 'transform',
                    }}
                    animate={{
                        x: ["-10%", "10%", "-10%"],
                        y: ["-10%", "10%", "-10%"],
                        scale: [0.9, 1.2, 0.9],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Blob 4: Golden/Yellow (Roaming Accent) */}
                <motion.div
                    className="absolute top-[30%] right-[30%] w-[60vw] h-[60vw] rounded-full mix-blend-color-dodge opacity-60 blur-[50px]"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(250,204,21,1) 0%, transparent 70%)',
                        willChange: 'transform',
                    }}
                    animate={{
                        x: ["20%", "-20%", "20%"],
                        y: ["-20%", "20%", "-20%"],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

            </div>

            {/* SVG Filter: LIQUID INTELLIGENCE */}
            <svg className="absolute w-0 h-0 invisible">
                <filter id="liquid-flow">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.003"
                        numOctaves="1"
                        result="warp"
                    />
                    <feDisplacementMap
                        xChannelSelector="R"
                        yChannelSelector="G"
                        scale="120" // Increased displacement for more swirl
                        in="SourceGraphic"
                        in2="warp"
                    />
                </filter>
            </svg>

            {/* NEW LAYER: "SPECULAR SHEEN" (Reflective Gloss) */}
            <motion.div
                className="absolute inset-0 mix-blend-overlay opacity-40"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, transparent 60%)',
                    filter: 'blur(60px)',
                }}
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.2, 1],
                    x: ['-10%', '10%', '-10%'],
                }}
                transition={{
                    duration: 10,
                    ease: "easeInOut",
                    repeat: Infinity
                }}
            />

            {/* Texture: Film Grain (Noise) */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
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
                   <motion.h1
                     className="text-7xl sm:text-8xl md:text-[11.5rem] font-black italic tracking-tighter font-sans leading-tight z-20 relative drop-shadow-[0_25px_60px_rgba(0,0,0,0.2)]"
                     style={{
                        // 200% size + Repeat first color at end = Seamless Loop
                        // Cyan -> Lavender -> Rose -> Cyan (Holographic Dream)
                        backgroundImage: 'linear-gradient(to right, #22d3ee, #c084fc, #fb7185, #22d3ee)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        paddingRight: '0.2em',
                     }}
                     animate={{
                        backgroundPosition: ["0% center", "200% center"]
                     }}
                     transition={{
                        duration: 8,
                        ease: "linear",
                        repeat: Infinity
                     }}
                   >
                     {title}
                   </motion.h1>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-24 flex items-end gap-2 opacity-60 z-10 pointer-events-none mix-blend-overlay">
                        {[...Array(18)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-4 bg-white rounded-t-full shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                                animate={{ height: [20, 80 + Math.random() * 60, 20] }}
                                transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, ease: "easeInOut" }}
                            />
                        ))}
                    </div>
               </div>

               <div className="mt-2 bg-white/20 backdrop-blur-3xl rounded-full px-12 py-6 border border-white/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] ring-1 ring-white/20 inline-block mx-auto transform transition-all duration-300 hover:scale-105">
                 <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug text-slate-800">
                    Turning <span className="text-cyan-600">news</span>, <span className="text-rose-600">entertainment</span> and <span className="text-orange-600">gossip</span> into <span className="text-indigo-700">Music Beats</span>.
                 </h2>
               </div>
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
