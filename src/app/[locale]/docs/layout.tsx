import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import '@/styles/mdx.css';

interface DocsLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}

export default async function DocsRootLayout({ children, params }: DocsLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'DocsPage' });

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b py-4 px-6">
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
