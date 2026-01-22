'use client';

import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, type ReactNode, useId } from 'react';

interface GlitchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  variant?: 'cyan' | 'purple' | 'green';
  intensity?: 'low' | 'medium' | 'high';
  error?: string;
}

export function GlitchInput({
  label,
  icon,
  variant = 'cyan',
  intensity = 'medium',
  error,
  className,
  ...props
}: GlitchInputProps) {
  const intensityClasses = {
    low: '',
    medium: 'glitch-hover',
    high: 'glitch-always animate-glitch-text',
  };

  const uniqueId = useId();
  const inputId = props.id || uniqueId;

  const variantClasses = {
    cyan: cn(
      'bg-black/50 border border-[#00ffff]/50 text-[#00ffff]',
      'focus:border-[#00ffff] focus:shadow-[0_0_10px_rgba(0,255,255,0.5)]',
      'placeholder:text-[#00ffff]/30'
    ),
    purple: cn(
      'bg-black/50 border border-[#ff00ff]/50 text-[#ff00ff]',
      'focus:border-[#ff00ff] focus:shadow-[0_0_10px_rgba(255,0,255,0.5)]',
      'placeholder:text-[#ff00ff]/30'
    ),
    green: cn(
      'bg-black/50 border border-[#00ff00]/50 text-[#00ff00]',
      'focus:border-[#00ff00] focus:shadow-[0_0_10px_rgba(0,255,0,0.5)]',
      'placeholder:text-[#00ff00]/30'
    ),
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#ff00ff]"
        >
          {icon && <span className="text-[#00ffff]">{icon}</span>}
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'font-mono transition-all duration-200',
            'focus:outline-none focus:scale-[1.02]',
            intensityClasses[intensity],
            variantClasses[variant],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />

        {/* 扫描线效果 */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent animate-scan" />

        {/* RGB分离层 */}
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-[#ff00ff]/5 mix-blend-screen animate-rgb-split-1" />
          <div className="absolute inset-0 bg-[#00ffff]/5 mix-blend-screen animate-rgb-split-2" />
          <div className="absolute inset-0 bg-[#ffff00]/5 mix-blend-screen animate-rgb-split-3" />
        </div>

        {/* 噪点纹理 */}
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none rounded-lg" />
      </div>

      {error && (
        <p className="text-sm text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <span className="text-red-500">⚠️</span> {error}
        </p>
      )}
    </div>
  );
}

interface PunkInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  variant?: 'default' | 'stencil' | 'spray';
  tornEdges?: boolean;
  error?: string;
}

export function PunkInput({
  label,
  icon,
  variant = 'default',
  tornEdges = true,
  error,
  className,
  ...props
}: PunkInputProps) {
  const variantClasses = {
    default: cn(
      'bg-black text-white',
      'border-3 border-white',
      'focus:border-[#ff00ff] focus:ring-4 focus:ring-[#ff00ff]/30',
      'placeholder:text-gray-400'
    ),
    stencil: cn(
      'bg-black text-white',
      'border-2 border-dashed border-[#ffff00]',
      'focus:border-solid focus:border-[#ff00ff] focus:ring-4 focus:ring-[#ff00ff]/30',
      'placeholder:text-gray-500'
    ),
    spray: cn(
      'bg-black text-white',
      'border-2 border-[#ff00ff]',
      'focus:border-[#00ffff] focus:ring-4 focus:ring-[#00ffff]/30',
      'placeholder:text-gray-400',
      'punk-spray-effect'
    ),
  };

  const uniqueId = useId();
  const inputId = props.id || uniqueId;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"
        >
          {icon && <span className="text-[#ff00ff]">{icon}</span>}
          <span className="bg-black px-2 py-1 border border-white">{label}</span>
        </label>
      )}

      <div className={cn('relative', tornEdges && 'punk-torn-edges')}>
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-3',
            'font-bold transition-all duration-200',
            'focus:outline-none focus:translate-y-[-2px]',
            variantClasses[variant],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />

        {/* 手写边框 */}
        <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-dashed border-[#ffff00] pointer-events-none" />

        {/* 涂鸦装饰 */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#ff00ff] rotate-45" />
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-[#00ffff] rotate-12" />
      </div>

      {error && (
        <p className="text-sm text-red-400 font-black uppercase tracking-wider flex items-center gap-1 bg-black px-2 py-1 border border-red-500">
          <span className="text-red-500">❌</span> {error}
        </p>
      )}
    </div>
  );
}

interface MaximalistInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  variant?: 'default' | 'gradient' | 'pattern';
  gradient?: 'neon' | 'rainbow' | 'metallic';
  pattern?: 'geometric' | 'organic' | 'digital';
  error?: string;
}

export function MaximalistInput({
  label,
  icon,
  variant = 'default',
  gradient = 'neon',
  pattern = 'geometric',
  error,
  className,
  ...props
}: MaximalistInputProps) {
  const gradientClasses = {
    neon: 'bg-gradient-to-r from-[#ff00ff]/10 via-[#00ffff]/10 to-[#ffff00]/10',
    rainbow: 'bg-gradient-to-r from-red-500/10 via-yellow-500/10 via-green-500/10 via-blue-500/10 to-purple-500/10',
    metallic: 'bg-gradient-to-r from-gray-300/10 via-gray-100/10 to-gray-300/10',
  };

  const patternClasses = {
    geometric: 'bg-geometric-pattern/10',
    organic: 'bg-organic-pattern/10',
    digital: 'bg-digital-pattern/10',
  };

  const variantClasses = {
    default: cn(
      'bg-black/80 text-white',
      'border-2 border-[#ff00ff]',
      'focus:border-[#00ffff] focus:ring-4 focus:ring-[#00ffff]/50',
      'placeholder:text-gray-400'
    ),
    gradient: cn(
      gradientClasses[gradient],
      'text-white',
      'border-2 border-white',
      'focus:border-[#ffff00] focus:ring-4 focus:ring-[#ffff00]/50',
      'placeholder:text-gray-300'
    ),
    pattern: cn(
      patternClasses[pattern],
      'text-white',
      'border-2 border-[#ff00ff]',
      'focus:border-[#00ffff] focus:ring-4 focus:ring-[#00ffff]/50',
      'placeholder:text-gray-300'
    ),
  };

  const uniqueId = useId();
  const inputId = props.id || uniqueId;

  return (
    <div className="space-y-3">
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-3 text-lg font-black uppercase tracking-wider text-white"
        >
          {icon && <span className="text-[#ffff00]">{icon}</span>}
          <span className="bg-gradient-to-r from-[#ff00ff] to-[#00ffff] bg-clip-text text-transparent">{label}</span>
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          className={cn(
            'w-full px-5 py-4 rounded-xl',
            'font-bold transition-all duration-300',
            'focus:outline-none focus:scale-[1.02]',
            variantClasses[variant],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />

        {/* 多层边框 */}
        <div className="absolute inset-0 border-2 border-[#ff00ff] pointer-events-none rounded-xl" />
        <div className="absolute -inset-1 border-2 border-[#00ffff] pointer-events-none rounded-xl" />
        <div className="absolute -inset-2 border-2 border-[#ffff00] pointer-events-none rounded-xl" />

        {/* 装饰元素 */}
        <div className="absolute top-3 left-3 w-3 h-3 bg-[#ff00ff] rotate-45 opacity-50" />
        <div className="absolute bottom-3 right-3 w-4 h-4 bg-[#00ffff] rounded-full opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-[#ffff00] rotate-45 opacity-70" />

        {/* 浮动粒子 */}
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 font-black uppercase tracking-wider flex items-center gap-2">
          <span className="text-red-500 text-xl">⛔</span>
          <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">{error}</span>
        </p>
      )}
    </div>
  );
}
