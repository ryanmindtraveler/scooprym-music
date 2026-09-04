'use client';

import { Button } from '@/components/ui/button';
import { Check, EyeOff, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface CommentReportItem {
  id: string;
  reason: string;
  createdAt: string;
  comment: string;
  author: string;
  reporter: string;
  songTitle: string;
}

export function CommentReports({ initialReports }: { initialReports: CommentReportItem[] }) {
  const [reports, setReports] = useState(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);

  const moderate = async (id: string, action: 'hide' | 'dismiss') => {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/comment-reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Moderation failed');
      setReports((current) => current.filter((report) => report.id !== id));
      toast.success(action === 'hide' ? 'Comment hidden' : 'Report dismissed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Moderation failed');
    } finally {
      setBusyId(null);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
        No reports need review.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <article key={report.id} className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="rounded-full bg-pink-50 px-2 py-1 text-pink-700">{report.reason}</span>
                <span>{report.songTitle}</span>
                <span>Reported by {report.reporter}</span>
              </div>
              <blockquote className="mt-3 border-l-2 border-pink-400 pl-4 text-sm font-medium leading-6">
                “{report.comment}”
              </blockquote>
              <p className="mt-2 text-xs text-muted-foreground">Comment by {report.author}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                disabled={busyId === report.id}
                onClick={() => void moderate(report.id, 'dismiss')}
              >
                {busyId === report.id ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                Keep
              </Button>
              <Button
                variant="destructive"
                disabled={busyId === report.id}
                onClick={() => void moderate(report.id, 'hide')}
              >
                <EyeOff className="size-4" />
                Hide comment
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
