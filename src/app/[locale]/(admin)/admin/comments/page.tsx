import { type CommentReportItem, CommentReports } from '@/components/admin/comment-reports';
import { getDb } from '@/db';
import { song, songComment, songCommentReport, user } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AdminCommentReportsPage() {
  const t = await getTranslations('Dashboard.admin.comments');
  const db = await getDb();
  const author = db.$with('comment_author').as(db.select({ id: user.id, name: user.name }).from(user));
  const reporter = db.$with('reporter').as(db.select({ id: user.id, name: user.name }).from(user));
  const rows = await db
    .with(author, reporter)
    .select({
      id: songCommentReport.id,
      reason: songCommentReport.reason,
      createdAt: songCommentReport.createdAt,
      comment: songComment.content,
      author: author.name,
      reporter: reporter.name,
      songTitle: song.title,
    })
    .from(songCommentReport)
    .innerJoin(songComment, eq(songComment.id, songCommentReport.commentId))
    .innerJoin(song, eq(song.id, songComment.songId))
    .innerJoin(author, eq(author.id, songComment.userId))
    .innerJoin(reporter, eq(reporter.id, songCommentReport.reporterId))
    .where(eq(songCommentReport.status, 'pending'))
    .orderBy(desc(songCommentReport.createdAt))
    .limit(100);

  const reports: CommentReportItem[] = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <CommentReports initialReports={reports} />
    </div>
  );
}
