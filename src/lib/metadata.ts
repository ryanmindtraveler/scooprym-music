import { websiteConfig } from '@/config/website';
import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { generateAlternates, getCurrentHreflang } from './hreflang';
import { getBaseUrl, getImageUrl, getUrlWithLocale } from './urls/urls';

/**
 * Construct the metadata object for the current page (in docs/guides)
 */
export function constructMetadata({
  title,
  description,
  image,
  noIndex = false,
  locale,
  pathname,
  keywords = [],
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  locale?: Locale;
  pathname?: string;
  keywords?: string[];
} = {}): Metadata {
  title = title || defaultMessages.Metadata.title;
  description = description || defaultMessages.Metadata.description;
  image = image || websiteConfig.metadata.images?.ogImage;
  const ogImageUrl = getImageUrl(image || '');

  // Generate canonical URL from pathname and locale
  const canonicalUrl = locale ? getUrlWithLocale(pathname || '', locale).replace(/\/$/, '') : undefined;

  // Generate hreflang alternates if pathname is provided and we have multiple locales
  const alternates =
    pathname && routing.locales.length > 1
      ? {
          canonical: canonicalUrl,
          ...generateAlternates(pathname),
        }
      : canonicalUrl
        ? { canonical: canonicalUrl }
        : undefined;

  const defaultKeywords = [
    // Core positioning
    'AI Rap Songs',
    'AI Rap Generator',
    'AI Rap Song Generator',
    'Headline Rap Generator',
    'AI Headline Rap Generator',
    'Entertainment Rap Generator',
    'AI Entertainment Rap Generator',
    'Gossip Rap Generator',
    'AI Gossip Rap Generator',
    'Parody Rap Songs',
    'AI Parody Rap Songs',
    'Comedy Rap Songs',
    'AI Comedy Rap Songs',
    'Viral Rap Songs',
    'AI Viral Rap Songs',
    'Diss Track Generator',
    'AI Diss Track Generator',
    'Roast Song Generator',
    'AI Roast Song Generator',

    // Content angles
    'Headlines to Rap',
    'AI Headlines to Rap',
    'News to Rap',
    'AI News to Rap',
    'Celebrity Gossip Rap',
    'AI Celebrity Gossip Rap',
    'Trending Topic Rap',
    'AI Trending Topic Rap',
    'Satirical Rap Songs',
    'AI Satirical Rap Songs',
    'Meme Rap',
    'AI Meme Rap',

    // Style and brand
    'Trap Rap',
    'Drill Rap',
    'Hip Hop Parody',
    'AI Roast Songs',
    'ScoopRYM',
  ];

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    alternates,
    openGraph: {
      type: 'website',
      locale: locale ? getCurrentHreflang(locale).replace('-', '_') : 'en_US',
      url: canonicalUrl,
      title,
      description,
      siteName: defaultMessages.Metadata.name,
      images: [ogImageUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl.toString()],
      site: getBaseUrl(),
    },
    icons: {
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/logo.png',
    },
    metadataBase: new URL(getBaseUrl()),
    manifest: `${getBaseUrl()}/manifest.webmanifest`,
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
