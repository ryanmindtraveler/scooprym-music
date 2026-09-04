import { getSession } from '@/lib/server';
import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default async function DashboardCreateRedirectPage() {
  const session = await getSession();

  if (!session?.user || session.user.role !== 'admin') {
    redirect(Routes.Dashboard);
  }

  redirect(Routes.AdminCreate);
}
