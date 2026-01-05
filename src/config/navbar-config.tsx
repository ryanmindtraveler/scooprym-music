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
      title: t('gallery.title'),
      href: Routes.Gallery,
      external: false,
    },
    {
      title: t('features.title'),
      href: Routes.Features,
      external: false,
    },
    {
      title: t('pricing.title'),
      href: Routes.Pricing,
      external: false,
    },
    {
      title: t('faq.title'),
      href: Routes.FAQ,
      external: false,
    },
    // {
    //   // removed per request: Login menu from navbar list
    // },
  ];
}
