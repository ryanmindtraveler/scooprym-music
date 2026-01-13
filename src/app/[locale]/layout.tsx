import { Analytics } from '@/analytics/analytics';
import { fontBricolageGrotesque, fontNotoSans, fontNotoSansMono, fontNotoSerif } from '@/assets/fonts';
import AffonsoScript from '@/components/affiliate/affonso';
import PromotekitScript from '@/components/affiliate/promotekit';
import { TailwindIndicator } from '@/components/layout/tailwind-indicator';
import { GlobalPlayer } from '@/components/player/global-player';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { type Locale, NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { Providers } from './providers';

import '@/styles/globals.css';

interface LocaleLayoutProps {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: Locale }>;
}



/**
 * GENERATE METADATA (SEO)
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    metadataBase: new URL('https://www.scooprym.app'),
    alternates: {
      canonical: '/',
      languages: {
        'en': '/en',
        'zh': '/zh',
      },
    },
    title: {
      default: t('title'),
      template: `%s | ${t('name')}`,
    },
    description: t('description'),
    appleWebApp: {
        title: t('name'),
        statusBarStyle: 'default',
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
  };
}

/**
 * 1. Locale Layout
 * https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#layout
 *
 * 2. NextIntlClientProvider
 * https://next-intl.dev/docs/usage/configuration#nextintlclientprovider
 */
export default async function LocaleLayout({ children, modal, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html suppressHydrationWarning lang={locale}>
      <head>
        <AffonsoScript />
        <PromotekitScript />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          'size-full antialiased',
          fontNotoSans.className,
          fontNotoSerif.variable,
          fontNotoSansMono.variable,
          fontBricolageGrotesque.variable
        )}
      >
        <NuqsAdapter>
          <NextIntlClientProvider messages={messages}>
            <Providers locale={locale}>
              {children}
              {modal}

              <GlobalPlayer />
              <Toaster richColors position="top-right" offset={64} />
              <TailwindIndicator />
              <Analytics />
            </Providers>
          </NextIntlClientProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
