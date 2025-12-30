'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps, useScroll, useTransform, AnimatePresence } from 'framer-motion';

/**
 * HeroSectionProps 接口定义
 * @property title - 主标题，支持 React 节点
 * @property subtitle - 副标题，内容通常是核心价值主张
 * @property callToAction - 行动呼吁按钮的配置（文字和链接）
 * @property backgroundImage - 背景图片 URL
 * @property extraContent - 额外内容，例如 Google One Tap 登录组件
 */
interface HeroSectionProps extends Omit<HTMLMotionProps<'section'>, 'title'> {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  callToAction?: {
    text: string;
    href: string;
  };
  backgroundImage?: string;
  extraContent?: React.ReactNode;
}

const HeroUI = React.forwardRef<HTMLElement, HeroSectionProps>(
  ({ className, title, subtitle, callToAction, backgroundImage, extraContent, ...props }, ref) => {

    // 文本梯度动画 (模拟)
    const rainbowTextStyle = {
       backgroundClip: 'text',
       WebkitBackgroundClip: 'text',
       color: 'transparent',
       backgroundImage: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 30%, #5EE7DF 60%, #B490CA 100%)',
    };

    return (
      <motion.section
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden flex flex-col justify-center items-center py-24 min-h-[80vh]",
          className
        )}
        {...props}
      >
        {/* 1. 动态背景层 */}
        <div className="absolute inset-0 z-0">
           {/* 浮动元素示例 */}
           <motion.div
             animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
             }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
           />
           <motion.div
             animate={{
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
             }}
             transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
             className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-yellow-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
           />
        </div>

        {/* 2. 内容层 */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="mb-8"
            >
               {/* 标题 */}
               <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white drop-shadow-sm">
                 {title}
               </h1>

               {/* 副标题 */}
               <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200 tracking-wide max-w-3xl mx-auto" style={{ lineHeight: 1.4 }}>
                  {subtitle}
               </h2>
            </motion.div>

            {/* 额外内容区 (例如一键登录 - 高透玻璃拟态卡片) */}
            {extraContent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="mt-8 w-full max-w-sm"
              >
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-white/50">
                     <div className="flex items-center justify-center gap-2 mb-4 text-gray-500 text-xs font-bold uppercase tracking-widest">
                        👇 GET ACCESS NOW 👇
                     </div>
                     {extraContent}
                  </div>
              </motion.div>
            )}
        </div>

        {/* 3. 跑马灯 Tickers - 复古潮流风格 (黄色警戒带) */}
        <div className="absolute top-[15%] -left-[10%] w-[120%] -rotate-2 bg-yellow-300 shadow-xl z-20 overflow-hidden py-3 font-black text-2xl md:text-3xl uppercase tracking-tighter border-y-4 border-black text-black">
             <div className="flex animate-marquee whitespace-nowrap">
                 {Array(10).fill("🔥 TURN THE TEA INTO TUNES 🔥 FROM HEADLINES TO BASSLINES 🔥 SCOOPRYM EXCLUSIVE 🔥").map((text, i) => (
                     <span key={i} className="mx-4">{text}</span>
                 ))}
             </div>
        </div>
      </motion.section>
    );
  }
);

HeroUI.displayName = "HeroUI";
export { HeroUI };
