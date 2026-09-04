'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { HeartIcon, MessageSquareTextIcon, UserRoundIcon, VoteIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Get sidebar config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://scooprym.com/docs/config/sidebar
 *
 * @returns The sidebar config with translated titles and descriptions
 */
export function useSidebarLinks(): NestedMenuItem[] {
  const t = useTranslations('Dashboard.navigation');

  return [
    {
      title: t('myPage'),
      icon: <UserRoundIcon className="size-4 shrink-0" />,
      href: Routes.Dashboard,
      external: false,
    },
    {
      title: t('myComments'),
      icon: <MessageSquareTextIcon className="size-4 shrink-0" />,
      href: Routes.DashboardComments,
      external: false,
    },
    {
      title: t('myVotes'),
      icon: <VoteIcon className="size-4 shrink-0" />,
      href: Routes.DashboardVotes,
      external: false,
    },
    {
      title: t('savedSongs'),
      icon: <HeartIcon className="size-4 shrink-0" />,
      href: Routes.DashboardSaved,
      external: false,
    },
  ];
}
