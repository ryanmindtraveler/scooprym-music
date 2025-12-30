import { notFound } from 'next/navigation';
import type { NextPageProps } from '@/types/next-page-props';

export async function generateStaticParams() {
   return [];
}

export default async function BlogCategoryPaginationPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  return (
    <div className="container mx-auto py-16 px-4">
       <div className="max-w-4xl mx-auto space-y-8 text-center">
        <h1 className="text-4xl font-bold">Category Archive</h1>
         <p className="text-xl text-muted-foreground">Category archive is temporarily unavailable.</p>
      </div>
    </div>
  );
}
