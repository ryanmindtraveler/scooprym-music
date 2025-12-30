import { notFound } from 'next/navigation';
import type { NextPageProps } from '@/types/next-page-props';
import type { Metadata } from 'next';

export async function generateStaticParams() {
   return [];
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Blog Category',
    description: 'Category archive.',
  };
}

export default async function BlogCategoryPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8 text-center">
        <h1 className="text-4xl font-bold">Category</h1>
        <p className="text-xl text-muted-foreground">Category archive is temporarily unavailable.</p>
      </div>
    </div>
  );
}
