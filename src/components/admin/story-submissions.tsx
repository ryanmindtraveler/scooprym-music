'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocaleRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FilePenLine,
  Inbox,
  Loader2,
  Merge,
  RotateCcw,
  Save,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export type StorySubmissionStatus = 'pending' | 'adopted' | 'rejected';

export interface StorySubmissionView {
  id: string;
  sourceUrl: string | null;
  sourceDomain: string | null;
  note: string | null;
  sourceTitle: string | null;
  sourceDescription: string | null;
  sourceImageUrl: string | null;
  sourcePublishedAt: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  reviewerName: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  status: StorySubmissionStatus;
  submissionCount: number;
  submittedAgo: string;
}

const filters: Array<{ id: 'all' | StorySubmissionStatus }> = [
  { id: 'pending' },
  { id: 'adopted' },
  { id: 'rejected' },
  { id: 'all' },
];

const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

export function StorySubmissions({ submissions }: { submissions: StorySubmissionView[] }) {
  const t = useTranslations('Dashboard.admin.storySubmissions');
  const router = useLocaleRouter();
  const zh = useLocale() === 'zh';
  const [activeFilter, setActiveFilter] = useState<'all' | StorySubmissionStatus>('pending');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [duplicate, setDuplicate] = useState<{
    id: string;
    sourceDomain: string | null;
    note: string | null;
    submissionCount: number;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const counts = useMemo(
    () => ({
      all: submissions.length,
      pending: submissions.filter((submission) => submission.status === 'pending').length,
      adopted: submissions.filter((submission) => submission.status === 'adopted').length,
      rejected: submissions.filter((submission) => submission.status === 'rejected').length,
    }),
    [submissions]
  );
  const filtered = submissions.filter((submission) => activeFilter === 'all' || submission.status === activeFilter);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSubmissions = useMemo(
    () => filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize),
    [filtered, safeCurrentPage, pageSize]
  );

  async function updateStatus(id: string, status: 'pending' | 'rejected', reason?: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/story-submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'review', status, rejectionReason: reason }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error || t('reviewError'));
      toast.success(status === 'rejected' ? t('rejectedSuccess') : t('restoredSuccess'));
      setRejectingId(null);
      setRejectionReason('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reviewError'));
    } finally {
      setPendingId(null);
    }
  }

  function beginEdit(submission: StorySubmissionView) {
    setEditingId(submission.id);
    setDraftUrl(submission.sourceUrl || '');
    setDraftNote(submission.note || '');
    setDuplicate(null);
    setRejectingId(null);
  }

  async function saveAndInspect(id: string) {
    setPendingId(id);
    setDuplicate(null);
    try {
      const response = await fetch(`/api/admin/story-submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'edit', sourceUrl: draftUrl, note: draftNote }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        duplicate?: { id: string; sourceDomain: string | null; note: string | null; submissionCount: number };
      };
      if (response.status === 409 && payload.duplicate) {
        setDuplicate(payload.duplicate);
        return;
      }
      if (!response.ok || !payload.success) throw new Error(payload.error || t('saveError'));
      toast.success(draftUrl ? t('sourceVerified') : t('tipUpdated'));
      setEditingId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'));
    } finally {
      setPendingId(null);
    }
  }

  async function mergeDuplicate(id: string, targetId: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/story-submissions/${id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error || t('mergeError'));
      toast.success(t('mergeSuccess'));
      setEditingId(null);
      setDuplicate(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('mergeError'));
    } finally {
      setPendingId(null);
    }
  }

  async function adopt(id: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/story-submissions/${id}/adopt`, { method: 'POST' });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error || t('sendError'));
      toast.success(t('sendSuccess'));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('sendError'));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* 筛选条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <Inbox className="size-4" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-foreground">{t('title')}</h3>
            <p className="text-[11px] text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5" aria-label={t('filterLabel')}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setActiveFilter(filter.id)}
                className={`h-7.5 px-2.5 text-xs font-bold rounded-lg transition-all ${
                  isActive ? 'bg-pink-600 text-white hover:bg-pink-700' : ''
                }`}
              >
                {t(`filters.${filter.id}`)}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {counts[filter.id]}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 爆料列表 */}
      {filtered.length === 0 ? (
        <Card className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <Inbox className="mb-2.5 size-8 text-muted-foreground/60" />
          <p className="text-sm font-bold text-foreground">{t('emptyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('emptyDescription')}</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs divide-y divide-border/60">
          {paginatedSubmissions.map((submission) => {
            const isPending = pendingId === submission.id;

            return (
              <article
                key={submission.id}
                className={cn(
                  'grid gap-3 p-4 transition-colors hover:bg-muted/20 md:grid-cols-[minmax(0,1fr)_auto] md:items-center',
                  submission.status === 'rejected' && 'opacity-60'
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="font-bold border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300"
                    >
                      {submission.sourceDomain || t('writtenTip')}
                    </Badge>
                    <span className="text-[11px]">{submission.submittedAgo}</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                      <Users className="size-3 text-pink-600" /> {t('tipCount', { count: submission.submissionCount })}
                    </span>
                    {submission.submitterEmail && (
                      <span className="truncate text-[11px]">
                        {t('submittedBy', { name: submission.submitterName || submission.submitterEmail })}
                      </span>
                    )}
                  </div>

                  {submission.sourceTitle && (
                    <div className="mt-2 flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight text-foreground">{submission.sourceTitle}</p>
                        {submission.sourceDescription && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {submission.sourceDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {submission.note && (
                    <p
                      className={cn(
                        'mt-1.5 text-xs font-semibold leading-relaxed text-foreground',
                        submission.sourceTitle && 'border-l-2 border-pink-500/40 pl-2.5 text-xs text-muted-foreground'
                      )}
                    >
                      {submission.note}
                    </p>
                  )}

                  {submission.sourceUrl && (
                    <a
                      href={submission.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block truncate text-xs text-muted-foreground underline-offset-4 hover:text-pink-600 hover:underline"
                    >
                      {submission.sourceUrl}
                    </a>
                  )}

                  {submission.rejectionReason && (
                    <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      {t('reviewNote', { reason: submission.rejectionReason })}
                    </p>
                  )}

                  {submission.reviewedAt && submission.reviewerName && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('reviewedBy', { name: submission.reviewerName })}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 md:justify-end shrink-0">
                  {submission.sourceUrl && (
                    <Button
                      asChild
                      size="icon-sm"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <a href={submission.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label="查看链接">
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                  {submission.status === 'pending' && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7.5 px-2.5 text-xs font-bold"
                        onClick={() => beginEdit(submission)}
                      >
                        <FilePenLine className="mr-1 size-3" /> {t('review')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7.5 px-2.5 text-xs font-bold text-destructive hover:bg-destructive/10"
                        disabled={isPending}
                        onClick={() => {
                          setRejectingId(submission.id);
                          setEditingId(null);
                          setDuplicate(null);
                        }}
                      >
                        <X className="mr-1 size-3" /> {t('reject')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7.5 px-3 text-xs font-bold bg-pink-600 text-white hover:bg-pink-700"
                        disabled={isPending || !submission.sourceUrl}
                        title={submission.sourceUrl ? undefined : t('sourceRequired')}
                        onClick={() => adopt(submission.id)}
                      >
                        {isPending ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : (
                          <Check className="mr-1 size-3" />
                        )}
                        {t('sendToRadar')}
                      </Button>
                    </>
                  )}
                  {submission.status === 'rejected' && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7.5 px-2.5 text-xs font-bold"
                        onClick={() => beginEdit(submission)}
                      >
                        <FilePenLine className="mr-1 size-3" /> {t('edit')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7.5 px-2.5 text-xs font-bold"
                        disabled={isPending}
                        onClick={() => updateStatus(submission.id, 'pending')}
                      >
                        <RotateCcw className="mr-1 size-3" /> {t('restore')}
                      </Button>
                    </>
                  )}
                  {submission.status === 'adopted' && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold"
                    >
                      {t('onRadar')}
                    </Badge>
                  )}
                </div>

                {editingId === submission.id && (
                  <div className="rounded-xl border bg-muted/40 p-3.5 md:col-span-2">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                      <label className="grid gap-1 text-xs font-bold text-muted-foreground">
                        {t('publicSource')}
                        <input
                          type="url"
                          value={draftUrl}
                          onChange={(event) => setDraftUrl(event.target.value)}
                          placeholder="https://news-site.com/story"
                          className="h-8.5 rounded-lg border bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-pink-500"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-bold text-muted-foreground">
                        {t('editorialSummary')}
                        <input
                          value={draftNote}
                          maxLength={280}
                          onChange={(event) => setDraftNote(event.target.value)}
                          placeholder={t('summaryPlaceholder')}
                          className="h-8.5 rounded-lg border bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-pink-500"
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8.5 text-xs"
                          onClick={() => {
                            setEditingId(null);
                            setDuplicate(null);
                          }}
                        >
                          {t('cancel')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8.5 bg-pink-600 text-xs font-bold text-white hover:bg-pink-700"
                          disabled={isPending || (!draftUrl.trim() && draftNote.trim().length < 10)}
                          onClick={() => saveAndInspect(submission.id)}
                        >
                          {isPending ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : (
                            <Save className="mr-1 size-3" />
                          )}
                          {draftUrl.trim() ? t('saveAndInspect') : t('saveTip')}
                        </Button>
                      </div>
                    </div>

                    {duplicate && (
                      <div className="mt-3 flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                          <p className="text-xs font-medium">
                            {t('duplicateMessage', {
                              count: duplicate.submissionCount,
                              domain: duplicate.sourceDomain || t('editorialDesk'),
                            })}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-bold border-amber-500/40 hover:bg-amber-500/20"
                          disabled={isPending}
                          onClick={() => mergeDuplicate(submission.id, duplicate.id)}
                        >
                          <Merge className="mr-1 size-3" /> {t('mergeExisting')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {rejectingId === submission.id && (
                  <div className="flex flex-col gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 sm:flex-row sm:items-end md:col-span-2">
                    <label className="grid min-w-0 flex-1 gap-1 text-xs font-bold text-rose-900 dark:text-rose-200">
                      {t('rejectionNote')}
                      <input
                        value={rejectionReason}
                        maxLength={280}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        placeholder={t('rejectionPlaceholder')}
                        className="h-8.5 rounded-lg border border-rose-500/30 bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-rose-500"
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8.5 text-xs"
                        onClick={() => setRejectingId(null)}
                      >
                        {t('cancel')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-8.5 text-xs font-bold"
                        disabled={isPending || (rejectionReason.length > 0 && rejectionReason.trim().length < 4)}
                        onClick={() => updateStatus(submission.id, 'rejected', rejectionReason)}
                      >
                        {isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : <X className="mr-1 size-3" />}
                        {t('rejectTip')}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* 分页控制栏 */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-1 px-1">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-medium">
            <span>
              {zh
                ? `显示第 ${(safeCurrentPage - 1) * pageSize + 1} - ${Math.min(safeCurrentPage * pageSize, totalItems)} 条 · 共 ${totalItems} 条`
                : `Showing ${(safeCurrentPage - 1) * pageSize + 1}-${Math.min(safeCurrentPage * pageSize, totalItems)} of ${totalItems} submissions`}
            </span>
            <div className="flex items-center gap-1 ml-1">
              <span className="text-muted-foreground/50">|</span>
              <span className="text-[11px] ml-1">{zh ? '每页' : 'Per page'}:</span>
              {[10, 20, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[11px] font-bold transition-colors cursor-pointer',
                    pageSize === size
                      ? 'bg-foreground text-background dark:bg-foreground dark:text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safeCurrentPage <= 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-8 px-2.5 text-xs font-bold"
              >
                <ChevronLeft className="size-3.5 mr-0.5" />
                {zh ? '上一页' : 'Prev'}
              </Button>

              <div className="flex items-center gap-1">
                {generatePagination(safeCurrentPage, totalPages).map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-muted-foreground">
                        …
                      </span>
                    );
                  }
                  const pageNum = Number(item);
                  const isCurrent = pageNum === safeCurrentPage;
                  return (
                    <Button
                      key={`page-${pageNum}`}
                      type="button"
                      variant={isCurrent ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        'h-8 min-w-8 px-2 text-xs font-bold',
                        isCurrent && 'bg-pink-600 text-white hover:bg-pink-700'
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-8 px-2.5 text-xs font-bold"
              >
                {zh ? '下一页' : 'Next'}
                <ChevronRight className="size-3.5 ml-0.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
