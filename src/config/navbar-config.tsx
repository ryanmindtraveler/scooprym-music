'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { useTranslations } from 'next-intl';

/**
 * Get navbar config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://scooprym.com/docs/config/navbar
 *
 * @returns The navbar config with translated titles and descriptions
 */
export function useNavbarLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');

  return [
    {
      title: t('home.title'),
      href: Routes.Root,
      external: false,
    },
    {
      title: 'Today',
      href: '/#today',
      external: false,
    },
    {
      title: 'Weekly Hits',
      href: '/#biggest',
      external: false,
    },
    {
      title: 'Gallery',
      href: '/songs',
      external: false,
    },
    {
      title: 'Send a Story',
      href: '/#desk',
      external: false,
    },
  ];
}
