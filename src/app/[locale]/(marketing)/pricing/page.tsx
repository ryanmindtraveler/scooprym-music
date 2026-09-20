import FaqSection from '@/components/blocks/faqs/faqs';
import Container from '@/components/layout/container';
import { PricingTable } from '@/components/pricing/pricing-table';
import { Zap } from 'lucide-react';

import { getSession } from '@/lib/auth/server';
import { constructMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  if (!(await getSession())) redirect('/auth/login?callbackUrl=%2Fpricing');
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PricingPage' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '/pricing',
    noIndex: true,
  });
}

export default async function PricingPage() {
  if (!(await getSession())) redirect('/auth/login?callbackUrl=%2Fpricing');
  const t = await getTranslations('PricingPage');

  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="relative py-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

        <Container className="relative z-10 max-w-6xl px-4 flex flex-col gap-16">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              {t('heroTitleLeading')} <span className="text-primary">{t('heroTitleHighlight')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('heroDescription')}
              <br />
              <span className="text-accent font-bold">{t('bonusCredits')}</span>
            </p>
          </div>

          <PricingTable />

          <div className="mt-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold uppercase tracking-wide">{t('faqTitle')}</h2>
            </div>
            <FaqSection />
          </div>
        </Container>
      </section>
    </div>
  );
}
