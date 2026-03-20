import type { NextPageProps } from '@/types/next-page-props';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return [];
}

export default async function BlogPaginationPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  const t = await getTranslations({ locale: params.locale as string, namespace: 'BlogPage' });

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8 text-center">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
      </div>
    </div>
  );
}
