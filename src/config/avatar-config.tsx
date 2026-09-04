'use client';

import { Routes } from '@/routes';
import type { MenuItem } from '@/types';
import { UserRoundIcon } from 'lucide-react';

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
  return [
    {
      title: 'My Page',
      href: Routes.Dashboard,
      icon: <UserRoundIcon className="size-4 shrink-0" />,
    },
  ];
}
