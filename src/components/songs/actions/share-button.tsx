'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  songId: string;
  className?: string;
  variant?: 'ghost' | 'secondary' | 'outline' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({ songId, className, variant = 'ghost', size = 'icon' }: ShareButtonProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const url = `${window.location.origin}/songs/${songId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('rounded-full transition-colors', 'hover:bg-primary/10 hover:text-primary', className)}
      onClick={handleShare}
      aria-label="Share song"
    >
      <Share2 className="size-4" />
    </Button>
  );
}
