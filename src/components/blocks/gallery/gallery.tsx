'use client';

import { ShareButton } from '@/components/songs/actions/share-button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useActionPermission } from '@/hooks/auth/use-permission';
import { useSongLike } from '@/hooks/songs/use-song-like';
import { authClient } from '@/lib/auth-client';
// import { LocaleLink, useLocaleRouter } from '@/i18n/navigation'; // causing error
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { usePlayerStore } from '@/store';
import { format } from 'date-fns';
import { ArrowUpRight, Clock, Eye, Loader2, Pause, Play, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { GallerySongCard } from '@/components/songs/gallery-song-card';
import type { Song } from '@/types/song';

interface GallerySectionProps {
  songs?: Song[];
  initialSelectedSong?: Song | null;
}



import { SongDetailModal } from '@/components/songs/song-detail-modal';

export default function GallerySection({ songs = [], initialSelectedSong = null }: GallerySectionProps) {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(initialSelectedSong);

  // Load favorites for initial state of heart icons
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data?.user) return;

        const res = await fetch('/api/songs/favorites');
        if (!res.ok) return;

        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setFavoriteIds(data.data.map((item: { songId?: string }) => item.songId).filter(Boolean));
        }
      } catch {
        // ignore
      }
    };

    void loadFavorites();
  }, []);

  // Use passed songs or empty array if none
  const displayItems = songs.length > 0 ? songs : [];

  const handleShowMoreClick = () => {
    router.push(Routes.Home);
  };

  return (
    <section
      id="gallery"
      className="relative z-20 px-4 pt-32 pb-32 md:pt-48 md:pb-48 overflow-visible selection:bg-pink-200 selection:text-pink-900"
    >
      {/* 1. Static Gradient Background (Cyan -> Pink) - Matching User Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background: 'linear-gradient(90deg, #38bdf8 0%, #e11d48 100%)', // Sky Blue -> Rose Red
          }}
        />
      </div>

      {/* 2. Gentle Liquid Wave Glass Background Layer */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-90 mix-blend-normal"
        style={{
          top: '0',
          bottom: '0',
        }}
      >
        <div className="relative w-full h-full backdrop-blur-3xl">
          {/* Top Wave */}
          <div
            className="absolute left-0 w-full overflow-hidden leading-0
                            top-[-39px] h-[40px]
                            md:top-[-99px] md:h-[100px]"
          >
            <svg
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              className="block w-[calc(100%+1.3px)] h-full"
            >
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>

          {/* Middle Block: Solid White */}
          <div className="absolute inset-0 bg-white" />

          {/* Bottom Wave (Rotated 180) */}
          <div
            className="absolute left-0 w-full overflow-hidden leading-0 transform rotate-180
                            bottom-[-39px] h-[40px]
                            md:bottom-[-99px] md:h-[100px]"
          >
            <svg
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              className="block w-[calc(100%+1.3px)] h-full"
            >
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1800px] px-4 md:px-8 space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-gray-200 shadow-sm text-sm font-bold tracking-widest text-gray-500 mb-2"
          >
            <TrendingUp className="w-4 h-4 text-pink-500" />
            <span>Community Heat</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-gray-900 via-gray-700 to-gray-900 drop-shadow-sm pb-2"
          >
            Trending{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-violet-500">Tracks</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl font-medium text-gray-600 max-w-2xl mx-auto"
          >
            Check out what our community is creating from today's hottest topics.
          </motion.p>
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-3xl">
            <p className="text-2xl font-bold text-gray-400">No trending music yet. Be the first to create!</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayItems.map((item, index) => (
              <GallerySongCard key={item.id} item={item} onSongClick={setSelectedSong} />
            ))}
          </div>
        )}

        <div className="text-center pt-8">
          <button
            type="button"
            onClick={handleShowMoreClick}
            className="inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Show Me More
          </button>
        </div>
      </div>

      {/* Manual Modal */}
      {selectedSong && (
        <SongDetailModal
          key={selectedSong.id}
          song={selectedSong}
          initialIsFavorite={favoriteIds.includes(selectedSong.id)}
          defaultOpen={true}
          navigationMode="manual"
          onClose={() => setSelectedSong(null)}
          hideActions={true}
        />
      )}
    </section>
  );
}
