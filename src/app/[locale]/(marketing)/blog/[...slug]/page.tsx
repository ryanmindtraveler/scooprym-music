import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { blogSource } from '@/lib/source';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    slug?: string[];
    locale: Locale;
  }>;
}

export async function generateStaticParams() {
  return blogSource.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = blogSource.getPage(slug);
  if (!page) notFound();

  const data = page.data as unknown as BlogPostData;

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      type: 'article',
      publishedTime: data.date,
      authors: [data.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
    },
  };
}

// Interface matching source.config.ts
interface BlogPostData {
  title: string;
  description: string;
  image: string;
  date: string;
  published: boolean;
  premium?: boolean;
  categories: string[];
  author: string;
  body: React.ComponentType<any>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const page = blogSource.getPage(slug);
  if (!page) notFound();

  // Cast to our defined interface which matches source.config.ts
  const data = page.data as unknown as BlogPostData;
  const MDX = data.body;
  const t = await getTranslations('BlogPage');

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', item: 'https://www.scooprym.app' },
          { name: 'Blog', item: 'https://www.scooprym.app/blog' },
          { name: data.title, item: `https://www.scooprym.app/blog/${page.url}` },
        ]}
      />

      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">{page.data.title}</h1>
          <p className="text-xl text-muted-foreground">{page.data.description}</p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <time dateTime={data.date ?? ''}>{data.date}</time>
            <span>•</span>
            <span>{data.author}</span>
          </div>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <MDX components={{ ...defaultMdxComponents }} />
        </article>
      </div>
    </>
  );
}
