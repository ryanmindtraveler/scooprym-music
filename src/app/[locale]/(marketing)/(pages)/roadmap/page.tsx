import { Roadmap } from '@/components/diceui/roadmap';
import Container from '@/components/layout/container';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const pt = await getTranslations({ locale, namespace: 'RoadmapPage' });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: pt('description'),
    locale,
    pathname: '/roadmap',
  });
}

export default async function RoadmapPage() {
  const t = await getTranslations('RoadmapPage');

  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="relative py-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />

        <Container className="relative z-10 px-4">
          <div className="mx-auto max-w-5xl space-y-16">
            {/* Header */}
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">{t('title')}</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
            </div>

            {/* Roadmap */}
            <div className="flex justify-center w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12">
              <Roadmap />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
