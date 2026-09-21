'use client';

import { Routes } from '@/routes';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowUpRight, MessageSquareText, Music2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

export interface CommentHistoryItem {
  id: string;
  content: string;
  createdAt: Date | string;
  songId: string;
  songTitle: string;
  coverImageUrl: string | null;
  newsSummary: string | null;
  sourceText: string | null;
}

interface CommentHistoryListProps {
  comments: CommentHistoryItem[];
  startIndex?: number;
}

export function CommentHistoryList({ comments, startIndex = 0 }: CommentHistoryListProps) {
  const t = useTranslations('Dashboard.activity');
  const dateLocale = enUS;
  if (comments.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 text-center shadow-sm backdrop-blur-lg">
        <div className="flex size-14 items-center justify-center rounded-full bg-pink-100 text-pink-700">
          <MessageSquareText className="size-7" />
        </div>
        <h3 className="mt-5 text-xl font-black text-slate-900">{t('noComments')}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{t('commentHint')}</p>
        <Link
          href={Routes.Gallery}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          {t('exploreGallery')} <ArrowUpRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/78 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.5)] backdrop-blur-xl">
      <div className="hidden grid-cols-[42px_68px_minmax(0,1fr)_minmax(220px,0.65fr)_150px_46px] items-center gap-4 border-b border-slate-200/80 bg-slate-50/75 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 lg:grid">
        <span>{t('number')}</span>
        <span>{t('cover')}</span>
        <span>{t('yourComment')}</span>
        <span>{t('storyAndSong')}</span>
        <span>{t('commented')}</span>
        <span className="sr-only">{t('openSong')}</span>
      </div>

      <ol className="divide-y divide-slate-200/75">
        {comments.map((comment, index) => {
          const songUrl = `/songs/${comment.songId}`;
          const context = comment.newsSummary?.trim() || comment.sourceText?.trim() || t('openStory');
          const commentedAt = new Date(comment.createdAt);

          return (
            <li
              key={comment.id}
              className="group grid grid-cols-[62px_minmax(0,1fr)_44px] items-center gap-3 px-4 py-4 transition-colors hover:bg-pink-50/45 lg:grid-cols-[42px_68px_minmax(0,1fr)_minmax(220px,0.65fr)_150px_46px] lg:gap-4 lg:px-5"
            >
              <span className="hidden font-mono text-xs font-black text-pink-500 lg:block">
                {String(startIndex + index + 1).padStart(2, '0')}
              </span>

              <Link
                href={songUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative size-[62px] overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-900/5 lg:size-[68px]"
              >
                <Image
                  src={comment.coverImageUrl || '/images/funny-censored-fallback.png'}
                  alt=""
                  fill
                  sizes="68px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              <div className="min-w-0">
                <p className="line-clamp-3 text-sm font-bold leading-5 text-slate-900 md:text-[15px]">
                  “{comment.content}”
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-slate-400 lg:hidden">
                  {formatDistanceToNow(commentedAt, { addSuffix: true, locale: dateLocale })}
                </p>
              </div>

              <div className="hidden min-w-0 lg:block">
                <Link
                  href={songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 text-xs font-semibold leading-5 text-slate-600 transition-colors hover:text-pink-700"
                >
                  {context}
                </Link>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-400">
                  <Music2 className="size-3 shrink-0 text-pink-600" />
                  <span className="truncate font-semibold">{comment.songTitle}</span>
                </div>
              </div>

              <div className="hidden lg:block">
                <p className="text-sm font-bold text-slate-700">
                  {formatDistanceToNow(commentedAt, { addSuffix: true, locale: dateLocale })}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  {format(commentedAt, 'MMM d, h:mm a', { locale: dateLocale })}
                </p>
              </div>

              <Link
                href={songUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('openNamedSong', { title: comment.songTitle })}
                className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:scale-105 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
