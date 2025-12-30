import { constructMetadata } from '@/lib/metadata';
import type { NextPageProps } from '@/types/next-page-props';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Blog Post',
    description: 'Blog post content.',
  };
}

export async function generateStaticParams() {
  return [];
}

export default async function BlogPostPage(props: NextPageProps) {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold">Post Unavailable</h1>
        <p className="mt-4 text-muted-foreground">This blog post is temporarily unavailable.</p>
      </div>
    </div>
  );
}
