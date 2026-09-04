'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { GallerySongCard } from '@/components/songs/gallery-song-card';
import { SongDetailDialog } from '@/components/songs/song-detail-dialog';
import type { Song } from '@/types/song';

interface GallerySectionProps {
  songs?: Song[];
  initialSelectedSong?: Song | null;
}

// 桌面端每页固定呈现 5 列 × 4 行；较小屏幕沿用响应式列数，但分页总量保持 20。
const GALLERY_PAGE_SIZE = 20;

export default function GallerySection({ songs = [], initialSelectedSong = null }: GallerySectionProps) {
  const t = useTranslations('HomePage.gallery');
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(initialSelectedSong);
  const [currentPage, setCurrentPage] = useState(1);

  const displayItems = songs.length > 0 ? songs : [];
  const totalPages = Math.max(1, Math.ceil(displayItems.length / GALLERY_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * GALLERY_PAGE_SIZE;
  const pageItems = displayItems.slice(pageStart, pageStart + GALLERY_PAGE_SIZE);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === safeCurrentPage) return;

    setCurrentPage(nextPage);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sectionRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative z-20 scroll-mt-16 overflow-hidden bg-[linear-gradient(90deg,#ddd6fe_0%,#fbcfe8_50%,#bae6fd_100%)] px-4 py-24 selection:bg-pink-200 selection:text-pink-900 md:scroll-mt-20 md:py-28"
    >
      {/* Modal for Selected Song (Client Side Only - No URL Change) */}
      {selectedSong && (
        <SongDetailDialog
          song={selectedSong}
          initialIsFavorite={selectedSong.isLiked || false}
          defaultOpen={true}
          navigationMode="manual"
          autoPlay={true}
          onClose={() => setSelectedSong(null)}
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-[2040px] px-4 md:px-8">
        <div className="max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-fit border-b-[5px] border-pink-500 pb-2 text-5xl font-black leading-[0.92] tracking-[-0.065em] text-slate-950 md:text-6xl"
          >
            {t('title')}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-xl text-base font-semibold leading-7 text-slate-700 md:text-lg"
          >
            {t('descriptionLong')}
          </motion.p>
        </div>

        {displayItems.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-slate-900/10 bg-white/55 px-6 py-20 text-center">
            <p className="text-xl font-bold text-slate-600">{t('empty')}</p>
          </div>
        ) : (
          <div
            key={safeCurrentPage}
            className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {pageItems.map((item, index) => (
              <GallerySongCard
                key={item.id}
                item={item}
                onSelect={(song) => setSelectedSong(song)}
                priority={safeCurrentPage === 1 && index < 5}
                queue={displayItems}
              />
            ))}
          </div>
        )}

        {displayItems.length > 0 && (
          <nav
            aria-label={t('pagination.ariaLabel')}
            className="mt-14 flex flex-col gap-5 border-t border-slate-950/15 pt-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm font-bold text-slate-700">
              {t('pagination.showing', {
                start: pageStart + 1,
                end: Math.min(pageStart + GALLERY_PAGE_SIZE, displayItems.length),
                total: displayItems.length,
              })}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-950/15 bg-white/60 px-4 text-sm font-black text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('pagination.previous')}</span>
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  aria-current={page === safeCurrentPage ? 'page' : undefined}
                  aria-label={t('pagination.page', { page })}
                  className={`flex size-11 items-center justify-center rounded-full text-sm font-black shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${
                    page === safeCurrentPage
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-950/15 bg-white/60 text-slate-800 hover:-translate-y-0.5 hover:bg-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-950/15 bg-white/60 px-4 text-sm font-black text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35"
              >
                <span className="hidden sm:inline">{t('pagination.next')}</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}
