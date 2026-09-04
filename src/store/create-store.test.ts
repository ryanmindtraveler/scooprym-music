import { beforeEach, describe, expect, it } from 'vitest';
import { type CreationTask, useCreateStore } from './create-store';

function makeTask(id: string, status: CreationTask['status'], createdAt: number): CreationTask {
  return {
    id,
    status,
    title: `Track ${id}`,
    createdAt,
  };
}

describe('create store task persistence', () => {
  it('服务端失败阶段覆盖旧缓存，并在恢复完成后清除旧错误', () => {
    const store = useCreateStore.getState();
    store.addTask({
      ...makeTask('stale-failure', 'failed', 1),
      error: 'Old audio failure',
      workflowStage: 'generating_audio',
    });
    store.mergeTasks([
      {
        ...makeTask('stale-failure', 'failed', 1),
        error: 'Cover missing',
        workflowStage: 'checking_product',
        retryableStage: 'generating_cover',
        workflowRunId: 'run-1',
        audioUrl: 'https://cdn.example/song.mp3',
      },
    ]);
    expect(useCreateStore.getState().tasks[0]).toMatchObject({
      error: 'Cover missing',
      retryableStage: 'generating_cover',
      audioUrl: 'https://cdn.example/song.mp3',
    });
    store.mergeTasks([{ ...makeTask('stale-failure', 'completed', 1), error: undefined, retryableStage: undefined }]);
    expect(useCreateStore.getState().tasks[0].error).toBeUndefined();
    expect(useCreateStore.getState().tasks[0].retryableStage).toBeUndefined();
  });
  beforeEach(() => {
    localStorage.clear();
    useCreateStore.setState({ ownerUserId: null });
    useCreateStore.getState().initializeForUser('admin-a');
  });

  it('never evicts active tasks when completed history reaches its limit', () => {
    const { addTask } = useCreateStore.getState();

    for (let index = 0; index < 12; index += 1) {
      addTask(makeTask(`completed-${index}`, 'completed', index));
    }
    for (let index = 0; index < 3; index += 1) {
      addTask(makeTask(`active-${index}`, 'processing', 100 + index));
    }
    addTask(makeTask('queued-task', 'queued', 200));

    const tasks = useCreateStore.getState().tasks;
    expect(tasks.filter((task) => task.status === 'processing')).toHaveLength(3);
    expect(tasks.some((task) => task.id === 'queued-task')).toBe(true);
    expect(tasks.filter((task) => task.status === 'completed')).toHaveLength(10);
  });

  it('keeps one task when the server record matches the client UUID', () => {
    const store = useCreateStore.getState();
    store.addTask({
      ...makeTask('same-id', 'processing', 1),
      lyrics: 'Local lyrics snapshot',
    });
    store.mergeTasks([
      {
        ...makeTask('same-id', 'completed', 1),
        audioUrl: 'https://cdn.example/song.mp3',
      },
    ]);

    const matchingTasks = useCreateStore.getState().tasks.filter((task) => task.id === 'same-id');
    expect(matchingTasks).toHaveLength(1);
    expect(matchingTasks[0]).toMatchObject({
      status: 'completed',
      lyrics: 'Local lyrics snapshot',
      audioUrl: 'https://cdn.example/song.mp3',
    });
  });

  it('replaces a provisional id with the authoritative server id', () => {
    const store = useCreateStore.getState();
    store.addTask(makeTask('client-id', 'processing', 1));
    store.setMusicId('client-id');
    store.replaceTaskId('client-id', 'server-id', { status: 'processing' });

    const state = useCreateStore.getState();
    expect(state.tasks.map((task) => task.id)).toEqual(['server-id']);
    expect(state.musicId).toBe('server-id');
  });

  it('clears sensitive drafts and tasks when the signed-in user changes', () => {
    const store = useCreateStore.getState();
    store.setNewsContent('Private source for admin A');
    store.addTask(makeTask('private-task', 'processing', 1));

    useCreateStore.getState().initializeForUser('admin-b');

    const nextState = useCreateStore.getState();
    expect(nextState.ownerUserId).toBe('admin-b');
    expect(nextState.newsContent).toBe('');
    expect(nextState.tasks).toEqual([]);
  });

  it('rejects browser objects accidentally passed into id setters', () => {
    const store = useCreateStore.getState();

    expect(() => store.setMusicId(window as unknown as string)).not.toThrow();
    expect(() => store.setWorkflowRunId(window as unknown as string)).not.toThrow();

    expect(useCreateStore.getState().musicId).toBeNull();
    expect(useCreateStore.getState().workflowRunId).toBeNull();
  });

  it('removes non-serializable task fields before persisting', () => {
    const store = useCreateStore.getState();
    store.addTask({
      ...makeTask('safe-task', 'processing', 1),
      lyrics: window as unknown as string,
      newsContent: document.body as unknown as string,
    });

    const task = useCreateStore.getState().tasks[0];
    expect(task.id).toBe('safe-task');
    expect(task.lyrics).toBeUndefined();
    expect(task.newsContent).toBeUndefined();
    expect(() => JSON.stringify(JSON.parse(localStorage.getItem('create-page-storage') || '{}'))).not.toThrow();
  });
});
