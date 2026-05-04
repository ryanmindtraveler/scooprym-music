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
import { getCanonicalBaseUrl } from '@/lib/urls/urls';

import '@/styles/globals.css';
import { getWebsiteJsonLd, JsonLd } from '@/components/seo/json-ld';

interface LocaleLayoutProps {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: Locale }>;
}

/**
 * GENERATE METADATA (SEO)
 */
export async function generateMetadata({ params }: LocaleLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    metadataBase: new URL(getCanonicalBaseUrl()),
    title: {
      default: t('title'),
      template: `%s | ${t('name')}`,
    },
    description: t('description'),
    keywords: t('keywords', {
      default:
        'headline song, news song, drama song, gossip song, meme song, comedy song, funny song, diss track, battle song, rap battle, AI song generator, text to song, song generator, diss track generator, meme song generator',
    }),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: 'https://scooprym.app',
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
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const websiteJsonLd = getWebsiteJsonLd({
    name: t('title'),
    description: t('description'),
    url: getCanonicalBaseUrl(),
  });

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
