import { websiteConfig } from '@/config/website';
import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getPublicEnglishPath } from '../urls/public-routing';
import { getCanonicalBaseUrl, getImageUrl, getUrlWithLocale } from '../urls/urls';
import { generateAlternates, getCurrentHreflang } from './hreflang';

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
  keywords,
  includeDefaultKeywords,
  includeLanguageAlternates = true,
}: {
  title?: string | { absolute: string };
  description?: string;
  image?: string;
  noIndex?: boolean;
  locale?: Locale;
  pathname?: string;
  keywords?: string[];
  includeDefaultKeywords?: boolean;
  includeLanguageAlternates?: boolean;
} = {}): Metadata {
  const resolvedTitle = title || defaultMessages.Metadata.title;
  const titleString =
    typeof resolvedTitle === 'object' && resolvedTitle !== null && 'absolute' in resolvedTitle
      ? resolvedTitle.absolute
      : resolvedTitle;
  description = description || defaultMessages.Metadata.description;
  image = image || websiteConfig.metadata.images?.ogImage || '/logo.png';
  const ogImageUrl = getImageUrl(image);

  // Generate canonical URL from pathname and locale
  const publicPath = getPublicEnglishPath(pathname || '/');
  const activePathname = publicPath ?? pathname ?? '/';
  if (publicPath !== null) {
    locale = routing.defaultLocale;
    includeLanguageAlternates = false;
  }
  const canonicalUrl = locale ? new URL(getUrlWithLocale(activePathname, locale)).href.replace(/\/$/, '') : undefined;

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

  return {
    title: resolvedTitle,
    description,
    alternates,
    openGraph: {
      type: 'website',
      locale: locale ? getCurrentHreflang(locale).replace('-', '_') : 'en_US',
      url: canonicalUrl,
      title: titleString,
      description,
      siteName: defaultMessages.Metadata.name,
      images: [ogImageUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleString,
      description,
      images: [ogImageUrl.toString()],
      // site: '@ScoopRYM', // Recommended to use a handle, not a URL
    },
    icons: {
      icon: '/logo-icon-f18fb9105029.png',
      shortcut: '/logo-icon-f18fb9105029.png',
      apple: '/logo-apple-b41f3d91418b.png',
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
