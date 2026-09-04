import { UsersPageClient } from '@/components/admin/users-page';
import { getTranslations } from 'next-intl/server';

/**
 * Users page
 *
 * This page is used to manage users for the admin,
 * it is protected and only accessible to the admin role
 */
export default async function UsersPage() {
  const t = await getTranslations('Dashboard.admin.userPage');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <UsersPageClient />
    </div>
  );
}
