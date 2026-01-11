'use client';

import { Check, Copy, Share2, Twitter } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  title?: string;
  description?: string;
  url?: string;
  tags?: string[];
  className?: string;
}

export function SocialShare({
  title = 'My AI Music Creation',
  description = 'Check out this song I generated with Scooprym Music!',
  url,
  tags = ['AIMusic', 'Scooprym'],
  className,
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fallback to current window URL if not provided
  const shareUrl = typeof window !== 'undefined' ? url || window.location.href : '';
  const shareText = `${title}\n${description}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('复制失败');
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'reddit') => {
    let href = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedTags = tags.join(',');

    switch (platform) {
      case 'twitter':
        href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}&hashtags=${encodedTags}`;
        break;
      case 'facebook':
        href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'reddit':
        href = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
        break;
    }

    if (href) {
      window.open(href, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <Share2 className="size-4" />
          分享
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享歌曲</DialogTitle>
          <DialogDescription>将这首歌曲分享给你的朋友或者社交网络。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Quick Share Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 border-none"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="size-5 fill-current" />
            </Button>
            {/* Add more icons as needed */}
          </div>

          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input id="link" defaultValue={shareUrl} readOnly className="h-9 font-mono text-sm bg-muted/50" />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
              {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
