import { DataTable } from '@/components/admin/data-table';
import { getDb } from '@/db/index';
import { song, user } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { type SongWithUser, columns } from './columns';

export default async function AdminSongsPage() {
  const db = await getDb();

  // Custom Join Query to fetch songs with user names
  const songsData = await db
    .select({
      id: song.id,
      title: song.title,
      userId: song.userId,
      userName: user.name,
      audioUrl: song.audioUrl,
      coverImageUrl: song.coverImageUrl,
      processingStatus: song.processingStatus,
      createdAt: song.createdAt,
      plays: song.plays,
    })
    .from(song)
    .leftJoin(user, eq(song.userId, user.id))
    .orderBy(desc(song.createdAt))
    .limit(100); // Limit 100 for performance

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Songs Management</h2>
          <p className="text-muted-foreground">View all generated songs, listen to previews, and monitor status.</p>
        </div>
      </div>
      <DataTable data={songsData as SongWithUser[]} columns={columns} searchKey="title" />
    </div>
  );
}
