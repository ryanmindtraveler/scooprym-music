'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GhostIconProps {
  id: string;
  emoji: string;
  x: string;
  y: string;
  size: string;
  rotate: number;
  delay: number;
  blur: string;
  opacity: number;
  constraintsRef: React.RefObject<Element | null>;
  startVisible?: boolean;
  reduceMotion?: boolean;
}

export function GhostIcon({
  id,
  emoji,
  x,
  y,
  size,
  rotate,
  delay,
  blur,
  opacity,
  constraintsRef,
  startVisible = false,
  reduceMotion = false,
}: GhostIconProps) {
  // "Ghost State": Tracks if the user is currently grabbing/hovering this spirit.
  const [isInteracting, setIsInteracting] = useState(false);
  // 用户移动后的图标从可见帧继续循环，避免松手瞬间跳回透明帧。
  const [hasBeenMoved, setHasBeenMoved] = useState(false);
  // Randomize the loop slightly so they don't all pulse in perfect sync
  // "Ghost Loop": 12s cycle = 4s In -> 4s Stay -> 4s Out
  // "Ghost Loop": Continuous Liveliness (No Pause)
  const handleInteractionStart = () => {
    setIsInteracting(true);
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
  };

  const handleDragEnd = () => {
    setHasBeenMoved(true);
    setIsInteracting(false);
  };

  return (
    <motion.div
      key={id}
      // PHYSICS ENGINE: Enable Drag & Throw
      drag
      dragConstraints={constraintsRef} // Confined to the Hero container
      dragElastic={0.12}
      dragMomentum={false}

      // INPUT HANDLERS
      onHoverStart={handleInteractionStart}
      onHoverEnd={handleInteractionEnd}
      onDragStart={handleInteractionStart}
      onDragEnd={handleDragEnd}
      onTapStart={handleInteractionStart} // For touch devices
      onTapCancel={handleInteractionEnd}

      // GESTURE OVERRIDES (Physical Feedback)
      whileHover={{
          scale: 1.08,
          zIndex: 50,
          rotate: 0,
          cursor: 'grab',
          filter: 'drop-shadow(0 14px 24px rgba(54,42,76,0.22))'
      }}
      whileDrag={{
          scale: 1.12,
          zIndex: 100, // Pop to very front when grabbed
          rotate: 0,
          cursor: 'grabbing',
          filter: 'drop-shadow(0 18px 30px rgba(54,42,76,0.28))'
      }}
      whileTap={{ scale: 0.95 }}

      className={cn(
        "absolute z-10 select-none will-change-transform touch-none flex items-center justify-center",
        // Pass classNames for sizing
        size
      )}
      style={{
        left: x,
        top: y,
        // No filter/blur here, handled in animation for performance
      }}
    >
        {/* Hitbox Expander: Easier to grab small/fading icons */}
        <div className="pointer-events-auto absolute inset-0 -m-4 rounded-full bg-transparent" />

        <motion.div
            style={{
                display: 'block',
                // 3D Text Styling
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                 // Use drop-shadow for organic shape shadows instead of box-shadow
                filter: 'drop-shadow(0 8px 14px rgba(54,42,76,0.16))',
            }}
            // THE "GHOST LOOP" ANIMATION
            animate={
                isInteracting
                ? {
                    // STATE: GRABBED / HOVERED
                    opacity: Math.min(opacity, 0.9),
                    scale: 1.04,
                    y: 0,
                    rotate: 0,
                    filter: 'blur(0px)'
                  }
                : reduceMotion
                  ? {
                      opacity: startVisible ? Math.min(opacity, 0.72) : Math.min(opacity, 0.5),
                      scale: 1,
                      y: 0,
                      rotate,
                      filter: 'blur(0px)',
                    }
                  : hasBeenMoved
                    ? {
                        // 松手后先保持可见，再自然淡出；下一轮从可见帧衔接，不会永久固定。
                        opacity: [opacity * 0.78, opacity * 0.78, 0, 0, opacity * 0.78],
                        scale: [1, 1.03, 1.06, 0.94, 1],
                        y: [0, -8, -16, 14, 0],
                        rotate: [rotate, rotate + 4, rotate + 7, rotate - 4, rotate],
                        filter: ['blur(0px)', 'blur(0px)', 'blur(5px)', 'blur(5px)', 'blur(0px)'],
                      }
                  : {
                    // STATE: "PHANTOM CYCLE" (10s Loop)
                    // 0-1s: Appear
                    // 1-5s: Float & Stay
                    // 5-6s: Disappear
                    // 6-10s: Void (Wait)
                    opacity: [0, opacity * 0.78, opacity * 0.78, 0, 0],
                    scale: [0.94, 1, 1.03, 1.06, 0.94],
                    y: [14, 0, -8, -16, 14],
                    rotate: [rotate - 4, rotate, rotate + 4, rotate + 7, rotate - 4],
                    filter: ['blur(5px)', 'blur(0px)', 'blur(0px)', 'blur(5px)', 'blur(5px)']
                  }
            }
            transition={
                isInteracting
                ? {
                    duration: 0.2,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    filter: {
                      type: 'tween',
                      duration: 0.2,
                    },
                  }
                : reduceMotion
                  ? { duration: 0 }
                  : hasBeenMoved
                    ? {
                        duration: 14,
                        repeat: Infinity,
                        ease: 'linear',
                        times: [0, 0.4, 0.5, 0.85, 1],
                      }
                  : {
                    // 10s Infinite Loop
                    duration: 14,
                    repeat: Infinity,
                    delay: delay,
                    ease: "linear",
                    times: [0, 0.1, 0.5, 0.6, 1]
                  }
            }
        >
            <span className={cn("relative block", blur === 'blur-none' ? '' : 'blur-sm opacity-80')}>
                {emoji}
            </span>
        </motion.div>
    </motion.div>
  );
}
