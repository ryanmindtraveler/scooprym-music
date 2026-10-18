'use client';

import type { NestedMenuItem } from '@/types';

/**
 * 桌面和移动端共用的公开导航；Logo 负责返回首页。
 */
export function useNavbarLinks(): NestedMenuItem[] {
  return [
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
      title: 'Internet Lore',
      href: '/internet-lore',
      external: false,
    },
  ];
}
