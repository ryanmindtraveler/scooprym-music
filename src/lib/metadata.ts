import { websiteConfig } from '@/config/website';
import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { generateAlternates, getCurrentHreflang } from './hreflang';
import { getCanonicalBaseUrl, getImageUrl, getUrlWithLocale } from './urls/urls';

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
  includeDefaultKeywords = true,
  includeLanguageAlternates = true,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  locale?: Locale;
  pathname?: string;
  keywords?: string[];
  includeDefaultKeywords?: boolean;
  includeLanguageAlternates?: boolean;
} = {}): Metadata {
  title = title || defaultMessages.Metadata.title;
  description = description || defaultMessages.Metadata.description;
  image = image || websiteConfig.metadata.images?.ogImage || '/logo.png';
  const ogImageUrl = getImageUrl(image);

  // Generate canonical URL from pathname and locale
  const activePathname = pathname || '/';
  const canonicalUrl = locale ? getUrlWithLocale(activePathname, locale).replace(/\/$/, '') : undefined;

  // Generate hreflang alternates if we have multiple locales
  const alternates =
    includeLanguageAlternates && routing.locales.length > 1
      ? {
          canonical: canonicalUrl,
          ...generateAlternates(activePathname as any),
        }
      : canonicalUrl
        ? { canonical: canonicalUrl }
        : undefined;

  const defaultKeywords = [
    'Headline Song',
    'News Song',
    'Drama Song',
    'Gossip Song',
    'Meme Song',
    'Comedy Song',
    'Funny Song',
    'Diss Track',
    'Battle Song',
    'Rap Battle',
    'AI Song Generator',
    'Text to Song',
    'Song Generator',
    'Diss Track Generator',
    'Meme Song Generator',
    'ScoopRYM',
  ];

  return {
    title,
    description,
    keywords: includeDefaultKeywords ? [...defaultKeywords, ...keywords] : keywords.length > 0 ? keywords : undefined,
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
      // site: '@ScoopRYM', // Recommended to use a handle, not a URL
    },
    icons: {
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/logo.png',
    },
    metadataBase: new URL(getCanonicalBaseUrl()),
    manifest: `${getCanonicalBaseUrl()}/manifest.webmanifest`,
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
