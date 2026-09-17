'use client';

import { Button } from '@/components/ui/button';
import { createEngagementSessionId, recordSongEngagement } from '@/lib/songs/song-engagement-client';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import { getCanonicalBaseUrl } from '@/lib/urls/urls';
import { cn } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  songId: string;
  songTitle: string;
  newsSummary?: string | null;
  sourceText?: string | null;
  className?: string;
  variant?: 'ghost' | 'secondary' | 'outline' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({
  songId,
  songTitle,
  newsSummary,
  sourceText,
  className,
  variant = 'ghost',
  size = 'icon',
}: ShareButtonProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // 分享链接与详情页、站点地图使用同一规范地址。
    const slug = getSongCanonicalSlug({ id: songId, title: songTitle, newsSummary, sourceText });
    const url = `${getCanonicalBaseUrl()}/songs/${slug}`;
    navigator.clipboard.writeText(url);
    void recordSongEngagement(songId, 'share', createEngagementSessionId('share')).catch(() => {});
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
