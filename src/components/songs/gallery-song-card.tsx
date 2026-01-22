'use client';

import { ShareButton } from '@/components/songs/actions/share-button';
import { Badge } from '@/components/ui/badge';
import { LocaleLink } from '@/i18n/navigation';
import { cn, slugify } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Eye, Loader2, Pause, Play } from 'lucide-react';
import Image from 'next/image';

import type { Song } from '@/types/song';

interface GallerySongCardProps {
  item: Song;
  onSelect?: (song: Song) => void;
}

export function GallerySongCard({ item, onSelect }: GallerySongCardProps) {
  const { isPlaying: globalIsPlaying, currentSong, play, pause } = usePlayerStore();
  const isThisSongPlaying = globalIsPlaying && currentSong?.id === item.id;
  const isThisLoading = false;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isThisSongPlaying) {
      pause();
    } else if (item.audioUrl) {
      play({
        id: item.id,
        title: item.title,
        audioUrl: item.audioUrl!,
        coverImageUrl: item.coverImageUrl,
        artist: 'AI Generated',
        newsSummary: item.newsSummary || undefined,
        newsContent: item.sourceText || undefined,
        newsLink: item.sourceUrl || undefined,
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
    if (item.createdAt) {
      formattedDate = format(new Date(item.createdAt), 'MMM d');
    }
  } catch (e) {
    // Fallback
  }

  // Generate SEO-friendly Slug: "song-title-uuid"
  const titleSlug = slugify(item.title || 'song');
  // fallback to just ID if title is empty, but titleSlug usually works.
  // We explicitly want the ID at the end for parsing.
  const songUrl = `/songs/${titleSlug}-${item.id}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="group relative h-full flex flex-col overflow-visible rounded-3xl bg-white shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
        {/* Wrapper for Image Area */}
        <div className="relative aspect-square w-full overflow-hidden rounded-t-3xl bg-zinc-100 dark:bg-zinc-800">
          {/* Use div with onClick if onSelect is present, otherwise Link */}
          {onSelect ? (
            <div onClick={() => onSelect(item)} className="block w-full h-full cursor-pointer relative">
              {item.coverImageUrl ? (
                <Image
                  src={item.coverImageUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="relative size-full bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src="/images/funny-censored-fallback.png"
                    alt="Censored"
                    fill
                    className="object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <span className="bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded backdrop-blur-md uppercase tracking-wider text-center">
                      CONTENT FLAGGED: TOO HOT FOR AI ART
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <LocaleLink href={songUrl} scroll={false} className="block w-full h-full cursor-pointer relative">
              {item.coverImageUrl ? (
                <Image
                  src={item.coverImageUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="relative size-full bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src="/images/funny-censored-fallback.png"
                    alt="Censored"
                    fill
                    className="object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <span className="bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded backdrop-blur-md uppercase tracking-wider text-center">
                      CONTENT FLAGGED: TOO HOT FOR AI ART
                    </span>
                  </div>
                </div>
              )}
            </LocaleLink>
          )}

          {/* OVERLAYS (Outside Link, z-index higher) */}

          {/* Top Toolbar */}
          <div className="absolute top-0 inset-x-0 p-3 z-20 flex justify-between items-start bg-linear-to-b from-black/60 to-transparent pointer-events-none">
            <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0 text-[10px] font-bold px-2 py-0.5 h-6 pointer-events-auto">
              {item.category || 'Music'}
            </Badge>
            <div className="pointer-events-auto">
              <ShareButton
                songId={item.id}
                songTitle={item.title}
                className="size-8 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full border-0"
              />
            </div>
          </div>

          {/* Play Button (Absolute Overlay, outside Link) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            {/* Visual Backdrop only */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-all" />

            <button
              type="button"
              onClick={handlePlayClick}
              disabled={!item.audioUrl}
              className="flex size-14 items-center justify-center rounded-full bg-white text-black shadow-xl hover:scale-110 transition-transform active:scale-95 z-30 pointer-events-auto"
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
            {onSelect ? (
              <div
                onClick={() => onSelect(item)}
                className="block text-left w-full focus:outline-none group/title cursor-pointer"
              >
                <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.2] group-hover:text-pink-600 transition-colors">
                  {item.title}
                </h3>
              </div>
            ) : (
              <LocaleLink
                href={songUrl}
                scroll={false}
                className="block text-left w-full focus:outline-none group/title"
              >
                <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.2] group-hover:text-pink-600 transition-colors">
                  {item.title}
                </h3>
              </LocaleLink>
            )}
          </div>

          {/* Music Meta (Genre / Stats) */}
          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mb-3">
            {/* ... existing stats ... */}
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5 h-3 items-end">
                <div className="w-0.5 h-1.5 bg-pink-500 rounded-full animate-[music-bar_1s_ease-in-out_infinite]" />
                <div className="w-0.5 h-3 bg-pink-500 rounded-full animate-[music-bar_1.2s_ease-in-out_infinite_0.1s]" />
                <div className="w-0.5 h-2 bg-pink-500 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.2s]" />
              </div>
              <span>Audio</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-1">
              <Eye className="size-3" /> {item.plays || 0}
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{formattedDate}</span>
          </div>

          {/* News Snippet - Editorial Quote Style */}
          {/* News Snippet - Editorial Quote Style */}
          {onSelect ? (
            <div
              onClick={() => onSelect(item)}
              className="block text-left w-full focus:outline-none mt-auto group/snippet cursor-pointer"
            >
              <div className="relative pl-3 border-l-2 border-pink-500 hover:border-pink-600 transition-colors">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 group-hover/snippet:text-slate-900 dark:group-hover/snippet:text-slate-200 transition-colors">
                  {description}
                </p>
              </div>
            </div>
          ) : (
            <LocaleLink
              href={songUrl}
              scroll={false}
              className="block text-left w-full focus:outline-none mt-auto group/snippet"
            >
              <div className="relative pl-3 border-l-2 border-pink-500 hover:border-pink-600 transition-colors">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 group-hover/snippet:text-slate-900 dark:group-hover/snippet:text-slate-200 transition-colors">
                  {description}
                </p>
              </div>
            </LocaleLink>
          )}
        </div>
      </div>
    </motion.div>
  );
}
