import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GenerationProgress } from './generation-progress';

const state = vi.hoisted(() => ({ workflowRunId: 'run-1' }));
vi.mock('@/store', () => ({ useCreateStore: (select: (value: typeof state) => unknown) => select(state) }));
vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
const snapshot = {
  id: 'run-1',
  status: 'running',
  currentStage: 'generating_audio',
  createdAt: new Date(Date.now() - 90000).toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: null,
  steps: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  state.workflowRunId = 'run-1';
});
describe('生成进度界面', () => {
  it('展示服务端阶段而不是模拟母带或百分比', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, run: snapshot }) })
    );
    const { container } = render(<GenerationProgress />);
    await screen.findByText('Generating music');
    expect(container.textContent).not.toContain('98%');
    expect(container.textContent).not.toContain('Mastering');
    expect(screen.getByText('Total elapsed')).toBeTruthy();
  });
  it('失败的状态请求不会冒充生成失败', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<GenerationProgress />);
    await screen.findByText(/Status unavailable. Reconnecting/);
  });
  it('切换运行后丢弃上一运行迟到的响应', async () => {
    let resolveOld!: (value: unknown) => void;
    const fetcher = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          })
      )
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, run: { ...snapshot, id: 'run-2', currentStage: 'generating_cover' } }),
      });
    vi.stubGlobal('fetch', fetcher);
    const view = render(<GenerationProgress />);
    state.workflowRunId = 'run-2';
    view.rerender(<GenerationProgress />);
    await screen.findByText('Generating cover');
    resolveOld({ ok: true, json: async () => ({ success: true, run: snapshot }) });
    await waitFor(() => expect(screen.queryByText('Generating music')).toBeNull());
    expect(screen.getByText('Generating cover')).toBeTruthy();
  });
});
