'use client';

import { Routes } from '@/routes';
import type { MenuItem } from '@/types';
import { CreditCardIcon, HomeIcon, MusicIcon, Settings2Icon, SparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Get avatar config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://scooprym.com/docs/config/avatar
 *
 * @returns The avatar config with translated titles
 */
export function useAvatarLinks(): MenuItem[] {
  const t = useTranslations('Marketing.avatar');

  return [
    {
      title: t('home'),
      href: Routes.Home,
      icon: <HomeIcon className="size-4 shrink-0" />,
    },
    {
      title: t('create'),
      href: Routes.Create,
      icon: <SparklesIcon className="size-4 shrink-0" />,
    },
    {
      title: t('mySongs'),
      href: Routes.MySongs,
      icon: <MusicIcon className="size-4 shrink-0" />,
    },
    {
      title: t('billing'),
      href: Routes.SettingsBilling,
      icon: <CreditCardIcon className="size-4 shrink-0" />,
    },
    {
      title: t('settings'),
      href: Routes.SettingsProfile,
      icon: <Settings2Icon className="size-4 shrink-0" />,
    },
  ];
}
