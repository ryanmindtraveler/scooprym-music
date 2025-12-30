import type { NextPageProps } from '@/types/next-page-props';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy',
    description: 'Privacy Policy for Scooprym Music',
  };
}

export default async function PrivacyPolicyPage(props: NextPageProps) {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground">The privacy policy content is temporarily unavailable while we perform system maintenance. Please contact support if you have critical questions.</p>
    </div>
  );
}
