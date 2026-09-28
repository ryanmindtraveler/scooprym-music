'use client';

import { Disc3 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface SongCoverImageProps {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/** 存储桶封面直接加载，避免图片优化额度耗尽导致 402；其他资源失败时尝试原图。 */
export function SongCoverImage(props: SongCoverImageProps) {
  return <CoverImage key={props.src || 'empty'} {...props} />;
}

function CoverImage({ src, alt, sizes, className, priority = false }: SongCoverImageProps) {
  const [stage, setStage] = useState<'optimized' | 'original' | 'placeholder'>(() => {
    try {
      const url = new URL(src || '');
      return url.protocol === 'https:' && url.hostname.endsWith('.r2.dev') ? 'original' : 'optimized';
    } catch {
      return 'optimized';
    }
  });

  if (!src?.trim() || src === '/images/funny-censored-fallback.png' || stage === 'placeholder') {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 via-violet-950 to-slate-950 ${className || ''}`}
      >
        <Disc3 className="size-1/2 text-violet-300/35" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={stage === 'original'}
      className={className}
      onError={() => setStage((current) => (current === 'optimized' ? 'original' : 'placeholder'))}
    />
  );
}
