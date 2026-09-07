import { constructMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    keywords: [
      'headline song',
      'news song',
      'drama song',
      'gossip song',
      'meme song',
      'funny song',
      'diss track',
      'rap battle',
      'daily meme songs',
      'internet chaos',
      'musical satire',
      'entertainment news',
    ],
    locale,
    pathname: '/',
  });
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
