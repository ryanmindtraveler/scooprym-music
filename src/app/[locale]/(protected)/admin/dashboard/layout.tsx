import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { isDemoWebsite } from '@/lib/demo';
import { getSession } from '@/lib/server';
import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

export default async function AdminDashboardLayout({ children }: PropsWithChildren) {
  const session = await getSession();
  const isDemo = isDemoWebsite();

  // Strict RBAC: Admin only
  if (!session?.user || (session.user.role !== 'admin' && !isDemo)) {
    redirect('/');
  }

  const t = await getTranslations('Dashboard');

  const breadcrumbs = [
    {
      label: 'Admin',
      isCurrentPage: false,
    },
    {
      label: 'Dashboard',
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col overflow-y-auto bg-muted/10 p-4 md:p-8">{children}</div>
    </>
  );
}
