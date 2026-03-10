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
import { JsonLd, websiteJsonLd } from '@/components/seo/json-ld';

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
    title: {
      default: t('title'),
      template: `%s | ${t('name')}`,
    },
    description: t('description'),
    keywords: t('keywords', {
      default:
        'absurd news rap, weird news rap, bizarre news rap, ridiculous news rap, funny news rap, gossip rap, celebrity gossip rap, entertainment gossip rap, celebrity rumor rap, celebrity scandal rap, social chaos rap, absurd social phenomena rap, weird social behavior rap, social commentary rap, roast rap songs, parody rap songs, funny rap songs, satirical rap songs, sarcastic rap songs, gossip roast rap, turn absurd news into rap, turn gossip into a rap song, make a rap about weird social behavior, parody song about celebrity scandal',
    }),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: 'https://www.scooprym.app',
      siteName: t('name'),
      locale: locale,
      type: 'website',
      // images: handled automatically by opengraph-image.tsx
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      // images: ['/og-image.png'], // Removed to use dynamic opengraph-image.tsx
    },
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

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Often requested for "app-like" feel, though accessibility warns against it. User asked for "Good UX".
};

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
          'min-h-screen w-full antialiased',
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
              <JsonLd data={websiteJsonLd} />
            </Providers>
          </NextIntlClientProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
