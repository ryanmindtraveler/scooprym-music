import Container from '@/components/layout/container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { constructMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';
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
  return constructMetadata({
    title: 'About The Crew | Scooprym Music',
    description: 'Meet the team behind the beats.',
    locale,
    pathname: '/about',
  });
}

export default async function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <Container className="relative z-10 px-4">
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Header */}
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
                BEHIND THE <span className="text-primary">BEATS</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We're a collective of AI engineers, producers, and hip-hop heads building the future of music.
              </p>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-card border border-border/50 p-8 rounded-3xl space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="size-24 border-4 border-primary">
                      <AvatarImage src="/logo.png" alt="Scooprym" />
                      <AvatarFallback className="bg-muted text-2xl font-bold">SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-2xl font-bold uppercase">Scooprym Team</h3>
                      <p className="text-primary font-medium">AI Music Pioneers</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    "We got tired of boring news. So we built an AI that turns headlines into diss tracks. Our mission
                    is to make music creation accessible to everyone, no matter your background or skill level. If you
                    got a story, you got a song."
                  </p>

                  <div className="flex gap-4 pt-4">
                    {websiteConfig.metadata.social?.twitter && (
                      <a href={websiteConfig.metadata.social.twitter} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="rounded-full">
                          <TwitterIcon className="mr-2 size-4" />
                          Follow Us
                        </Button>
                      </a>
                    )}
                    {websiteConfig.mail.supportEmail && (
                      <a href={`mailto:${websiteConfig.mail.supportEmail}`}>
                        <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                          <MailIcon className="mr-2 size-4" />
                          Contact Us
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
                    <h3 className="text-xl font-bold uppercase mb-2">For the Culture</h3>
                    <p className="text-muted-foreground">
                      We respect the roots of Hip Hop while pushing the boundaries of technology. It's about expression,
                      storytelling, and rhythm.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <Music2 className="size-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase mb-2">AI Powered</h3>
                    <p className="text-muted-foreground">
                      Leveraging state-of-the-art LLMs and audio generation models to deliver studio-quality tracks in
                      seconds.
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
