import Container from '@/components/layout/container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { constructMetadata } from '@/lib/metadata';
import { MailIcon, Mic2, Music2, TwitterIcon } from 'lucide-react';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AboutPage' });
  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '/about',
  });
}

export default async function AboutPage() {
  const t = await getTranslations('AboutPage');

  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <Container className="relative z-10 px-4">
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Header */}
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
                {t('title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('description')}
              </p>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-card border border-border/50 p-8 rounded-3xl space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="size-24 border-4 border-primary">
                      <AvatarImage src="/logo.png" alt={t('authorName')} />
                      <AvatarFallback className="bg-muted text-2xl font-bold">SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-2xl font-bold uppercase">{t('authorName')}</h3>
                      <p className="text-primary font-medium">{t('authorBio')}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('introduction')}
                  </p>

                  <div className="flex gap-4 pt-4">
                    {websiteConfig.metadata.social?.twitter && (
                      <a href={websiteConfig.metadata.social.twitter} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="rounded-full">
                          <TwitterIcon className="mr-2 size-4" />
                          {t('followMe')}
                        </Button>
                      </a>
                    )}
                    {websiteConfig.mail.supportEmail && (
                      <a href={`mailto:${websiteConfig.mail.supportEmail}`}>
                        <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                          <MailIcon className="mr-2 size-4" />
                          {t('talkWithMe')}
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="size-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                    <Mic2 className="size-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase mb-2">{t('authorBio')}</h3>
                    <p className="text-muted-foreground">
                      {t('description')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <Music2 className="size-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase mb-2">
                      {t('authorName')} AI
                    </h3>
                    <p className="text-muted-foreground">
                      {t('introduction')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
