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
import { LocaleLink } from '@/i18n/navigation';
import React, { type ReactNode } from 'react';
import { ModeSwitcher } from '../layout/mode-switcher';

interface DashboardBreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface DashboardHeaderProps {
  breadcrumbs: DashboardBreadcrumbItem[];
  actions?: ReactNode;
}

/**
 * Dashboard header
 */
export function DashboardHeader({ breadcrumbs, actions }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        {breadcrumbs.length > 0 && (
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        )}

        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList className="text-base font-medium">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={`breadcrumb-${index}`}>
                  {index > 0 && <BreadcrumbSeparator key={`sep-${index}`} className="hidden md:block" />}
                  <BreadcrumbItem
                    key={`item-${index}`}
                    className={index < breadcrumbs.length - 1 ? 'hidden md:block' : ''}
                  >
                    {item.isCurrentPage ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : item.href ? (
                      <BreadcrumbLink asChild>
                        <LocaleLink href={item.href}>{item.label}</LocaleLink>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-muted-foreground font-medium">{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* dashboard header actions on the right side */}
        <div className="ml-auto flex items-center gap-3 pl-4">
          {actions}

          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}
