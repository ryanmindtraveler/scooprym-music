import type { NextPageProps } from '@/types/next-page-props';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: NextPageProps): Promise<Metadata> {
  const params = await props.params;
  if (!params) {
    return {};
  }

  const locale = params.locale as string;
  const t = await getTranslations({ locale, namespace: 'BlogPage' });

  return constructMetadata({
    title: t('categoryTitle'),
    description: t('categoryUnavailable'),
    locale,
    pathname: '/blog/category',
    noIndex: true,
  });
}

export default async function BlogCategoryPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  const t = await getTranslations({ locale: params.locale as string, namespace: 'BlogPage' });

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8 text-center">
        <h1 className="text-4xl font-bold">{t('categoryTitle')}</h1>
        <p className="text-xl text-muted-foreground">{t('categoryUnavailable')}</p>
      </div>
    </div>
  );
}
