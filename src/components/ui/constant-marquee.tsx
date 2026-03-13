'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useAnimationControls } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConstantVelocityMarqueeProps {
  children: React.ReactNode;
  className?: string;
  velocity?: number; // Pixels per second (Default: 100)
  direction?: 'left' | 'right';
}

export function ConstantVelocityMarquee({
  children,
  className,
  velocity = 100, // Default speed: 100px/s
  direction = 'left',
}: ConstantVelocityMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  // Measure content width to calculate duration
  useEffect(() => {
    const calculateMetrics = () => {
      if (!contentRef.current) return;

      const width = contentRef.current.scrollWidth;
      // We are moving 50% of the total width (because we duplicate content for seamless loop)
      // Actually, standard seamless loop usually duplicates content X times.
      // Let's assume 'children' is the content. We will render it TWICE inside a wrapper.
      // The wrapper moves -50% (which is the width of one copy).

      const moveDistance = width / 2;
      const newDuration = moveDistance / velocity;

      setContentWidth(width);
      setDuration(newDuration);
    };

    calculateMetrics();

    // Recalculate on resize
    const observer = new ResizeObserver(calculateMetrics);
    if (contentRef.current) {
        observer.observe(contentRef.current);
    }

    return () => observer.disconnect();
  }, [velocity, children]);

  // If duration is 0 (first render), don't animate yet to avoid jumps
  const isReady = duration > 0;

  // Determine container height based on screen size to prevent CLS
  const containerHeight = "h-auto min-h-[1.5rem] md:min-h-[2.5rem]";

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden flex w-full relative", containerHeight, className)}
    >
      <motion.div
        ref={contentRef}
        className="flex whitespace-nowrap min-w-max h-full items-center" // Ensure items are vertically centered
        initial={false}
        animate={isReady ? {
          x: direction === 'left' ? [0, -contentWidth / 2] : [-contentWidth / 2, 0],
        } : { x: 0 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: duration,
        }}
      >
        {/* Render children twice for seamless loop */}
        {children}
        {children}
      </motion.div>
    </div>
  );
}
