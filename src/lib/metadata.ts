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
    // Core content angles
    'Absurd News Rap',
    'Weird News Rap',
    'Bizarre News Rap',
    'Ridiculous News Rap',
    'Funny News Rap',
    'Gossip Rap',
    'Celebrity Gossip Rap',
    'Entertainment Gossip Rap',
    'Celebrity Rumor Rap',
    'Celebrity Scandal Rap',
    'Social Chaos Rap',
    'Absurd Social Phenomena Rap',
    'Weird Social Behavior Rap',
    'Social Commentary Rap',

    // Emotional expression
    'Roast Rap Songs',
    'Parody Rap Songs',
    'Funny Rap Songs',
    'Satirical Rap Songs',
    'Sarcastic Rap Songs',
    'Gossip Roast Rap',

    // Search-intent long tails
    'Turn Absurd News into Rap',
    'Turn Gossip into a Rap Song',
    'Make a Rap about Weird Social Behavior',
    'Parody Song about Celebrity Scandal',

    // Brand
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
