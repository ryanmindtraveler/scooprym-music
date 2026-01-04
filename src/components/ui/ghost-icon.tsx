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
}: GhostIconProps) {

  // "Ghost State": Tracks if the user is currently grabbing/hovering this spirit.
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Randomize the loop slightly so they don't all pulse in perfect sync
  // "Ghost Loop": 12s cycle = 4s In -> 4s Stay -> 4s Out
  // "Ghost Loop": Continuous Liveliness (No Pause)
  const [randomDuration] = useState(6 + Math.random() * 3); // Faster! 6-9s cycle

  const handleInteractionStart = () => {
    setIsInteracting(true);
    setHasInteracted(true);
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
  };

  return (
    <motion.div
      key={id}
      // PHYSICS ENGINE: Enable Drag & Throw
      drag
      dragConstraints={constraintsRef} // Confined to the Hero container
      dragElastic={0.2} // Bouncy edges
      dragMomentum={true} // Throw physics enabled
      dragTransition={{ bounceStiffness: 400, bounceDamping: 10 }} // Float feel

      // INPUT HANDLERS
      onHoverStart={handleInteractionStart}
      onHoverEnd={handleInteractionEnd}
      onDragStart={handleInteractionStart}
      onDragEnd={handleInteractionEnd}
      onTapStart={handleInteractionStart} // For touch devices
      onTapCancel={handleInteractionEnd}

      // GESTURE OVERRIDES (Physical Feedback)
      whileHover={{
          scale: 1.15,
          zIndex: 50,
          rotate: 0,
          cursor: 'grab',
          filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.3))'
      }}
      whileDrag={{
          scale: 1.25,
          zIndex: 100, // Pop to very front when grabbed
          rotate: 0,
          cursor: 'grabbing',
          filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.5))'
      }}
      whileTap={{ scale: 0.95 }}

      className={cn(
        "absolute z-60 select-none will-change-transform touch-none flex items-center justify-center",
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
        <div className="absolute inset-0 -m-12 rounded-full pointer-events-auto bg-transparent" />

        <motion.div
            style={{
                display: 'block',
                // 3D Text Styling
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                 // Use drop-shadow for organic shape shadows instead of box-shadow
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))',
            }}
            // THE "GHOST LOOP" ANIMATION
            animate={
                isInteracting
                ? {
                    // STATE: GRABBED / HOVERED
                    opacity: 1, // Instantly visible
                    scale: 1.1,
                    y: 0,
                    rotate: 0,
                    filter: 'blur(0px)'
                  }
                : {
                    // STATE: "PHANTOM CYCLE" (10s Loop)
                    // 0-1s: Appear
                    // 1-5s: Float & Stay
                    // 5-6s: Disappear
                    // 6-10s: Void (Wait)
                    opacity: [0, 1, 1, 0, 0],
                    scale: [0.8, 1, 1.1, 1.2, 0.8], // Grow slightly as it floats away
                    y: [40, 0, -20, -40, 40], // Float Upwards continuously
                    rotate: [rotate - 10, rotate, rotate + 10, rotate + 20, rotate - 10],
                    filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)', 'blur(10px)']
                  }
            }
            transition={
                isInteracting
                ? {
                    duration: 0.2,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }
                : {
                    // 10s Infinite Loop
                    duration: 10,
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
