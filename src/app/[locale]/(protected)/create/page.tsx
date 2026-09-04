import { getSession } from '@/lib/server';
import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default async function LegacyCreateRedirectPage() {
  const session = await getSession();

  redirect(session?.user?.role === 'admin' ? Routes.AdminCreate : Routes.Dashboard);
}
