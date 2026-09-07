import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth/server';
import { Routes } from '@/routes';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

export default async function AdminLayout({ children }: PropsWithChildren) {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);

  if (!session?.user) {
    redirect(`${Routes.Login}?callbackUrl=${encodeURIComponent(Routes.AdminDashboard)}`);
  }

  if (session.user.role !== 'admin') {
    redirect(Routes.Dashboard);
  }

  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          '--sidebar-width': '16.5rem',
          '--header-height': '3.5rem',
        } as React.CSSProperties
      }
      className="bg-muted/30"
    >
      <AdminSidebar user={session.user} variant="inset" />
      <SidebarInset className="min-w-0 bg-background">
        <AdminHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[2560px] flex-1 flex-col p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
