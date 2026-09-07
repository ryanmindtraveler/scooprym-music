'use client';

import { Button } from '@/components/ui/button';
import { createEngagementSessionId, recordSongEngagement } from '@/lib/songs/song-engagement-client';
import { getCanonicalBaseUrl } from '@/lib/urls/urls';
import { cn, slugify } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  songId: string;
  songTitle: string;
  className?: string;
  variant?: 'ghost' | 'secondary' | 'outline' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({ songId, songTitle, className, variant = 'ghost', size = 'icon' }: ShareButtonProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const slug = slugify(songTitle || 'song');

    // Construct simplified canonical URL (no locale prefix usually preferred for sharing,
    // but app logic seems to use current locale. Let's stick to simple root-relative for now
    // or respect window location if needed.
    // Actually, usually beneficial to share generic URL and let middleware handle locale.
    // User requested "SEO friendly", standard is usually /songs/slug.
    // Let's grab origin + /songs/...

    const url = `${getCanonicalBaseUrl()}/songs/${slug}-${songId}`;
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
