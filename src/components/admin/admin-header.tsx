'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';
import { ModeSwitcher } from '../layout/mode-switcher';

const adminSections = [
  { href: Routes.AdminDashboard, key: 'overview' },
  { href: Routes.AdminStoryRadar, key: 'storyRadar' },
  { href: Routes.AdminCreate, key: 'createSong' },
  { href: Routes.AdminSongs, key: 'publishSongs' },
  { href: Routes.AdminComments, key: 'commentReports' },
  { href: Routes.AdminUsers, key: 'users' },
] as const;

export function AdminHeader() {
  const pathname = useLocalePathname();
  const t = useTranslations('Dashboard.admin.shell');
  const currentSection = adminSections.find((section) => pathname.startsWith(section.href)) ?? adminSections[0];

  const breadcrumbs = [{ label: t('brand'), href: Routes.AdminDashboard }, { label: t(currentSection.key) }];

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <Fragment key={item.label}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <LocaleLink href={item.href}>{item.label}</LocaleLink>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}
