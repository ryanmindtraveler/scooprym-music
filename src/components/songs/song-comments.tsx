'use client';

import { UserAvatar } from '@/components/layout/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LocaleLink } from '@/i18n/navigation';
import {
  COMMENT_MAX_LENGTH,
  getCommentLength,
  truncateCommentContent,
  validateCommentContent,
} from '@/lib/songs/comment-moderation';
import { Routes } from '@/routes';
import { formatDistanceToNow } from 'date-fns';
import { Flag, LoaderCircle, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CommentAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface SongCommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  canDelete: boolean;
}

interface Viewer {
  id: string;
  name: string;
  image: string | null;
}

interface SongCommentsProps {
  songId: string;
  viewer: Viewer | null;
  initialData?: {
    comments: SongCommentItem[];
    total: number;
    totalPages: number;
  };
}

interface CommentsResponse {
  success: boolean;
  error?: string;
  data?: {
    comments: SongCommentItem[];
    page: number;
    total: number;
    totalPages: number;
  };
}

const QUICK_REACTIONS = ['🤡', '💀', '🍿', '👀', '😭', '🔥'];

export function SongComments({ songId, viewer, initialData }: SongCommentsProps) {
  const [comments, setComments] = useState<SongCommentItem[]>(initialData?.comments ?? []);
  const [content, setContent] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages ?? 1);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const moderation = content ? validateCommentContent(content) : null;

  const loadComments = useCallback(
    async (targetPage: number, append = false) => {
      try {
        const response = await fetch(`/api/songs/${songId}/comments?page=${targetPage}`);
        const payload = (await response.json()) as CommentsResponse;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Failed to load comments');
        }
        setComments((current) => (append ? [...current, ...payload.data!.comments] : payload.data!.comments));
        setPage(payload.data.page);
        setTotal(payload.data.total);
        setTotalPages(payload.data.totalPages);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    },
    [songId]
  );

  useEffect(() => {
    if (initialData) return;
    setIsLoading(true);
    void loadComments(1);
  }, [initialData, loadComments]);

  const submitComment = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;
    if (!viewer) {
      toast.error('Sign in to share your take');
      return;
    }
    const validation = validateCommentContent(trimmedContent);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/songs/${songId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: validation.content }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
        data?: { comment: SongCommentItem };
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Failed to post comment');
      }
      setComments((current) => [payload.data!.comment, ...current]);
      setTotal((current) => current + 1);
      setContent('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const response = await fetch(`/api/songs/${songId}/comments/${commentId}`, { method: 'DELETE' });
      const payload = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to delete comment');
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      setTotal((current) => Math.max(0, current - 1));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment');
    }
  };

  const reportComment = async (commentId: string, reason: 'spam' | 'harassment' | 'misinformation' | 'other') => {
    try {
      const response = await fetch(`/api/songs/${songId}/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const payload = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to report comment');
      toast.success('Report sent for review');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to report comment');
    }
  };

  const addReaction = (reaction: string) => {
    const nextContent = `${content}${content ? ' ' : ''}${reaction}`;
    if (getCommentLength(nextContent) > COMMENT_MAX_LENGTH) return;
    setContent(nextContent);
  };

  return (
    <section className="relative z-20 flex h-fit min-h-0 self-start flex-col overflow-hidden rounded-[2rem] bg-white/58 px-4 py-6 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.28)] ring-1 ring-white/70 backdrop-blur-2xl dark:bg-slate-950/45 dark:shadow-black/35 dark:ring-white/10 md:px-5 lg:px-6 xl:my-6 xl:translate-x-8 2xl:translate-x-12">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-pink-100/18 dark:from-white/5 dark:to-pink-500/5" />
      <header className="relative flex items-end justify-between gap-4 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-pink-600">The internet has thoughts</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
            What’s Your Take?
          </h2>
        </div>
        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white dark:bg-white dark:text-black">
          {total}
        </span>
      </header>

      <div
        className="relative flex gap-1.5 border-t border-slate-900/6 py-3 dark:border-white/8"
        aria-label="Quick reactions"
      >
        {QUICK_REACTIONS.map((reaction) => (
          <button
            key={reaction}
            type="button"
            onClick={() => addReaction(reaction)}
            className="flex size-8 items-center justify-center rounded-full bg-white/75 text-base shadow-sm ring-1 ring-slate-900/7 transition hover:-translate-y-0.5 hover:scale-105 dark:bg-white/10 dark:ring-white/10"
          >
            {reaction}
          </button>
        ))}
      </div>

      {viewer ? (
        <div className="relative flex items-start gap-2.5 rounded-2xl bg-white/72 p-3 shadow-sm ring-1 ring-slate-900/7 dark:bg-white/8 dark:ring-white/10">
          <UserAvatar name={viewer.name} image={viewer.image} className="mt-0.5 size-8" />
          <div className="min-w-0 flex-1">
            <textarea
              value={content}
              onChange={(event) => setContent(truncateCommentContent(event.target.value))}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void submitComment();
              }}
              rows={2}
              placeholder="Say what everyone’s thinking…"
              className="block w-full resize-none bg-transparent text-sm font-medium leading-5 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
            {moderation && !moderation.valid && moderation.code !== 'EMPTY' && (
              <p className="mt-1.5 text-[11px] font-bold text-red-600 dark:text-red-400">{moderation.message}</p>
            )}
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold tabular-nums text-slate-400">
                Keep it sharp · {getCommentLength(content)}/{COMMENT_MAX_LENGTH}
              </span>
              <button
                type="button"
                onClick={() => void submitComment()}
                disabled={!content.trim() || isSubmitting || Boolean(moderation && !moderation.valid)}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-35 dark:bg-white dark:text-black"
              >
                {isSubmitting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Share
              </button>
            </div>
          </div>
        </div>
      ) : (
        <LocaleLink
          href={Routes.Login}
          className="relative flex items-center justify-center gap-2 rounded-2xl bg-white/72 px-4 py-3 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-900/7 transition hover:bg-white dark:bg-white/8 dark:text-white dark:ring-white/10"
        >
          <MessageCircle className="size-4 text-pink-600" />
          Sign in to share your take
        </LocaleLink>
      )}

      <div className="relative mt-4 min-h-0 max-h-[42vh] overflow-y-auto pr-1 [scrollbar-width:thin]">
        {isLoading ? (
          <div className="flex h-16 items-center justify-center text-slate-400">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/30 px-4 py-4 text-center dark:bg-white/4">
            <span className="text-2xl">🍿</span>
            <div className="text-left">
              <p className="font-serif text-base font-bold text-slate-800 dark:text-slate-100">
                Be the first to react.
              </p>
              <p className="text-[11px] font-semibold text-slate-400">This story needs a take.</p>
            </div>
          </div>
        ) : (
          <ol className="space-y-1">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="group flex gap-2.5 rounded-2xl px-2 py-3 transition hover:bg-white/60 dark:hover:bg-white/5"
              >
                <UserAvatar name={comment.author.name} image={comment.author.image} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-xs font-black text-slate-800 dark:text-slate-100">
                      {comment.author.name}
                    </span>
                    <time className="shrink-0 text-[10px] font-semibold text-slate-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">
                    {comment.content}
                  </p>
                </div>
                <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  {viewer && viewer.id !== comment.author.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex size-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10"
                          aria-label="Report comment"
                        >
                          <Flag className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void reportComment(comment.id, 'spam')}>Spam</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void reportComment(comment.id, 'harassment')}>
                          Harassment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void reportComment(comment.id, 'misinformation')}>
                          Misleading claim
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void reportComment(comment.id, 'other')}>
                          Something else
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {comment.canDelete && (
                    <button
                      type="button"
                      onClick={() => void deleteComment(comment.id)}
                      className="flex size-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {page < totalPages && (
          <button
            type="button"
            onClick={() => void loadComments(page + 1, true)}
            className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 py-2 text-xs font-black text-slate-600 transition hover:border-pink-200 hover:text-pink-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            Show more takes
          </button>
        )}
      </div>
    </section>
  );
}
