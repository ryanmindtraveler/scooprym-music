'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import type { NestedMenuItem } from '@/types';

/**
 * Main navigation for the dashboard sidebar
 */
export function SidebarMain({ items }: { items: NestedMenuItem[] }) {
  const pathname = useLocalePathname();

  // Function to check if a path is active
  const isActive = (href: string | undefined): boolean => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Render items with children as SidebarGroup */}
      {items.map((item) =>
        item.items && item.items.length > 0 ? (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-1">
              <SidebarMenu>
                {item.items.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(subItem.href)}
                      className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-muted/50 transition-colors"
                    >
                      <LocaleLink href={subItem.href || ''}>
                        {subItem.icon ? (
                          <span className="group-data-[active=true]:text-primary transition-colors">
                            {subItem.icon}
                          </span>
                        ) : null}
                        <span className="truncate font-bold text-sm tracking-wide">{subItem.title}</span>
                      </LocaleLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          /* Render items without children directly in a SidebarMenu */
          <SidebarGroup key={item.title}>
            <SidebarGroupContent className="flex flex-col gap-1">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-muted/50 transition-colors"
                  >
                    <LocaleLink href={item.href || ''}>
                      {item.icon ? (
                        <span className="group-data-[active=true]:text-primary transition-colors">{item.icon}</span>
                      ) : null}
                      <span className="truncate font-bold text-sm tracking-wide">{item.title}</span>
                    </LocaleLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      )}
    </>
  );
}
