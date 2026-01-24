'use client';

import { SongDetailView } from '@/components/songs/song-detail-view';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

import type { Song } from '@/types/song';

interface SongDetailDialogProps {
  song: Song;
  initialIsFavorite: boolean;
  defaultOpen?: boolean;
  navigationMode?: 'intercept' | 'hard' | 'manual';
  onClose?: () => void;
  autoPlay?: boolean;
  hideActions?: boolean;
}

export function SongDetailDialog({
  song,
  initialIsFavorite,
  defaultOpen = true,
  navigationMode = 'intercept',
  onClose,
  autoPlay = false,
  hideActions = false,
}: SongDetailDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      if (navigationMode === 'intercept') {
        router.back();
      } else if (navigationMode === 'hard') {
        // Hard navigation exit logic: Return to Home
        // For Scenario 3: "Direct link access ... jumps to marketing home"
        router.push('/');
      }
      // 'manual' mode does nothing, parent controls state
    }

    // Call external onClose if provided (regardless of mode, but mostly for manual)
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] w-[95vw] sm:w-[85vw] h-[80vh] max-h-[800px] p-0 gap-0 bg-transparent border-none shadow-none outline-none overflow-hidden">
        <DialogTitle className="sr-only">{song.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Detailed view for song {song.title}, including player, lyrics, and metadata.
        </DialogDescription>
        <div className="h-full bg-background/95 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl">
          <SongDetailView
            song={song}
            initialIsFavorite={initialIsFavorite}
            onClose={() => onOpenChange(false)}
            autoPlay={autoPlay}
            hideActions={hideActions}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
