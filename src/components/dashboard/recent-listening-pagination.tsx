'use client';

import { LocaleLink } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RecentListeningPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  ariaLabel?: string;
}

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

function pageHref(page: number, basePath: string) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export function RecentListeningPagination({
  currentPage,
  totalPages,
  basePath = Routes.Dashboard,
  ariaLabel = 'Listening history pages',
}: RecentListeningPaginationProps) {
  const t = useTranslations('Dashboard.activity');
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav aria-label={ariaLabel} className="mt-6 flex flex-col items-center justify-between gap-4 px-1 sm:flex-row">
      <p className="text-xs font-bold text-slate-500">{t('page', { current: currentPage, total: totalPages })}</p>

      <div className="flex items-center gap-1.5">
        <LocaleLink
          href={pageHref(Math.max(1, currentPage - 1), basePath)}
          aria-disabled={currentPage === 1}
          className={`flex size-10 items-center justify-center rounded-full border bg-white text-slate-700 shadow-sm transition ${
            currentPage === 1
              ? 'pointer-events-none border-slate-100 opacity-35'
              : 'border-slate-200 hover:-translate-y-0.5 hover:border-pink-300 hover:text-pink-700'
          }`}
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">{t('previousPage')}</span>
        </LocaleLink>

        {visiblePages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex size-9 items-center justify-center text-slate-400"
              aria-hidden="true"
            >
              <MoreHorizontal className="size-4" />
            </span>
          ) : (
            <LocaleLink
              key={page}
              href={pageHref(page, basePath)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`flex size-10 items-center justify-center rounded-full text-sm font-black transition ${
                page === currentPage
                  ? 'bg-slate-950 text-white shadow-[0_8px_22px_-10px_rgba(15,23,42,0.9)]'
                  : 'border border-transparent text-slate-600 hover:border-pink-200 hover:bg-white hover:text-pink-700'
              }`}
            >
              {page}
            </LocaleLink>
          )
        )}

        <LocaleLink
          href={pageHref(Math.min(totalPages, currentPage + 1), basePath)}
          aria-disabled={currentPage === totalPages}
          className={`flex size-10 items-center justify-center rounded-full border bg-white text-slate-700 shadow-sm transition ${
            currentPage === totalPages
              ? 'pointer-events-none border-slate-100 opacity-35'
              : 'border-slate-200 hover:-translate-y-0.5 hover:border-pink-300 hover:text-pink-700'
          }`}
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">{t('nextPage')}</span>
        </LocaleLink>
      </div>
    </nav>
  );
}
