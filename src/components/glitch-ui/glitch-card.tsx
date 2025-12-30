'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface GlitchCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'cyan' | 'purple' | 'green';
  hoverEffect?: boolean;
}

export function GlitchCard({
  children,
  className,
  variant = 'cyan',
  hoverEffect = true,
}: GlitchCardProps) {
  const variantClasses = {
    cyan: cn(
      'bg-black/80 border border-[#00ffff]/50',
      'shadow-[0_0_15px_rgba(0,255,255,0.2)]',
      hoverEffect && 'hover:border-[#00ffff] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]'
    ),
    purple: cn(
      'bg-black/80 border border-[#ff00ff]/50',
      'shadow-[0_0_15px_rgba(255,0,255,0.2)]',
      hoverEffect && 'hover:border-[#ff00ff] hover:shadow-[0_0_25px_rgba(255,0,255,0.4)]'
    ),
    green: cn(
      'bg-black/80 border border-[#00ff00]/50',
      'shadow-[0_0_15px_rgba(0,255,0,0.2)]',
      hoverEffect && 'hover:border-[#00ff00] hover:shadow-[0_0_25px_rgba(0,255,0,0.4)]'
    ),
  };

  return (
    <div
      className={cn(
        'glitch-card relative overflow-hidden rounded-xl p-6 transition-all duration-300',
        variantClasses[variant],
        className
      )}
    >
      {/* 扫描线效果 */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent animate-scan opacity-30" />

      {/* RGB分离层 */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-[#ff00ff]/5 mix-blend-screen animate-rgb-split-1" />
        <div className="absolute inset-0 bg-[#00ffff]/5 mix-blend-screen animate-rgb-split-2" />
        <div className="absolute inset-0 bg-[#ffff00]/5 mix-blend-screen animate-rgb-split-3" />
      </div>

      {/* 噪点纹理 */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none rounded-xl" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface PunkCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'stencil' | 'spray';
  tornEdges?: boolean;
}

export function PunkCard({
  children,
  className,
  variant = 'default',
  tornEdges = true,
}: PunkCardProps) {
  const variantClasses = {
    default: cn(
      'bg-black text-white',
      'border-4 border-white',
      'shadow-[8px_8px_0_0_#ff00ff,-8px_-8px_0_0_#00ffff]'
    ),
    stencil: cn(
      'bg-black text-white',
      'border-3 border-dashed border-[#ffff00]',
      'shadow-[6px_6px_0_0_#ff00ff]'
    ),
    spray: cn(
      'bg-black text-white',
      'border-2 border-[#ff00ff]',
      'shadow-[0_0_20px_rgba(0,255,255,0.5)]',
      'punk-spray-effect'
    ),
  };

  return (
    <div
      className={cn(
        'punk-card relative p-8',
        tornEdges && 'punk-torn-edges',
        variantClasses[variant],
        className
      )}
    >
      {/* 手写边框 */}
      <div className="absolute -top-2 -left-2 -right-2 -bottom-2 border-2 border-dashed border-[#ffff00] pointer-events-none" />

      {/* 涂鸦装饰 */}
      <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#ff00ff] rotate-45" />
      <div className="absolute -bottom-3 -left-3 w-5 h-5 bg-[#00ffff] rotate-12" />

      {/* 胶带效果 */}
      <div className="absolute top-4 right-1/4 w-16 h-3 bg-gray-400/30 rotate-3 z-20" />
      <div className="absolute bottom-4 left-1/3 w-12 h-3 bg-gray-400/30 -rotate-2 z-20" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface MaximalistCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'pattern';
  gradient?: 'neon' | 'rainbow' | 'metallic';
  pattern?: 'geometric' | 'organic' | 'digital';
}

export function MaximalistCard({
  children,
  className,
  variant = 'default',
  gradient = 'neon',
  pattern = 'geometric',
}: MaximalistCardProps) {
  const gradientClasses = {
    neon: 'bg-gradient-to-br from-[#ff00ff]/20 via-[#00ffff]/20 to-[#ffff00]/20',
    rainbow: 'bg-gradient-to-br from-red-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 to-purple-500/20',
    metallic: 'bg-gradient-to-br from-gray-300/20 via-gray-100/20 to-gray-300/20',
  };

  const patternClasses = {
    geometric: 'bg-geometric-pattern/20',
    organic: 'bg-organic-pattern/20',
    digital: 'bg-digital-pattern/20',
  };

  const variantClasses = {
    default: cn(
      'bg-black/90 text-white',
      'border-4 border-white',
      'shadow-[0_0_40px_rgba(255,0,255,0.4),0_0_80px_rgba(0,255,255,0.2)]'
    ),
    gradient: cn(
      gradientClasses[gradient],
      'text-white',
      'border-3 border-[#ffff00]',
      'shadow-[0_0_30px_rgba(255,255,255,0.3)]'
    ),
    pattern: cn(
      patternClasses[pattern],
      'text-white',
      'border-3 border-[#ff00ff]',
      'shadow-[0_0_25px_rgba(255,0,255,0.3)]'
    ),
  };

  return (
    <div
      className={cn(
        'maximalist-card relative p-8 overflow-hidden rounded-2xl',
        variantClasses[variant],
        className
      )}
    >
      {/* 多层边框 */}
      <div className="absolute inset-0 border-2 border-[#ff00ff] pointer-events-none rounded-2xl" />
      <div className="absolute -inset-2 border-2 border-[#00ffff] pointer-events-none rounded-2xl opacity-70" />
      <div className="absolute -inset-4 border-2 border-[#ffff00] pointer-events-none rounded-2xl opacity-40" />

      {/* 装饰元素 */}
      <div className="absolute top-4 left-4 w-8 h-8 bg-[#ff00ff] rotate-45 opacity-50" />
      <div className="absolute bottom-4 right-4 w-12 h-12 bg-[#00ffff] rounded-full opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-[#ffff00] rotate-45 opacity-70" />

      {/* 内容区域 */}
      <div className="relative z-10 p-6 bg-black/90 backdrop-blur-sm">{children}</div>

      {/* 浮动粒子 */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
