import { ContactFormCard } from '@/components/contact/contact-form-card';
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
  return constructMetadata({
    title: 'Contact Us | Scooprym Music',
    description: 'Get in touch with the team.',
    locale,
    pathname: '/contact',
  });
}

export default async function ContactPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="relative py-20">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

        <Container className="relative z-10 px-4">
          <div className="mx-auto max-w-4xl space-y-12">
            {/* Header */}
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
                HIT US <span className="text-primary">UP</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                Got questions? Collab ideas? Or just want to say hi? Drop us a line.
              </p>
            </div>

            {/* Form */}
            <div className="bg-card border border-border/50 rounded-3xl p-1 shadow-2xl">
              <ContactFormCard />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
