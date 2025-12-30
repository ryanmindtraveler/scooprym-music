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
 * https://mksaas.com/docs/config/footer
 *
 * @returns The footer config with translated titles
 */
export function useFooterLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');
  const tLegal = useTranslations('Marketing.footer.legal');

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
      ],
    },
  ];
}
