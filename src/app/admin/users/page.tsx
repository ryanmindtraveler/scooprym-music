import { DataTable } from '@/components/admin/data-table';
import { getDb } from '@/db/index';
import { user } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { columns } from './columns';

export default async function AdminUsersPage() {
  const db = await getDb();

  // Fetch users (limit 100 for now, could add server-side pagination later)
  const userData = await db.query.user.findMany({
    limit: 100,
    orderBy: [desc(user.createdAt)],
  });

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage users, check roles, and view registration dates.</p>
        </div>
      </div>
      <DataTable data={userData} columns={columns} searchKey="email" />
    </div>
  );
}
