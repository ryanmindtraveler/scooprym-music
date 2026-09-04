'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocaleRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Check,
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
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
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

export function StorySubmissions({ submissions }: { submissions: StorySubmissionView[] }) {
  const t = useTranslations('Dashboard.admin.storySubmissions');
  const router = useLocaleRouter();
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
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-8 md:px-8" aria-labelledby="reader-tips-heading">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid gap-5 border-b bg-[linear-gradient(100deg,rgba(255,242,88,0.32),rgba(255,255,255,0)_52%)] px-5 py-5 md:grid-cols-[1fr_auto] md:items-end md:px-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#d80d63]">
              <Inbox className="size-4" /> {t('eyebrow')}
            </div>
            <h2 id="reader-tips-heading" className="mt-2 text-2xl font-semibold tracking-tight">
              {t('title')}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label={t('filterLabel')}>
            {filters.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={activeFilter === filter.id ? 'secondary' : 'ghost'}
                aria-pressed={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {t(`filters.${filter.id}`)}
                <span className="text-xs tabular-nums text-muted-foreground">{counts[filter.id]}</span>
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
            <Inbox className="mb-3 size-7 text-muted-foreground" />
            <p className="font-semibold">{t('emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('emptyDescription')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((submission) => {
              const isPending = pendingId === submission.id;
              return (
                <article
                  key={submission.id}
                  className={cn(
                    'grid gap-4 px-5 py-4 transition-colors hover:bg-muted/20 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-7',
                    submission.status === 'rejected' && 'opacity-60'
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-semibold">
                        {submission.sourceDomain || t('writtenTip')}
                      </Badge>
                      <span>{submission.submittedAgo}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#d80d63]">
                        <Users className="size-3.5" /> {t('tipCount', { count: submission.submissionCount })}
                      </span>
                      {submission.submitterEmail && (
                        <span className="truncate">
                          {t('submittedBy', { name: submission.submitterName || submission.submitterEmail })}
                        </span>
                      )}
                    </div>
                    {submission.sourceTitle && (
                      <div className="mt-2 flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                          <p className="font-semibold leading-5 text-foreground">{submission.sourceTitle}</p>
                          {submission.sourceDescription && (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                              {submission.sourceDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {submission.note && (
                      <p
                        className={cn(
                          'mt-2 text-base font-semibold leading-6 text-foreground',
                          submission.sourceTitle && 'border-l-2 border-[#d80d63]/35 pl-3 text-sm text-muted-foreground'
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
                        className="mt-1.5 block truncate text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        {submission.sourceUrl}
                      </a>
                    )}
                    {submission.rejectionReason && (
                      <p className="mt-2 text-xs font-medium text-rose-700">
                        {t('reviewNote', { reason: submission.rejectionReason })}
                      </p>
                    )}
                    {submission.reviewedAt && submission.reviewerName && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('reviewedBy', { name: submission.reviewerName })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {submission.sourceUrl && (
                      <Button asChild size="icon-sm" variant="ghost" aria-label={t('openSubmittedStory')}>
                        <a href={submission.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink />
                        </a>
                      </Button>
                    )}
                    {submission.status === 'pending' && (
                      <>
                        <Button type="button" size="sm" variant="ghost" onClick={() => beginEdit(submission)}>
                          <FilePenLine /> {t('review')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => {
                            setRejectingId(submission.id);
                            setEditingId(null);
                            setDuplicate(null);
                          }}
                        >
                          <X /> {t('reject')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending || !submission.sourceUrl}
                          title={submission.sourceUrl ? undefined : t('sourceRequired')}
                          onClick={() => adopt(submission.id)}
                        >
                          {isPending ? <Loader2 className="animate-spin" /> : <Check />}
                          {t('sendToRadar')}
                        </Button>
                      </>
                    )}
                    {submission.status === 'rejected' && (
                      <>
                        <Button type="button" size="sm" variant="ghost" onClick={() => beginEdit(submission)}>
                          <FilePenLine /> {t('edit')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => updateStatus(submission.id, 'pending')}
                        >
                          <RotateCcw /> {t('restore')}
                        </Button>
                      </>
                    )}
                    {submission.status === 'adopted' && <Badge className="bg-emerald-600">{t('onRadar')}</Badge>}
                  </div>

                  {editingId === submission.id && (
                    <div className="rounded-xl border border-[#201a29]/12 bg-[#fffdf8] p-4 shadow-inner md:col-span-2">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                        <label className="grid gap-1.5 text-xs font-bold text-muted-foreground">
                          {t('publicSource')}
                          <input
                            type="url"
                            value={draftUrl}
                            onChange={(event) => setDraftUrl(event.target.value)}
                            placeholder="https://news-site.com/story"
                            className="h-10 rounded-lg border bg-white px-3 text-sm text-foreground outline-none focus:border-[#d80d63]"
                          />
                        </label>
                        <label className="grid gap-1.5 text-xs font-bold text-muted-foreground">
                          {t('editorialSummary')}
                          <input
                            value={draftNote}
                            maxLength={280}
                            onChange={(event) => setDraftNote(event.target.value)}
                            placeholder={t('summaryPlaceholder')}
                            className="h-10 rounded-lg border bg-white px-3 text-sm text-foreground outline-none focus:border-[#d80d63]"
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
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
                            disabled={isPending || (!draftUrl.trim() && draftNote.trim().length < 10)}
                            onClick={() => saveAndInspect(submission.id)}
                          >
                            {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                            {draftUrl.trim() ? t('saveAndInspect') : t('saveTip')}
                          </Button>
                        </div>
                      </div>

                      {duplicate && (
                        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex gap-2">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            <p className="text-sm font-medium">
                              {t('duplicateMessage', {
                                count: duplicate.submissionCount,
                                domain: duplicate.sourceDomain || t('editorialDesk'),
                              })}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={() => mergeDuplicate(submission.id, duplicate.id)}
                          >
                            <Merge /> {t('mergeExisting')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {rejectingId === submission.id && (
                    <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-end md:col-span-2">
                      <label className="grid min-w-0 flex-1 gap-1.5 text-xs font-bold text-rose-900">
                        {t('rejectionNote')}
                        <input
                          value={rejectionReason}
                          maxLength={280}
                          onChange={(event) => setRejectionReason(event.target.value)}
                          placeholder={t('rejectionPlaceholder')}
                          className="h-10 rounded-lg border border-rose-200 bg-white px-3 text-sm text-foreground outline-none focus:border-rose-500"
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                          {t('cancel')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isPending || (rejectionReason.length > 0 && rejectionReason.trim().length < 4)}
                          onClick={() => updateStatus(submission.id, 'rejected', rejectionReason)}
                        >
                          {isPending ? <Loader2 className="animate-spin" /> : <X />} {t('rejectTip')}
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
