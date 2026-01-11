'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlitchButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  intensity?: 'low' | 'medium' | 'high';
  disabled?: boolean;
  onClick?: () => void;
}

export function GlitchButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  intensity = 'medium',
  disabled = false,
  onClick,
}: GlitchButtonProps) {
  const intensityClasses = {
    low: '',
    medium: 'glitch-hover',
    high: 'glitch-always animate-glitch-text',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    icon: 'h-10 w-10 p-2 flex items-center justify-center',
  };

  const variantClasses = {
    default: cn(
      'bg-black/80 text-[#00ffff]',
      'border-2 border-[#00ffff]',
      'shadow-[0_0_10px_rgba(0,255,255,0.5)]',
      'hover:bg-[#00ffff]/10 hover:shadow-[0_0_20px_rgba(0,255,255,0.7)]',
      'active:scale-95'
    ),
    outline: cn(
      'bg-transparent text-[#ff00ff]',
      'border-2 border-[#ff00ff]',
      'shadow-[0_0_10px_rgba(255,0,255,0.5)]',
      'hover:bg-[#ff00ff]/10 hover:shadow-[0_0_20px_rgba(255,0,255,0.7)]',
      'active:scale-95'
    ),
    ghost: cn('bg-transparent text-white', 'hover:bg-white/10', 'active:scale-95'),
    destructive: cn(
      'bg-red-900/50 text-red-500',
      'border-2 border-red-500',
      'shadow-[0_0_10px_rgba(255,0,0,0.5)]',
      'hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(255,0,0,0.7)]',
      'active:scale-95'
    ),
  };

  return (
    <button
      className={cn(
        'glitch-button relative overflow-hidden font-mono uppercase tracking-wider',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-[#00ffff]/50',
        intensityClasses[intensity],
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {/* 扫描线效果 */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent animate-scan" />

      {/* RGB分离层 */}
      <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-[#ff00ff]/10 mix-blend-screen animate-rgb-split-1" />
        <div className="absolute inset-0 bg-[#00ffff]/10 mix-blend-screen animate-rgb-split-2" />
        <div className="absolute inset-0 bg-[#ffff00]/10 mix-blend-screen animate-rgb-split-3" />
      </div>

      {/* 噪点纹理 */}
      <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none" />

      <span className="relative z-10">{children}</span>
    </button>
  );
}

interface PunkButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'sticker';
  size?: 'sm' | 'md' | 'lg';
  tornEdges?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function PunkButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  tornEdges = true,
  disabled = false,
  onClick,
}: PunkButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    default: cn(
      'bg-black text-white',
      'border-3 border-white',
      'shadow-[6px_6px_0_0_#ff00ff,-6px_-6px_0_0_#00ffff]',
      'hover:shadow-[8px_8px_0_0_#ff00ff,-8px_-8px_0_0_#00ffff]',
      'active:shadow-[4px_4px_0_0_#ff00ff,-4px_-4px_0_0_#00ffff]'
    ),
    outline: cn(
      'bg-transparent text-white',
      'border-3 border-dashed border-[#ffff00]',
      'shadow-[4px_4px_0_0_#ff00ff]',
      'hover:shadow-[6px_6px_0_0_#ff00ff]',
      'active:shadow-[2px_2px_0_0_#ff00ff]'
    ),
    sticker: cn(
      'bg-[#ff00ff] text-black',
      'border-2 border-black',
      'shadow-[0_4px_0_0_black]',
      'hover:translate-y-[-2px] hover:shadow-[0_6px_0_0_black]',
      'active:translate-y-[1px] active:shadow-[0_2px_0_0_black]'
    ),
  };

  return (
    <button
      className={cn(
        'punk-button relative overflow-hidden uppercase tracking-wider',
        'transition-all duration-200 ease-out',
        'font-black',
        tornEdges && 'punk-torn-edges',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {/* 手写边框 */}
      <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-dashed border-[#ffff00] pointer-events-none" />

      {/* 涂鸦装饰 */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#ff00ff] rotate-45" />
      <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-[#00ffff] rotate-12" />

      {/* 内容 */}
      <span className="relative z-10">{children}</span>

      {/* 胶带效果（仅sticker变体） */}
      {variant === 'sticker' && (
        <>
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-gray-400/30 rotate-3" />
          <div className="absolute bottom-1 left-1/4 w-8 h-1.5 bg-gray-400/30 -rotate-6" />
        </>
      )}
    </button>
  );
}

interface MaximalistButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'pattern';
  size?: 'sm' | 'md' | 'lg';
  gradient?: 'neon' | 'rainbow' | 'metallic';
  pattern?: 'geometric' | 'organic' | 'digital';
  disabled?: boolean;
  onClick?: () => void;
}

export function MaximalistButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  gradient = 'neon',
  pattern = 'geometric',
  disabled = false,
  onClick,
}: MaximalistButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
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
      'text-black font-black',
      'border-4 border-white',
      'shadow-[0_0_30px_rgba(255,0,255,0.5),0_0_60px_rgba(0,255,255,0.3)]',
      'hover:shadow-[0_0_40px_rgba(255,0,255,0.7),0_0_80px_rgba(0,255,255,0.5)]',
      'active:scale-95'
    ),
    gradient: cn(
      gradientClasses[gradient],
      'text-black font-black',
      'border-3 border-white',
      'shadow-[0_0_25px_rgba(255,255,255,0.5)]',
      'hover:shadow-[0_0_35px_rgba(255,255,255,0.7)]',
      'active:scale-95'
    ),
    pattern: cn(
      patternClasses[pattern],
      'text-white font-black',
      'border-2 border-[#ff00ff]',
      'shadow-[0_0_20px_rgba(255,0,255,0.4)]',
      'hover:shadow-[0_0_30px_rgba(255,0,255,0.6)]',
      'active:scale-95'
    ),
  };

  return (
    <button
      className={cn(
        'maximalist-button relative overflow-hidden uppercase tracking-wider',
        'transition-all duration-300 ease-out',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {/* 多层边框 */}
      <div className="absolute inset-0 border-2 border-[#ff00ff] pointer-events-none" />
      <div className="absolute -inset-1 border-2 border-[#00ffff] pointer-events-none" />
      <div className="absolute -inset-2 border-2 border-[#ffff00] pointer-events-none" />

      {/* 装饰元素 */}
      <div className="absolute top-2 left-2 w-4 h-4 bg-[#ff00ff] rotate-45 opacity-50" />
      <div className="absolute bottom-2 right-2 w-6 h-6 bg-[#00ffff] rounded-full opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-[#ffff00] rotate-45 opacity-70" />

      {/* 内容 */}
      <span className="relative z-10">{children}</span>

      {/* 浮动粒子 */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </button>
  );
}
