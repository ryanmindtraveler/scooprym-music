'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { useTranslations } from 'next-intl';
import { websiteConfig } from './website';

/**
 * Get footer config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://scooprym.com/docs/config/footer
 *
 * @returns The footer config with translated titles
 */
export function useFooterLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');
  const tLegal = useTranslations('Marketing.footer.legal');
  const tResources = useTranslations('Marketing.footer.resources');

  return [
    {
      title: t('home.title'),
      items: [
        {
          title: t('home.title'),
          href: Routes.Root,
          external: false,
        },
        {
          title: 'Today’s Drops',
          href: '/#today',
          external: false,
        },
        {
          title: 'The Week on Repeat',
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
      ],
    },

    {
      title: 'Explore',
      items: [
        { title: 'News Parody', href: '/features/news-parody', external: false },
        { title: 'Celebrity Gossip', href: '/features/gossip-roast', external: false },
        { title: 'Entertainment', href: '/features/entertainment-topics', external: false },
        { title: 'Absurd Headlines', href: '/features/absurd-social-phenomena', external: false },
        { title: 'Meme Culture', href: '/features/meme-culture', external: false },
        { title: 'Comedy Drill', href: '/features/comedy-drill', external: false },
      ],
    },
    {
      title: tLegal('title'),
      items: [
        {
          title: tLegal('items.cookiePolicy'),
          href: Routes.CookiePolicy,
          external: false,
        },
        {
          title: tLegal('items.privacyPolicy'),
          href: Routes.PrivacyPolicy,
          external: false,
        },
        {
          title: tLegal('items.termsOfService'),
          href: Routes.TermsOfService,
          external: false,
        },
        {
          title: tLegal('items.companyEmail'),
          href: 'mailto:support@scooprym.app',
          external: true,
        },
      ],
    },
  ];
}
