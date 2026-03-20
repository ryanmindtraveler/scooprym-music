import { constructMetadata } from '@/lib/metadata';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export const revalidate = false;

interface DocPageProps {
  params: Promise<{
    slug?: string[];
    locale: Locale;
  }>;
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: DocPageProps) {
  const { slug, locale } = await params;
  const pathname = slug?.length ? `/docs/${slug.join('/')}` : '/docs';
  const t = await getTranslations({ locale, namespace: 'DocsPage' });

  return constructMetadata({
    title: t('title'),
    description: t('unavailable'),
    locale,
    pathname,
    noIndex: true,
  });
}

export default async function DocPage({ params }: DocPageProps) {
  await params;
  const t = await getTranslations('DocsPage');

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
      <p className="text-muted-foreground">{t('unavailable')}</p>
    </div>
  );
}
