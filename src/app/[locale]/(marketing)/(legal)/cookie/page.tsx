import type { NextPageProps } from '@/types/next-page-props';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cookie Policy',
    description: 'Cookie Policy for Scooprym Music',
  };
}

export default async function CookiePolicyPage(props: NextPageProps) {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      <p className="text-muted-foreground">The cookie policy content is temporarily unavailable while we perform system maintenance. Please contact support if you have critical questions.</p>
    </div>
  );
}
