'use client';

import { Button } from '@/components/ui/button';
import { useActionPermission } from '@/hooks/auth/use-permission';
import { cn } from '@/lib/utils';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DownloadButtonProps {
  audioUrl?: string | null;
  title: string;
  className?: string; // Allow custom styling
  variant?: 'ghost' | 'secondary' | 'outline' | 'default'; // Allow variant override
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DownloadButton({ audioUrl, title, className, variant = 'ghost', size = 'icon' }: DownloadButtonProps) {
  const { checkDownload } = useActionPermission();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Permission check
    if (!checkDownload()) return;

    if (!audioUrl) {
      toast.error('No audio source available');
      return;
    }

    try {
      setIsDownloading(true);
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // sanitize filename
      const validTitle = (title || 'song').replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_').toLowerCase();
      link.download = `${validTitle}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download song');
    } finally {
      setIsDownloading(false);
    }
  };

  const isDisabled = !audioUrl || isDownloading;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'rounded-full transition-colors',
        !isDisabled && 'hover:bg-primary/10 hover:text-primary',
        className
      )}
      onClick={handleDownload}
      disabled={isDisabled}
      aria-label="Download song"
    >
      {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
    </Button>
  );
}
