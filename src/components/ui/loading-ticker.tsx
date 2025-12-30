'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface LoadingTickerProps {
  messages: string[];
  interval?: number;
  className?: string;
}

export function LoadingTicker({ messages, interval = 2500, className }: LoadingTickerProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Reset index when messages change
    setIndex(0);
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      setVisible(false);

      setTimeout(() => {
        // Change text and fade in
        setIndex((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, 300); // 300ms fade out duration

    }, interval);

    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <span
      className={cn(
        "transition-opacity duration-300 inline-block min-w-[140px] text-left",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {messages[index]}
    </span>
  );
}
