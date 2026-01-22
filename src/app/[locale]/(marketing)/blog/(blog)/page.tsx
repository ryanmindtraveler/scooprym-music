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

  return constructMetadata({
    title: 'Blog | ' + t('title'),
    description: 'Latest updates and stories from Scooprym Music.',
    locale,
    pathname: '/blog',
  });
}

export default async function BlogIndexPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  return (
    <div className="container mx-auto py-32 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Blog</h1>
      <p className="text-xl text-muted-foreground">Temporarily unavailable. Check back soon!</p>
    </div>
  );
}
