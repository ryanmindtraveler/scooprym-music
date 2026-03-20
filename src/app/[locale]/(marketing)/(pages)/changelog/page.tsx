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
  const pt = await getTranslations({ locale, namespace: 'ChangelogPage' });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: pt('description'),
    locale,
    pathname: '/changelog',
  });
}

export default async function ChangelogPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  const t = await getTranslations('ChangelogPage');

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-center text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-center text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="mt-8 text-center text-muted-foreground">
          <p>{t('subtitle')}</p>
        </div>
      </div>
    </div>
  );
}
