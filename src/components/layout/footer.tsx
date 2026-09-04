'use client';

import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { ModeSwitcherHorizontal } from '@/components/layout/mode-switcher-horizontal';
import { useFooterLinks } from '@/config/footer-config';
import { useSocialLinks } from '@/config/social-config';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type React from 'react';

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = useTranslations();
  const footerLinks = useFooterLinks();
  const socialLinks = useSocialLinks();

  return (
    <footer
      className={cn(
        'border-t border-black/5 dark:border-white/5 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl',
        className
      )}
    >
      <Container className="max-w-[1760px] px-4 md:px-6 2xl:px-8">
        <div className="grid grid-cols-2 gap-12 py-16 lg:grid-cols-4">
          <div className="flex flex-col items-start col-span-full md:col-span-2">
            <div className="space-y-6">
              {/* logo and name */}
              <div className="items-center space-x-2 flex">
                <Logo className="w-8 h-8" />
                <span className="text-xl font-black tracking-tighter">{t('Metadata.name')}</span>
              </div>

              {/* tagline */}
              <p className="text-muted-foreground text-base max-w-xs">{t('Marketing.footer.tagline')}</p>

              {/* social links */}
              <div className="flex items-center gap-4">
                {socialLinks?.map((link) => (
                  <a
                    key={link.title}
                    href={link.href || '#'}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.title}
                    className="border border-border inline-flex h-10 w-10 items-center
                        justify-center rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <span className="sr-only">{link.title}</span>
                    {link.icon ? link.icon : null}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* footer links */}
          {footerLinks?.map((section) => (
            <div key={section.title} className="col-span-1 md:col-span-1 items-start">
              <span className="text-sm font-bold uppercase tracking-wider text-foreground">{section.title}</span>
              <ul className="mt-6 list-inside space-y-3">
                {section.items?.map(
                  (item) =>
                    item.href && (
                      <li key={item.title}>
                        <LocaleLink
                          href={item.href || '#'}
                          target={item.external ? '_blank' : undefined}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                        >
                          {item.title}
                        </LocaleLink>
                      </li>
                    )
                )}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-border/50 py-8">
        <Container className="max-w-[1760px] px-4 md:px-6 2xl:px-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-muted-foreground text-sm font-medium">
            &copy; {new Date().getFullYear()} {t('Metadata.name')} All Rights Reserved.
          </span>

          <div className="flex items-center gap-x-4">
            <ModeSwitcherHorizontal />
          </div>
        </Container>
      </div>
    </footer>
  );
}
