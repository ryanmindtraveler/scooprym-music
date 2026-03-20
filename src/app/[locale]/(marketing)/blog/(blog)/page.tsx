import { constructMetadata } from '@/lib/metadata';
import type { NextPageProps } from '@/types/next-page-props';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const pt = await getTranslations({ locale, namespace: 'BlogPage' });

  return constructMetadata({
    title: 'Blog | ' + t('title'),
    description: pt('description'),
    locale,
    pathname: '/blog',
  });
}

export default async function BlogIndexPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  const t = await getTranslations('BlogPage');

  return (
    <div className="container mx-auto py-32 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
      <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
    </div>
  );
}
