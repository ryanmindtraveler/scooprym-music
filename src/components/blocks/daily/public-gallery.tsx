'use client';

import { GallerySongCard } from '@/components/songs/gallery-song-card';
import { LocaleLink } from '@/i18n/navigation';
import { getAllTimeBiggestDrops } from '@/lib/songs/song-editorial';
import type { Song } from '@/types/song';
import { ArrowRight } from 'lucide-react';

interface PublicGalleryProps {
  songs: Song[];
}

export function PublicGallery({ songs }: PublicGalleryProps) {
  const biggestDropIds = new Set(getAllTimeBiggestDrops(songs.slice(4)).map((song) => song.id));
  // Archive 排除今日四条和累计播放榜内容，避免同一新闻在首页重复出现。
  // 最多展示 18 条，让内容平台具备持续浏览感，同时控制首页图片与音频元数据负载。
  const gallerySongs = songs
    .slice(4)
    .filter((song) => !biggestDropIds.has(song.id))
    .slice(0, 18);

  return (
    <section
      id="gallery"
      className="relative z-20 scroll-mt-20 overflow-visible bg-[#fffdf8] px-4 py-20 md:px-6 md:py-28 2xl:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.26] [background-image:radial-gradient(rgba(32,26,41,0.18)_0.65px,transparent_0.65px)] [background-size:7px_7px]"
      />
      <div className="relative z-10 mx-auto max-w-[1760px]">
        <div className="relative pb-7">
          <h2 className="w-fit border-b-[5px] border-[#ef287c] pb-1 text-4xl font-black leading-[0.92] tracking-[-0.065em] text-[#201a29] md:text-5xl">
            Gallery
          </h2>
          <p className="mt-4 max-w-2xl text-[0.98rem] font-medium leading-7 text-[#45415a]">
            Curated chaos. Reported stories, funny songs, and the original receipts.
          </p>
        </div>

        <div className="relative mt-9 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-12">
          {gallerySongs.map((song, index) => (
            <GallerySongCard key={song.id} item={song} priority={index < 4} />
          ))}
          {gallerySongs.length === 0 && (
            <div className="border border-[#201a29]/12 bg-[#fffdf9] p-10 text-[#45415a] shadow-[0_20px_50px_rgba(32,26,41,0.07)]">
              The archive will open as soon as the first illustrated Drop is published.
            </div>
          )}
        </div>

        {gallerySongs.length > 0 && (
          <div className="mt-14 border-t border-[#201a29]/20 pt-6">
            <LocaleLink
              href="/songs"
              className="group inline-flex items-center gap-2 text-sm font-black text-[#201a29] transition hover:text-[#d80d63]"
            >
              Browse the full story archive
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </LocaleLink>
          </div>
        )}
      </div>
    </section>
  );
}
