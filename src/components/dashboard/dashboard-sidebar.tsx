'use client';

import { SidebarMain } from '@/components/dashboard/sidebar-main';
import { SidebarUser } from '@/components/dashboard/sidebar-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSidebarLinks } from '@/config/sidebar-config';
import { useCreditBalance } from '@/hooks/billing/use-credits';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { useTranslations } from 'next-intl';
import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Logo } from '../layout/logo';
import { UpgradeCard } from './upgrade-card';

/**
 * Dashboard sidebar
 */
export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const currentUser = session?.user;
  const { state } = useSidebar();
  // console.log('sidebar currentUser:', currentUser);

  const { data: balance, isLoading: isBalanceLoading } = useCreditBalance();

  const sidebarLinks = useSidebarLinks();

  // Inject Credits Balance Badge
  const sidebarLinksWithBadge = useMemo(() => {
    return sidebarLinks.map((item) => {
      if (item.items) {
        return {
          ...item,
          items: item.items.map((subItem) => {
            if (subItem.href === Routes.SettingsCredits) {
              return {
                ...subItem,
                badge: (
                  <div className="flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                    {isBalanceLoading ? '...' : (balance ?? 0)}
                  </div>
                ),
              };
            }
            return subItem;
          }),
        };
      }
      return item;
    });
  }, [sidebarLinks, balance, isBalanceLoading]);

  const filteredSidebarLinks = useMemo(() => {
    return sidebarLinksWithBadge.filter((link) => {
      if (link.authorizeOnly) {
        return link.authorizeOnly.includes(currentUser?.role || '');
      }
      return true;
    });
  }, [sidebarLinksWithBadge, currentUser]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <LocaleLink href={Routes.Root}>
                <Logo className="size-5" />
                <span className="truncate font-semibold text-base">{t('Metadata.name')}</span>
              </LocaleLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>{!isPending && mounted && <SidebarMain items={filteredSidebarLinks} />}</SidebarContent>

      <SidebarFooter className="flex flex-col gap-4">
        {/* Only show UI components when not in loading state */}
        {!isPending && mounted && (
          <>
            {/* show upgrade card if user is not a member, and sidebar is not collapsed */}
            {currentUser && state !== 'collapsed' && <UpgradeCard />}

            {/* show user profile if user is logged in */}
            {currentUser && <SidebarUser user={currentUser} />}
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
