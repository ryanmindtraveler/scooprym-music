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
        'relative border-t border-slate-200/80 bg-linear-to-b from-[#faf8f4] to-[#f4efe8] backdrop-blur-xl dark:border-white/10 dark:from-[#0f0d18] dark:to-[#08070d]',
        className
      )}
    >
      {/* 顶部彩色霓虹流光条 */}
      <div aria-hidden="true" className="h-1 w-full bg-linear-to-r from-[#ffe600] via-[#ff007a] via-50% to-[#00e5ff]" />

      <Container className="max-w-[1760px] px-4 md:px-8 2xl:px-12">
        <div className="grid grid-cols-2 gap-12 py-16 lg:grid-cols-5">
          <div className="flex flex-col items-start col-span-full md:col-span-2">
            <div className="space-y-5">
              {/* logo and name */}
              <div className="flex items-center space-x-3">
                <Logo className="size-9" />
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {t('Metadata.name')}
                </span>
                <span className="rounded-full border border-[#1a1523]/15 bg-[#ffe600] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#1a1523] dark:border-white/20">
                  AI Music
                </span>
              </div>

              {/* tagline */}
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium max-w-sm leading-relaxed">
                {t('Marketing.footer.tagline')}
              </p>

              {/* social links */}
              <div className="flex items-center gap-3 pt-2">
                {socialLinks?.map((link) => (
                  <a
                    key={link.title}
                    href={link.href || '#'}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.title}
                    className="border border-slate-200 bg-white/90 shadow-2xs inline-flex size-10 items-center justify-center rounded-2xl hover:bg-[#d80d63] hover:text-white hover:border-[#d80d63] hover:scale-105 transition-all dark:border-white/10 dark:bg-zinc-900"
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
            <div key={section.title} className="col-span-1 md:col-span-1 items-start min-w-0">
              <span className="text-xs font-black uppercase tracking-widest text-[#d80d63] dark:text-pink-400">
                {section.title}
              </span>
              <ul className="mt-5 list-inside space-y-3">
                {section.items?.map(
                  (item) =>
                    item.href && (
                      <li key={item.title}>
                        <LocaleLink
                          href={item.href || '#'}
                          target={item.external ? '_blank' : undefined}
                          className="text-sm text-slate-600 hover:text-[#d80d63] transition-colors font-semibold dark:text-slate-400 dark:hover:text-pink-400 [overflow-wrap:anywhere]"
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

      <div className="border-t border-slate-200/60 dark:border-white/10 py-7">
        <Container className="max-w-[1760px] px-4 md:px-8 2xl:px-12 flex flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
            &copy; {new Date().getFullYear()} {t('Metadata.name')}. All rights reserved.
          </span>

          <div className="flex items-center gap-x-4">
            <ModeSwitcherHorizontal />
          </div>
        </Container>
      </div>
    </footer>
  );
}
