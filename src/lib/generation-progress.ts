export interface WorkflowProgress {
  id: string;
  status: string;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  steps: { stage: string; status: string; startedAt: string; completedAt: string | null; attempt: number }[];
}

export function formatElapsed(start: string, end: number) {
  const timestamp = Date.parse(start);
  if (!Number.isFinite(timestamp)) return '—';
  const seconds = Math.max(0, Math.floor((end - timestamp) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** 检查点只表示已经完成，不代表正在执行该模型步骤。 */
export function getConfirmedProgress(run: WorkflowProgress) {
  const step = [...run.steps].reverse().find((item) => item.stage === run.currentStage);
  const terminal = run.status === 'failed' || run.status === 'completed';
  return {
    step,
    terminal,
    completedCheckpoint: !terminal && step?.status === 'completed',
    end: terminal ? Date.parse(run.completedAt || run.updatedAt) : null,
  };
}
