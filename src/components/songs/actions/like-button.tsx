'use client';

import { Button } from '@/components/ui/button';
import { useActionPermission } from '@/hooks/auth/use-permission';
import { useSongLike } from '@/hooks/songs/use-song-like';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  songId: string;
  initialIsLiked?: boolean; // Optional, but recommended for avoiding layout shift
  className?: string;
  variant?: 'ghost' | 'secondary' | 'outline' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LikeButton({
  songId,
  initialIsLiked = false,
  className,
  variant = 'ghost',
  size = 'icon',
}: LikeButtonProps) {
  const { checkLike } = useActionPermission();
  const { isLiked, toggleLike, isLoading } = useSongLike({
    songId: songId,
    initialIsLiked,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (checkLike()) {
      toggleLike();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'rounded-full transition-colors',
        !isLiked && 'text-muted-foreground hover:text-foreground',
        className,
        isLiked && 'text-red-500 hover:text-red-400'
      )}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isLiked ? 'Unlike song' : 'Like song'}
    >
      <Heart className={cn('size-4', isLiked && 'fill-current')} />
    </Button>
  );
}
