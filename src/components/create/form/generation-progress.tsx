'use client';

import { type WorkflowProgress, formatElapsed, getConfirmedProgress } from '@/lib/generation-progress';
import { cn } from '@/lib/utils';
import { useCreateStore } from '@/store';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

const STAGES: Record<string, [string, string]> = {
  source_ready: ['Source prepared', '新闻素材已准备'],
  generating_lyrics: ['Lyrics production', '歌词创作'],
  analyzing_source: ['Source analysis', '新闻分析'],
  planning_lyrics: ['Creative planning', '创作策划'],
  drafting_lyrics: ['Writing lyrics', '撰写歌词'],
  editing_lyrics: ['Lyric review', '歌词审查'],
  verifying_lyrics: ['Lyric verification', '歌词校验'],
  lyrics_review: ['Lyrics need attention', '歌词需要处理'],
  lyrics_ready: ['Lyrics ready', '歌词已准备'],
  queued_audio: ['Music queued', '音乐排队中'],
  generating_audio: ['Generating music', '生成音乐'],
  uploading_audio: ['Saving audio', '保存音频'],
  audio_uploaded: ['Audio saved', '音频已保存'],
  generating_cover: ['Generating cover', '生成封面'],
  finalizing: ['Saving song', '保存歌曲'],
  checking_product: ['Checking release', '成品检查'],
  publish_ready: ['Ready to publish', '可以发布'],
  published: ['Published', '已发布'],
  completed: ['Completed', '已完成'],
  failed: ['Failed', '失败'],
};

export function GenerationProgress({ className }: { className?: string }) {
  const runId = useCreateStore((state) => state.workflowRunId);
  return <RunProgress key={runId || 'pending'} runId={runId} className={className} />;
}

function RunProgress({ runId, className }: { runId: string | null; className?: string }) {
  const zh = useLocale().startsWith('zh');
  const [run, setRun] = useState<WorkflowProgress | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  useEffect(() => {
    setNow(Date.now());
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);
  useEffect(() => {
    if (!runId) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    async function poll() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`/api/generate/workflows/${encodeURIComponent(runId!)}?view=progress`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Status unavailable');
        const payload = await response.json();
        if (!payload.success || payload.run?.id !== runId) throw new Error('Mismatched run');
        if (!disposed) {
          setRun(payload.run);
          setDisconnected(false);
        }
      } catch {
        if (!disposed) setDisconnected(true);
      } finally {
        clearTimeout(timeout);
        // 重试请求刚提交时可能仍读到上一轮失败状态；继续同步到父组件结束跟踪。
        if (!disposed) timer = setTimeout(poll, 4000);
      }
    }
    void poll();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
    };
  }, [runId]);
  const confirmed = run ? getConfirmedProgress(run) : null;
  const stage = run ? STAGES[run.currentStage]?.[zh ? 1 : 0] || (zh ? '等待阶段更新' : 'Awaiting stage update') : '';
  const label = !run
    ? zh
      ? '等待服务端确认任务'
      : 'Waiting for server confirmation'
    : run.status === 'failed'
      ? `${stage} · ${zh ? '失败' : 'Failed'}`
      : confirmed?.completedCheckpoint
        ? `${stage} · ${zh ? '已完成，等待下一阶段' : 'Done; awaiting next stage'}`
        : stage;
  const Icon = disconnected || run?.status === 'failed' ? AlertCircle : confirmed?.terminal ? CheckCircle2 : Loader2;
  const end = confirmed?.end ?? now;
  return (
    <div
      className={cn(
        'w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-slate-900 dark:border-violet-800 dark:bg-violet-950 dark:text-slate-100',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5" role="status" aria-live="polite">
          <Icon
            className={cn(
              'mt-0.5 size-4 shrink-0 text-violet-600',
              !confirmed?.terminal && !disconnected && 'motion-safe:animate-spin'
            )}
          />
          <div className="min-w-0 text-sm font-semibold">
            {label}
            <p className="mt-1 text-xs font-normal text-slate-600 dark:text-slate-300">
              {disconnected
                ? zh
                  ? '状态暂时无法同步，正在重连；不代表生成失败。'
                  : 'Status unavailable. Reconnecting; this does not mean generation failed.'
                : zh
                  ? '按服务端记录更新，不估算完成百分比。'
                  : 'Server-confirmed progress. No estimated percentage.'}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-slate-500 dark:text-slate-400">{zh ? '运行总耗时' : 'Total elapsed'}</div>
          <div className="font-mono text-lg font-semibold tabular-nums">
            {run && end ? formatElapsed(run.createdAt, end) : '—'}
          </div>
        </div>
      </div>
      {run && now && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-violet-200/60 pt-2 text-xs text-slate-600 dark:text-slate-300">
          {!confirmed?.terminal && (
            <span>
              {zh ? '距最近阶段更新' : 'Since last stage update'}:{' '}
              <span className="font-mono tabular-nums">{formatElapsed(run.updatedAt, now)}</span>
            </span>
          )}
          {confirmed?.step?.status === 'running' && !confirmed.terminal && (
            <span>
              {zh ? '本阶段耗时' : 'Stage elapsed'}:{' '}
              <span className="font-mono tabular-nums">{formatElapsed(confirmed.step.startedAt, now)}</span>
            </span>
          )}
          {(confirmed?.step?.attempt || 0) > 1 && (
            <span>
              {zh ? '本阶段尝试次数' : 'Stage attempt'}: {confirmed?.step?.attempt}
            </span>
          )}
          <span>{zh ? '总耗时包含排队及重试等待' : 'Total includes queue and retry waits'}</span>
        </div>
      )}
    </div>
  );
}
