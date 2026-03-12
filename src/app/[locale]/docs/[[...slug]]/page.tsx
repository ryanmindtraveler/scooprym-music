import { constructMetadata } from '@/lib/metadata';
import type { Locale } from 'next-intl';
import { notFound } from 'next/navigation';

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

  return constructMetadata({
    title: 'Documentation',
    description: 'Documentation is temporarily unavailable.',
    locale,
    pathname,
    noIndex: true,
  });
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug, locale } = await params;
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Documentation</h1>
      <p className="text-muted-foreground">
        Documentation content is temporarily unavailable while we perform system upgrades. Please check back later.
      </p>
    </div>
  );
}
