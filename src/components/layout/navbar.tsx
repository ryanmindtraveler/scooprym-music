'use client';

import { LoginWrapper } from '@/components/auth/login-wrapper';
import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { ModeSwitcher } from '@/components/layout/mode-switcher';
import { NavbarMobile } from '@/components/layout/navbar-mobile';
import { UserButton } from '@/components/layout/user-button';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { useNavbarLinks } from '@/config/navbar-config';
import { useScroll } from '@/hooks/ui/use-scroll';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { ArrowUpRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import LocaleSwitcher from './locale-switcher';

interface NavBarProps {
  scroll?: boolean;
}

const customNavigationMenuTriggerStyle = cn(
  navigationMenuTriggerStyle(),
  'relative bg-transparent text-muted-foreground cursor-pointer font-bold tracking-wide transition-all text-xl', // Increased to text-xl
  'hover:bg-transparent hover:text-primary',
  'focus:bg-transparent focus:text-primary',
  'data-active:text-primary data-active:bg-transparent',
  'data-[state=open]:bg-transparent data-[state=open]:text-primary'
);

export function Navbar({ scroll }: NavBarProps) {
  const t = useTranslations();
  const scrolled = useScroll(50);
  const menuLinks = useNavbarLinks();
  const localePathname = useLocalePathname();
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const currentUser = session?.user;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      className={cn(
        'fixed inset-x-0 top-0 z-50 py-4 transition-all duration-300',
        scroll
          ? scrolled
            ? 'bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 shadow-sm supports-backdrop-filter:bg-white/60'
            : 'bg-transparent'
          : 'border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl shadow-sm'
      )}
    >
      <Container className="px-4">
        {/* desktop navbar */}
        <nav className="hidden lg:flex items-center justify-between">
          {/* logo and name */}
          <div className="flex items-center">
            <LocaleLink href="/" className="flex items-center space-x-2 group">
              <Logo className="w-8 h-8 transition-transform group-hover:scale-110" />
              <span className="text-2xl font-black tracking-tighter">{t('Metadata.name')}</span>
            </LocaleLink>
          </div>

          {/* menu links */}
          <div className="flex items-center justify-center space-x-2">
            <NavigationMenu className="relative">
              <NavigationMenuList className="flex items-center gap-2">
                {menuLinks?.map((item, index) =>
                  item.items ? (
                    <NavigationMenuItem key={index} className="relative">
                      <NavigationMenuTrigger
                        data-active={
                          item.items.some((subItem) => (subItem.href ? localePathname.startsWith(subItem.href) : false))
                            ? 'true'
                            : undefined
                        }
                        className={customNavigationMenuTriggerStyle}
                      >
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-4 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-popover border-border">
                          {item.items?.map((subItem, subIndex) => {
                            const isSubItemActive = subItem.href && localePathname.startsWith(subItem.href);
                            return (
                              <li key={subIndex}>
                                <NavigationMenuLink asChild>
                                  <LocaleLink
                                    href={subItem.href || '#'}
                                    target={subItem.external ? '_blank' : undefined}
                                    rel={subItem.external ? 'noopener noreferrer' : undefined}
                                    className={cn(
                                      'group flex select-none flex-row items-center gap-4 rounded-md',
                                      'p-3 leading-none no-underline outline-hidden transition-colors',
                                      'hover:bg-muted hover:text-primary',
                                      'focus:bg-muted focus:text-primary',
                                      isSubItemActive && 'bg-muted text-primary'
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'flex size-8 shrink-0 items-center justify-center transition-colors rounded-md',
                                        'bg-muted text-muted-foreground',
                                        'group-hover:bg-primary/20 group-hover:text-primary',
                                        isSubItemActive && 'bg-primary/20 text-primary'
                                      )}
                                    >
                                      {subItem.icon ? subItem.icon : null}
                                    </div>
                                    <div className="flex-1">
                                      <div
                                        className={cn(
                                          'text-sm font-bold tracking-wide text-foreground', // Removed uppercase
                                          'group-hover:text-primary',
                                          isSubItemActive && 'text-primary'
                                        )}
                                      >
                                        {subItem.title}
                                      </div>
                                      {subItem.description && (
                                        <div
                                          className={cn(
                                            'text-xs text-muted-foreground mt-1 line-clamp-2',
                                            'group-hover:text-muted-foreground/80'
                                          )}
                                        >
                                          {subItem.description}
                                        </div>
                                      )}
                                    </div>
                                    {subItem.external && (
                                      <ArrowUpRightIcon
                                        className={cn(
                                          'size-4 shrink-0 text-muted-foreground',
                                          'group-hover:text-primary'
                                        )}
                                      />
                                    )}
                                  </LocaleLink>
                                </NavigationMenuLink>
                              </li>
                            );
                          })}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    <NavigationMenuItem key={index}>
                      <NavigationMenuLink
                        asChild
                        active={
                          item.href
                            ? item.href === '/'
                              ? localePathname === '/'
                              : localePathname.startsWith(item.href)
                            : false
                        }
                        className={customNavigationMenuTriggerStyle}
                      >
                        <LocaleLink
                          href={item.href || '#'}
                          target={item.external ? '_blank' : undefined}
                          rel={item.external ? 'noopener noreferrer' : undefined}
                          className="text-xl" // Increased to text-xl
                        >
                          {item.title}
                        </LocaleLink>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* navbar right show sign in or user */}
          <div className="flex items-center gap-x-4">
            {!mounted || isPending ? (
              <Skeleton className="size-8 border rounded-full" />
            ) : currentUser ? (
              <>
                <LocaleLink
                  href={Routes.Home}
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'sm' }),
                    'font-bold rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 mr-2 hidden md:flex'
                  )}
                >
                  Dashboard
                </LocaleLink>
                {/* <CreditsBalanceButton /> */}
                <UserButton user={currentUser} />
              </>
            ) : (
              <div className="flex items-center gap-x-4">
                <LoginWrapper mode="modal" asChild>
                  <Button variant="ghost" size="sm" className="cursor-pointer font-bold hover:text-primary">
                    {t('Common.login')}
                  </Button>
                </LoginWrapper>

                <LocaleLink
                  href={Routes.Register}
                  className={cn(
                    buttonVariants({
                      variant: 'default',
                      size: 'sm',
                    }),
                    'font-bold rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {t('Common.signUp')}
                </LocaleLink>
              </div>
            )}

            <div className="flex items-center gap-2 border-l border-border/50 pl-4">
              <ModeSwitcher />
              <LocaleSwitcher />
            </div>
          </div>
        </nav>

        {/* mobile navbar */}
        <NavbarMobile className="lg:hidden" />
      </Container>
    </section>
  );
}
