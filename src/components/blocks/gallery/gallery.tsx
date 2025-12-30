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
import { usePlayerStore } from '@/store/player-store';
import { format } from 'date-fns';
import { ArrowUpRight, Clock, Eye, Loader2, Pause, Play, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { Song } from '@/types/song';

interface GallerySectionProps {
  songs?: Song[];
}

function GallerySongCard({
  item,
  onSongClick,
}: {
  item: Song;
  onSongClick: (song: Song) => void;
}) {
  const { isPlaying: globalIsPlaying, currentSong, play, pause } = usePlayerStore();
  const isThisSongPlaying = globalIsPlaying && currentSong?.id === item.id;
  const isThisLoading = false;

  const handlePlayClick = () => {
    if (isThisSongPlaying) {
      pause();
    } else if (item.audioUrl) {
      play({
        id: item.id,
        title: item.title,
        audioUrl: item.audioUrl,
        coverImageUrl: item.coverImageUrl,
      });
    }
  };

  // Logic to prioritize "News Content"
  const description =
    item.newsSummary ||
    item.sourceText?.replace(/\[[^\]]+\]/gi, '').trim() ||
    item.prompt ||
    'No news content available.';

  let formattedDate = 'Recent';
  try {
    formattedDate = format(new Date(item.createdAt), 'MMM d');
  } catch (e) {
    // Fallback
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="group relative h-full flex flex-col overflow-visible rounded-3xl bg-white shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-gray-100">

        {/* Cover Area */}
        <div className="relative aspect-square w-full overflow-hidden rounded-t-3xl">
          {item.coverImageUrl ? (
             <Image
              src={item.coverImageUrl}
              alt={item.title}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="relative size-full bg-zinc-100">
               <Image
                src="/images/funny-censored-fallback.png"
                alt="Censored"
                fill
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                 <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md uppercase">Top Secret</span>
              </div>
            </div>
          )}

          {/* Top Info Bar (Inside Image) */}
           <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-start bg-linear-to-b from-black/60 to-transparent">
              <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0 text-[10px] font-bold px-2 py-0.5 h-6">
                {item.category || 'Music'}
              </Badge>
              <ShareButton
                songId={item.id}
                className="size-8 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full border-0"
              />
           </div>

          {/* Centered Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={handlePlayClick}
              disabled={!item.audioUrl}
              className="flex size-14 items-center justify-center rounded-full bg-white text-black shadow-xl hover:scale-110 transition-transform active:scale-95"
            >
              {isThisLoading ? (
                <Loader2 className="size-6 animate-spin text-pink-600" />
              ) : isThisSongPlaying ? (
                <Pause className="size-6 fill-current text-pink-600" />
              ) : (
                <Play className="size-6 fill-current ml-1 text-pink-600" />
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col px-5 pt-7 pb-5 relative">
          {/* Title - Clean Editorial Style */}
          <div className="mb-2">
            <button type="button" onClick={() => onSongClick(item)} className="text-left w-full focus:outline-none group/title">
              <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight text-slate-900 leading-[1.2] group-hover:text-pink-600 transition-colors">
                {item.title}
              </h3>
            </button>
          </div>

          {/* Music Meta (Genre / Stats) */}
          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mb-3">
             <div className="flex items-center gap-1">
                <div className="flex gap-0.5 h-3 items-end">
                   <div className="w-0.5 h-1.5 bg-pink-500 rounded-full animate-[music-bar_1s_ease-in-out_infinite]" />
                   <div className="w-0.5 h-3 bg-pink-500 rounded-full animate-[music-bar_1.2s_ease-in-out_infinite_0.1s]" />
                   <div className="w-0.5 h-2 bg-pink-500 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.2s]" />
                </div>
                <span>Audio</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-gray-300" />
             <div className="flex items-center gap-1">
               <Eye className="size-3" /> {item.plays || 0}
             </div>
             <div className="w-1 h-1 rounded-full bg-gray-300" />
             <span>{formattedDate}</span>
          </div>

          {/* News Snippet - Editorial Quote Style */}
          <button
            type="button"
            onClick={() => onSongClick(item)}
            className="block text-left w-full focus:outline-none mt-auto group/snippet"
          >
             <div className="relative pl-3 border-l-2 border-pink-500 hover:border-pink-600 transition-colors">
               <p className="text-[11px] font-medium text-slate-600 leading-relaxed line-clamp-2 group-hover/snippet:text-slate-900 transition-colors">
                {description}
               </p>
             </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

import { SongDetailModal } from '@/components/songs/song-detail-modal';

export default function GallerySection({ songs = [] }: GallerySectionProps) {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

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
      {/* 1. Universal Fluid Mesh Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-100 animate-gradient-xy"
          style={{
            background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
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
