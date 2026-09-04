import { describe, expect, it } from 'vitest';
import { formatElapsed, getConfirmedProgress, type WorkflowProgress } from './generation-progress';

const run: WorkflowProgress = {
  id: 'test',
  status: 'running',
  currentStage: 'drafting_lyrics',
  createdAt: '2026-09-04T00:00:00Z',
  updatedAt: '2026-09-04T00:01:00Z',
  completedAt: null,
  steps: [
    {
      stage: 'drafting_lyrics',
      status: 'completed',
      startedAt: '2026-09-04T00:01:00Z',
      completedAt: '2026-09-04T00:01:00Z',
      attempt: 1,
    },
  ],
};
describe('真实生成进度', () => {
  it('完成检查点不是正在执行的阶段', () => {
    expect(getConfirmedProgress(run).completedCheckpoint).toBe(true);
    expect(getConfirmedProgress(run).terminal).toBe(false);
  });
  it('读取同阶段最新尝试', () => {
    const result = getConfirmedProgress({
      ...run,
      steps: [...run.steps, { ...run.steps[0], status: 'running', attempt: 2 }],
    });
    expect(result.step?.attempt).toBe(2);
    expect(result.completedCheckpoint).toBe(false);
  });
  it('失败与完成后停止计时', () => {
    expect(getConfirmedProgress({ ...run, status: 'failed' }).end).toBe(Date.parse(run.updatedAt));
    expect(getConfirmedProgress({ ...run, status: 'completed', completedAt: '2026-09-04T00:02:00Z' }).end).toBe(
      Date.parse('2026-09-04T00:02:00Z')
    );
  });
  it('使用真实经过时间，支持超过一小时和无效时间', () => {
    expect(formatElapsed(run.createdAt, Date.parse('2026-09-04T01:01:09Z'))).toBe('61:09');
    expect(formatElapsed(run.createdAt, 0)).toBe('0:00');
    expect(formatElapsed('invalid', 0)).toBe('—');
  });
});
