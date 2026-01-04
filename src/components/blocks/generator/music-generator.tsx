'use client';

import { LoginWrapper } from '@/components/auth/login-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/auth/use-current-user';
import { useMounted } from '@/hooks/ui/use-mounted';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { ArrowUpRight, Mic, Sparkles, Wand2, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConstantVelocityMarquee } from '@/components/ui/constant-marquee';
import { useRouter } from 'next/navigation';
import { useCreateStore } from '@/store/create-store';

import { useState } from 'react';

export function MusicGeneratorBlock() {
  const [newsContent, setNewsContent] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<string>('Hot Gossip');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const currentUser = useCurrentUser();
  const mounted = useMounted();
  const router = useRouter();

  const contentTypes: string[] = ['News Farce', 'Hot Gossip', 'WTF Society'];

  const musicStyles: string[] = [
    '#Trap',
    '#Satirical',
    '#ParodyRap',
    '#MemeEnergy',
    '#Banger',
    '#Catchy',
    '#BoldAttitude',
    '#Absurd',
    '#Viral',
  ];

  // Micro-motion Variants
  const blobVariant = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
      transition: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
    },
  };

  const stickerVariant = {
    hover: {
      rotate: [0, -10, 10, -5, 5, 0],
      scale: 1.1,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  };

  const tagContainerVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const tagItemVariant = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <section
      id="generator"
      className="relative z-20 w-full overflow-hidden py-32 font-sans selection:bg-black selection:text-white"
    >
      <div className="absolute top-0 left-0 right-0 z-30 border-y-4 border-black bg-yellow-300 py-3 overflow-hidden shadow-xl">
        <ConstantVelocityMarquee velocity={150}>
          {Array(6)
            .fill(
              'CREATE YOUR TRACK • NO SKILLS NEEDED • VIRAL HITS INSTANTLY • '
            )
            .map((text, i) => (
              <span
                key={i}
                className="text-2xl md:text-3xl font-black italic uppercase text-black mx-4 tracking-tighter"
              >
                {text}
              </span>
            ))}
        </ConstantVelocityMarquee>
      </div>

      {/* 1. Background - Clean Candy Gradient (Restored) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #a78bfa 50%, #d8b4fe 100%)',
          }}
        />
        {/* Soft Glass Wash to blend with page */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl" />
      </div>

      <div className="mx-auto max-w-[1600px] relative z-10 px-6 md:px-12">
        {/* Main Interface - Floating Dashboard */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic mb-4 drop-shadow-md">
              Create Your Music
            </h2>
            <p className="text-white text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow-sm">
              Paste any trending news or story below, and watch AI transform it into a hip-hop track.
            </p>
          </div>

          {/* Card Container - White Glass */}
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] rounded-[40px] p-2 md:p-3 relative overflow-hidden group">
            {/* Inner Content Area */}
            <div className="w-full h-full rounded-[32px] p-6 md:p-12 relative overflow-hidden">

              <div className="grid gap-12 lg:grid-cols-12 relative z-10">
                {/* Left: Interactive Input Canvas */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="flex items-center justify-between pl-2">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                      {/* Bold Sticker Number */}
                      <motion.span
                        variants={stickerVariant}
                        whileHover="hover"
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-black text-white text-lg font-black -rotate-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] cursor-pointer"
                      >
                        1
                      </motion.span>
                      Enter News Content
                    </h3>
                    <div className="hidden md:flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                  </div>

                  {/* UNIFIED INPUT CARD - White Solid */}
                  <div className="relative group flex flex-col flex-1 min-h-[550px] bg-white rounded-3xl shadow-sm border border-transparent group-hover:border-indigo-300 focus-within:border-[#22d3ee] focus-within:ring-4 focus-within:ring-[#22d3ee]/20 focus-within:shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)] transition-all duration-300 overflow-hidden">
                    {/* Top: Textarea (Takes available space) */}
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Paste news link or enter content here..."
                        className="w-full h-full bg-transparent border-none text-2xl md:text-3xl font-bold text-slate-800 placeholder:text-slate-300 p-8 md:p-10 resize-none focus:ring-0 leading-tight selection:bg-indigo-100"
                        value={newsContent}
                        onChange={(e) => setNewsContent(e.target.value)}
                      />
                    </div>

                    {/* Middle: Divider */}
                    <div className="w-full h-px bg-slate-100 mx-8 max-w-[calc(100%-4rem)]" />

                    {/* Bottom: Supported Formats (Footer) */}
                    <div className="px-8 py-8 bg-slate-50 text-slate-600 font-bold space-y-3 relative z-10 flex flex-col justify-end">
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">
                        Supported input formats:
                      </p>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm pl-0">
                        <li className="flex items-center gap-2.5">
                          <span className="text-lg">🔗</span> News article URLs
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="text-lg">📝</span> Text content /
                          headlines
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="text-lg">📱</span> Social media posts
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="text-lg">🎬</span> Entertainment
                          gossip
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="text-lg">⚽</span> Sports updates
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="text-lg">🔥</span> Trending topics
                        </li>
                      </ul>

                      {/* Status Badge */}
                      <div className="absolute bottom-6 right-6">
                        <div
                          className={cn(
                            'text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all duration-300 border',
                            newsContent.length > 0
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                              : 'bg-slate-200 text-slate-400 border-slate-300'
                          )}
                        >
                          {newsContent.length > 0
                            ? 'Waiting for Generate'
                            : 'Waiting for Input...'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Control Deck */}
                <div className="lg:col-span-5 flex flex-col h-full gap-8">
                  {/* Section 2: Supported Content Types - PASTEL YELLOW SOLID */}
                  <div className="space-y-4 bg-[#FFF9C4] p-6 rounded-3xl border border-white/50 shadow-sm relative overflow-hidden group">
                    <h3 className="text-lg font-black tracking-widest text-[#B45309] mb-3 pl-2 flex items-center gap-3">
                      {/* Bold Sticker Number */}
                      <motion.span
                        variants={stickerVariant}
                        whileHover="hover"
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-black text-white text-sm font-black rotate-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] cursor-pointer"
                      >
                        2
                      </motion.span>
                      Supported Content Types
                    </h3>
                    <div className="flex flex-col gap-3">
                      {contentTypes.map((type, i) => {
                         const isActive = selectedContentType === type;
                         return (
                            <motion.div
                              key={type}
                              onClick={() => setSelectedContentType(type)}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "group flex items-center justify-between w-full p-5 rounded-2xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md border border-transparent",
                                isActive
                                  ? "bg-[#6366F1] text-white shadow-md scale-[1.02]"
                                  : "bg-white text-slate-800 hover:bg-white/80 hover:border-black/5"
                              )}
                            >
                              <span className="text-lg font-bold">
                                {type}
                              </span>
                              <div className={cn("size-4 rounded-full transition-all duration-300 flex items-center justify-center", isActive ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "bg-slate-200 box-border border border-slate-300")}>
                                {isActive && <div className="size-2 rounded-full bg-[#6366F1]" />}
                              </div>
                            </motion.div>
                         );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Music Styles - PASTEL PINK SOLID */}
                  <div className="space-y-4 bg-[#FCE4EC] p-6 rounded-3xl border border-white/50 shadow-sm relative overflow-hidden group">
                    <h3 className="text-lg font-black tracking-widest text-[#831843] mb-3 flex items-center gap-3">
                      {/* Bold Sticker Number */}
                      <motion.span
                        variants={stickerVariant}
                        whileHover="hover"
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-black text-white text-sm font-black -rotate-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] cursor-pointer"
                      >
                        3
                      </motion.span>
                      Music Styles
                    </h3>
                    <motion.div
                      className="flex flex-wrap gap-2.5"
                      variants={tagContainerVariant}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                    >
                      {musicStyles.map((style, i) => {
                        const isSelected = selectedStyles.includes(style);

                        // Define Color Pairs: Pastel (Unselected) vs Vibrant (Selected)
                        const styleConfig = [
                          {
                            pastel: 'bg-pink-100 text-pink-700 hover:bg-pink-200 border-transparent',
                            vibrant: 'bg-pink-500 text-white shadow-lg shadow-pink-500/40 ring-2 ring-white ring-offset-2 ring-offset-[#FCE4EC]'
                          },
                          {
                            pastel: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent',
                            vibrant: 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 ring-2 ring-white ring-offset-2 ring-offset-[#FCE4EC]'
                          },
                          {
                            pastel: 'bg-green-100 text-green-700 hover:bg-green-200 border-transparent',
                            vibrant: 'bg-green-500 text-white shadow-lg shadow-green-500/40 ring-2 ring-white ring-offset-2 ring-offset-[#FCE4EC]'
                          },
                          {
                            pastel: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent',
                            vibrant: 'bg-purple-500 text-white shadow-lg shadow-purple-500/40 ring-2 ring-white ring-offset-2 ring-offset-[#FCE4EC]'
                          },
                          {
                            pastel: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-transparent',
                            vibrant: 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 ring-2 ring-white ring-offset-2 ring-offset-[#FCE4EC]'
                          },
                        ];
                        const config = styleConfig[i % styleConfig.length];

                        return (
                          <motion.button
                            key={style}
                            type="button"
                            onClick={() => {
                                if (isSelected) {
                                    setSelectedStyles(prev => prev.filter(s => s !== style));
                                } else {
                                    setSelectedStyles(prev => [...prev, style]);
                                }
                            }}
                            variants={tagItemVariant}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "relative px-4 py-2.5 font-bold rounded-xl text-sm transition-all duration-300 border flex items-center justify-center gap-2 select-none",
                              isSelected ? config.vibrant : config.pastel
                            )}
                          >
                            <span>#{style}</span>

                            {/* Absolute Status Indicator - Zero Layout Shift */}
                            <motion.div
                              initial={false}
                              animate={{ scale: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
                              className="absolute -top-1.5 -right-1.5 size-4 bg-white text-black rounded-full shadow-sm flex items-center justify-center z-10"
                            >
                                <Check className="w-2.5 h-2.5 stroke-4" />
                            </motion.div>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </div>

                  {/* Main Action - GRADIENT BUTTON */}
                  <div className="mt-auto pt-6">
                    {mounted && currentUser ? (
                      <Button
                        onClick={(e) => {
                           if (!newsContent.trim()) {
                             e.preventDefault();
                             return;
                           }
                           // Store State Transfer (Like QuickGenerateForm)
                           const store = useCreateStore.getState();
                           store.reset(); // Get Custom Vibe defaults
                           // Smart Detect
                           const isUrl = /^(https?:\/\/|www\.)[^ "]+$/i.test(newsContent);
                           if (isUrl) {
                               store.setNewsLink(newsContent);
                               store.setNewsContent('');
                           } else {
                               store.setNewsContent(newsContent);
                               store.setNewsLink('');
                           }
                           store.setShouldAutoGenerate(true);
                           // Navigate to Studio
                           router.push(Routes.Create);
                        }}
                        className="w-full h-auto py-8 bg-linear-to-r from-blue-600 via-purple-600 to-pink-500 hover:opacity-90 text-white rounded-3xl shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border-2 border-black"
                      >
                       {/* ... Content ... */}
                          {/* Shimmer Element - Moved INSIDE LocaleLink to satisfy asChild single-child rule */}
                          <motion.div
                            className="absolute inset-0 z-0 pointer-events-none"
                            initial={{ x: '-200%' }}
                            animate={{ x: ['-200%', '200%'] }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 2.5,
                              ease: "easeInOut",
                              repeatDelay: 1
                            }}
                            style={{
                              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                              width: '50%',
                              transform: 'skewX(-20deg)',
                            }}
                          />

                          <div className="relative z-10 flex items-center justify-between w-full px-8">
                            <div className="flex flex-col items-start transition-transform duration-300 group-hover:translate-x-2">
                              <span className="text-3xl font-black italic tracking-tighter drop-shadow-sm flex items-center gap-2">
                                Generate Music <span className="animate-bounce">🎵</span>
                              </span>
                              <span className="text-xs font-bold text-white/80 uppercase tracking-[0.2em]">
                                AI-Powered Instant Hit
                              </span>
                            </div>

                            {/* Arrow Circle with Pulse & Rotate */}
                            <div className="relative">
                              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
                              <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-full backdrop-blur-md border border-white/30 transition-all duration-300 group-hover:bg-white group-hover:text-purple-600 group-hover:scale-110 group-hover:rotate-12 shadow-xl">
                                <ArrowUpRight className="w-8 h-8 transition-transform duration-300 group-hover:rotate-45" />
                              </div>
                            </div>
                          </div>
                        </Button>
                    ) : (
                      <LoginWrapper
                        mode="modal"
                        asChild
                        callbackUrl={
                          newsContent.trim()
                            ? `${Routes.Create}?content=${encodeURIComponent(
                                newsContent
                              )}`
                            : undefined
                        }
                      >
                         <Button
                          className="w-full h-auto py-8 bg-linear-to-r from-blue-600 via-purple-600 to-pink-500 hover:opacity-90 text-white rounded-3xl shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border-2 border-black"
                          onClick={(e) => {
                            if (!newsContent.trim()) {
                              e.preventDefault();
                            }
                          }}
                        >
                          {/* Shimmer Element - COPY */ }
                          <motion.div
                            className="absolute inset-0 z-0 pointer-events-none"
                            initial={{ x: '-200%' }}
                            animate={{ x: ['-200%', '200%'] }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 2.5,
                              ease: "easeInOut",
                              repeatDelay: 1
                            }}
                            style={{
                              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                              width: '50%',
                              transform: 'skewX(-20deg)',
                            }}
                          />

                          <div className="relative z-10 flex items-center justify-between w-full px-8">
                            <div className="flex flex-col items-start transition-transform duration-300 group-hover:translate-x-2">
                              <span className="text-3xl font-black italic tracking-tighter drop-shadow-sm flex items-center gap-2">
                                Generate Music <span className="animate-bounce">🎵</span>
                              </span>
                              <span className="text-xs font-bold text-white/80 uppercase tracking-[0.2em]">
                                AI-Powered Instant Hit
                              </span>
                            </div>

                            {/* Arrow Circle with Pulse & Rotate */}
                            <div className="relative">
                              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
                              <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-full backdrop-blur-md border border-white/30 transition-all duration-300 group-hover:bg-white group-hover:text-purple-600 group-hover:scale-110 group-hover:rotate-12 shadow-xl">
                                <ArrowUpRight className="w-8 h-8 transition-transform duration-300 group-hover:rotate-45" />
                              </div>
                            </div>
                          </div>
                        </Button>
                      </LoginWrapper>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
