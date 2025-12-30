'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlitchTextProps {
  children: ReactNode;
  className?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  intensity?: 'low' | 'medium' | 'high';
  animate?: boolean;
}

export function GlitchText({
  children,
  className,
  level = 'h1',
  intensity = 'medium',
  animate = true,
}: GlitchTextProps) {
  const intensityClasses = {
    low: 'glitch-text-low',
    medium: 'glitch-text-medium',
    high: 'glitch-text-high',
  };

  const baseClasses = cn(
    'font-black uppercase tracking-tighter relative',
    intensityClasses[intensity],
    animate && 'animate-glitch',
    className
  );

  const content = (
    <>
      <span className="glitch-layer glitch-layer-1">{children}</span>
      <span className="glitch-layer glitch-layer-2">{children}</span>
      <span className="glitch-layer glitch-layer-3">{children}</span>
      <span className="glitch-content">{children}</span>
    </>
  );

  switch (level) {
    case 'h1':
      return <h1 className={cn(baseClasses, 'text-6xl md:text-8xl')}>{content}</h1>;
    case 'h2':
      return <h2 className={cn(baseClasses, 'text-4xl md:text-6xl')}>{content}</h2>;
    case 'h3':
      return <h3 className={cn(baseClasses, 'text-3xl md:text-4xl')}>{content}</h3>;
    case 'h4':
      return <h4 className={cn(baseClasses, 'text-2xl md:text-3xl')}>{content}</h4>;
    default:
      return <p className={cn(baseClasses, 'text-lg')}>{content}</p>;
  }
}

interface PunkTextProps {
  children: ReactNode;
  className?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  style?: 'spray' | 'stencil' | 'handwritten' | 'cutout';
}

export function PunkText({ children, className, level = 'h1', style = 'spray' }: PunkTextProps) {
  const styleClasses = {
    spray: 'punk-spray',
    stencil: 'punk-stencil',
    handwritten: 'punk-handwritten',
    cutout: 'punk-cutout',
  };

  const baseClasses = cn(
    'font-black uppercase tracking-tighter',
    styleClasses[style],
    'relative inline-block',
    className
  );

  const content = (
    <>
      <span className="punk-text-shadow">{children}</span>
      <span className="punk-text-main">{children}</span>
      {style === 'cutout' && <span className="punk-text-background">{children}</span>}
    </>
  );

  switch (level) {
    case 'h1':
      return <h1 className={cn(baseClasses, 'text-5xl md:text-7xl')}>{content}</h1>;
    case 'h2':
      return <h2 className={cn(baseClasses, 'text-4xl md:text-6xl')}>{content}</h2>;
    case 'h3':
      return <h3 className={cn(baseClasses, 'text-3xl md:text-5xl')}>{content}</h3>;
    case 'h4':
      return <h4 className={cn(baseClasses, 'text-2xl md:text-4xl')}>{content}</h4>;
    default:
      return <p className={cn(baseClasses, 'text-xl')}>{content}</p>;
  }
}

interface MaximalistTextProps {
  children: ReactNode;
  className?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  gradient?: 'neon' | 'rainbow' | 'metallic' | 'holographic';
  outline?: boolean;
  shadow?: boolean;
}

export function MaximalistText({
  children,
  className,
  level = 'h1',
  gradient = 'neon',
  outline = true,
  shadow = true,
}: MaximalistTextProps) {
  const gradientClasses = {
    neon: 'text-gradient-neon',
    rainbow: 'text-gradient-rainbow',
    metallic: 'text-gradient-metallic',
    holographic: 'text-gradient-holographic',
  };

  const baseClasses = cn(
    'font-black uppercase tracking-tighter',
    gradientClasses[gradient],
    outline && 'text-outline',
    shadow && 'text-shadow-maximalist',
    'relative',
    className
  );

  const content = (
    <>
      {outline && <span className="maximalist-text-outline">{children}</span>}
      <span className="maximalist-text-fill">{children}</span>
      {shadow && <span className="maximalist-text-shadow">{children}</span>}
    </>
  );

  switch (level) {
    case 'h1':
      return <h1 className={cn(baseClasses, 'text-6xl md:text-9xl')}>{content}</h1>;
    case 'h2':
      return <h2 className={cn(baseClasses, 'text-5xl md:text-8xl')}>{content}</h2>;
    case 'h3':
      return <h3 className={cn(baseClasses, 'text-4xl md:text-7xl')}>{content}</h3>;
    case 'h4':
      return <h4 className={cn(baseClasses, 'text-3xl md:text-6xl')}>{content}</h4>;
    default:
      return <p className={cn(baseClasses, 'text-2xl')}>{content}</p>;
  }
}

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  animation?: 'typewriter' | 'glitch-in' | 'scan' | 'wave';
}

export function AnimatedText({
  text,
  className,
  delay = 0,
  stagger = 0.05,
  animation = 'typewriter',
}: AnimatedTextProps) {
  const animationClasses = {
    typewriter: 'animate-typewriter',
    'glitch-in': 'animate-glitch-in',
    scan: 'animate-scan-reveal',
    wave: 'animate-wave',
  };

  return (
    <div className={cn('inline-block', className)}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className={cn('inline-block', animationClasses[animation], char === ' ' && 'w-2')}
          style={{
            animationDelay: `${delay + index * stagger}s`,
            animationFillMode: 'both',
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

interface TextEffectProps {
  children: ReactNode;
  effect: 'rgb-split' | 'chromatic' | 'vhs' | 'data-mosh';
  className?: string;
}

export function TextEffect({ children, effect, className }: TextEffectProps) {
  const effectClasses = {
    'rgb-split': 'effect-rgb-split',
    chromatic: 'effect-chromatic-aberration',
    vhs: 'effect-vhs',
    'data-mosh': 'effect-data-mosh',
  };

  return (
    <div className={cn('relative inline-block', effectClasses[effect], className)}>
      <div className="effect-layer effect-layer-1">{children}</div>
      <div className="effect-layer effect-layer-2">{children}</div>
      <div className="effect-layer effect-layer-3">{children}</div>
      <div className="effect-content">{children}</div>
    </div>
  );
}
