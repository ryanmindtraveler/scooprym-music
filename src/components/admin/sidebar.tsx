'use client';

import { SidebarUser } from '@/components/dashboard/sidebar-user';
import { ScoopRYMLogo } from '@/components/layout/logo-scooprym';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { Routes } from '@/routes';
import type { User } from 'better-auth';
import { Flag, LayoutDashboard, Music2, Radar, Send, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type * as React from 'react';

const adminNav = [
  {
    key: 'overview',
    url: Routes.AdminDashboard,
    icon: LayoutDashboard,
  },
  {
    key: 'storyRadar',
    url: Routes.AdminStoryRadar,
    icon: Radar,
  },
  {
    key: 'createSong',
    url: Routes.AdminCreate,
    icon: Music2,
  },
  {
    key: 'publishSongs',
    url: Routes.AdminSongs,
    icon: Send,
  },
  {
    key: 'commentReports',
    url: Routes.AdminComments,
    icon: Flag,
  },
  {
    key: 'users',
    url: Routes.AdminUsers,
    icon: Users,
  },
] as const;

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
}

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  const pathname = useLocalePathname();
  const t = useTranslations('Dashboard.admin.shell');

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <LocaleLink href={Routes.Root} locale="en" className="flex items-center gap-2">
            <ScoopRYMLogo className="h-8 w-8" />
            <span className="font-semibold text-base tracking-tight">{t('brand')}</span>
          </LocaleLink>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('group')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <LocaleLink href={item.url}>
                      <item.icon className="size-4" />
                      <span>{t(item.key)}</span>
                    </LocaleLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
