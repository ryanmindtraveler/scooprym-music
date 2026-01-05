import { getMDXComponents } from '@/components/docs/mdx-components';
import { pagesSource } from '@/lib/source';
import type { NextPageProps } from '@/types/next-page-props';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = pagesSource.getPage(['privacy-policy'], locale as string);

  if (!page) {
    return {
      title: 'Privacy Policy',
      description: 'Privacy Policy for Scooprym Music',
    };
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function PrivacyPolicyPage(props: NextPageProps) {
  const locale = await getLocale();
  const page = pagesSource.getPage(['privacy-policy'], locale as string);

  if (!page) {
    notFound();
  }

  const MDX = (page.data as any).body;

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{page.data.title}</h1>
        {page.data.description && (
          <p className="text-lg text-muted-foreground">{page.data.description}</p>
        )}
      </div>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <MDX components={getMDXComponents()} />
      </article>
    </div>
  );
}
