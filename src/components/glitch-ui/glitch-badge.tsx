'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface GlitchBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'cyan' | 'purple' | 'green';
  size?: 'sm' | 'md' | 'lg';
}

export function GlitchBadge({
  children,
  className,
  variant = 'cyan',
  size = 'md',
}: GlitchBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const variantClasses = {
    cyan: cn(
      'bg-[#00ffff]/10 text-[#00ffff]',
      'border border-[#00ffff]/50',
      'shadow-[0_0_10px_rgba(0,255,255,0.3)]'
    ),
    purple: cn(
      'bg-[#ff00ff]/10 text-[#ff00ff]',
      'border border-[#ff00ff]/50',
      'shadow-[0_0_10px_rgba(255,0,255,0.3)]'
    ),
    green: cn(
      'bg-[#00ff00]/10 text-[#00ff00]',
      'border border-[#00ff00]/50',
      'shadow-[0_0_10px_rgba(0,255,0,0.3)]'
    ),
  };

  return (
    <span
      className={cn(
        'glitch-badge relative inline-flex items-center justify-center font-mono uppercase tracking-wider',
        'rounded-full overflow-hidden',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {/* 扫描线效果 */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-scan" />

      {/* 噪点纹理 */}
      <span className="absolute inset-0 bg-noise opacity-[0.05]" />

      <span className="relative z-10">{children}</span>
    </span>
  );
}

interface PunkBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'sticker';
  size?: 'sm' | 'md' | 'lg';
  tornEdges?: boolean;
}

export function PunkBadge({
  children,
  className,
  variant = 'default',
  size = 'md',
  tornEdges = true,
}: PunkBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const variantClasses = {
    default: cn(
      'bg-black text-white',
      'border-2 border-white',
      'shadow-[3px_3px_0_0_#ff00ff,-3px_-3px_0_0_#00ffff]'
    ),
    outline: cn(
      'bg-transparent text-white',
      'border-2 border-dashed border-[#ffff00]',
      'shadow-[2px_2px_0_0_#ff00ff]'
    ),
    sticker: cn(
      'bg-[#ffff00] text-black',
      'border border-black',
      'shadow-[0_2px_0_0_black]',
      '-rotate-2'
    ),
  };

  return (
    <span
      className={cn(
        'punk-badge inline-flex items-center justify-center font-black uppercase tracking-wider',
        tornEdges && 'punk-torn-edges',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {/* 涂鸦装饰 */}
      {variant === 'default' && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff00ff] rotate-45" />
      )}

      {/* 胶带效果（仅sticker） */}
      {variant === 'sticker' && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-gray-400/30 rotate-90" />
      )}

      <span className="relative z-10">{children}</span>
    </span>
  );
}

interface MaximalistBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'pattern';
  size?: 'sm' | 'md' | 'lg';
  gradient?: 'neon' | 'rainbow' | 'metallic';
  pattern?: 'geometric' | 'organic' | 'digital';
}

export function MaximalistBadge({
  children,
  className,
  variant = 'default',
  size = 'md',
  gradient = 'neon',
  pattern = 'geometric',
}: MaximalistBadgeProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base',
  };

  const gradientClasses = {
    neon: 'bg-gradient-to-r from-[#ff00ff] via-[#00ffff] to-[#ffff00]',
    rainbow: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
    metallic: 'bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300',
  };

  const patternClasses = {
    geometric: 'bg-geometric-pattern',
    organic: 'bg-organic-pattern',
    digital: 'bg-digital-pattern',
  };

  const variantClasses = {
    default: cn(
      'bg-black text-white',
      'border-2 border-white',
      'shadow-[0_0_15px_rgba(255,0,255,0.5)]'
    ),
    gradient: cn(
      gradientClasses[gradient],
      'text-black font-black',
      'border-2 border-white',
      'shadow-[0_0_10px_rgba(255,255,255,0.5)]'
    ),
    pattern: cn(
      patternClasses[pattern],
      'text-white font-black',
      'border border-[#ff00ff]',
      'shadow-[0_0_10px_rgba(255,0,255,0.4)]'
    ),
  };

  return (
    <span
      className={cn(
        'maximalist-badge relative inline-flex items-center justify-center font-black uppercase tracking-wider overflow-hidden rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {/* 多层边框 */}
      <div className="absolute inset-0 border border-[#ff00ff] pointer-events-none rounded-full" />
      <div className="absolute -inset-0.5 border border-[#00ffff] pointer-events-none rounded-full" />

      {/* 装饰元素 */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#ff00ff] rotate-45 opacity-50" />
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#00ffff] rounded-full opacity-50" />

      {/* 内容 */}
      <span className="relative z-10">{children}</span>

      {/* 浮动粒子 */}
      <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${1 + Math.random() * 1.5}s`,
            }}
          />
        ))}
      </div>
    </span>
  );
}
