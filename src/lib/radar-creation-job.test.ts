import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  db: vi.fn(),
  configured: vi.fn(),
  publish: vi.fn(),
  lyrics: vi.fn(),
  submit: vi.fn(),
  workflow: vi.fn(),
  start: vi.fn(),
  checkpoint: vi.fn(),
  complete: vi.fn(),
  fail: vi.fn(),
  source: vi.fn(),
  recommend: vi.fn(),
  stageStart: vi.fn(),
  stageComplete: vi.fn(),
}));
vi.mock('@/db', () => ({ getDb: mocks.db }));
vi.mock('@/lib/queue', () => ({
  canUseQStash: mocks.configured,
  getWorkerUrl: () => 'https://example.com/worker',
  qstash: { publishJSON: mocks.publish },
}));
vi.mock('@/ai/text/lib/generation', () => ({ generateLyrics: mocks.lyrics }));
vi.mock('@/ai/text/lib/source-analysis', () => ({
  prepareSourceMaterial: mocks.source,
  recommendSourceStyle: mocks.recommend,
}));
vi.mock('@/lib/submit-music-generation', () => ({ submitMusicGeneration: mocks.submit }));
vi.mock('@/lib/song-creation-workflow', () => ({
  startLyricsWorkflow: mocks.start,
  getWorkflowRun: mocks.workflow,
  recordLyricsCheckpoint: mocks.checkpoint,
  completeLyricsWorkflow: mocks.complete,
  failWorkflowStep: mocks.fail,
  startWorkflowStage: mocks.stageStart,
  completeWorkflowStage: mocks.stageComplete,
}));
import { dispatchRadarCreation, enqueueRadarCreation, processRadarCreation } from './radar-creation-job';
const savedLyrics = '[Verse 1]\nOne line\nTwo lines\nThree lines\nFour lines\n[Hook]\nFive lines\nSix lines\nSeven lines\nEight lines';

describe('热点后台创作队列', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.configured.mockReturnValue(true);
    mocks.workflow.mockResolvedValue({
      steps: [{ stage: 'planning_lyrics', status: 'completed', outputMetadata: { plan: true } }],
    });
  });
  it('无可靠队列时拒绝入队，不写数据库或调用模型', async () => {
    mocks.configured.mockReturnValue(false);
    await expect(enqueueRadarCreation('candidate', 'admin')).rejects.toThrow('Background queue');
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.lyrics).not.toHaveBeenCalled();
  });
  it('不同新闻使用独立消息ID，但共用并发上限', async () => {
    await Promise.all([dispatchRadarCreation('a', 0), dispatchRadarCreation('b', 0)]);
    expect(mocks.publish.mock.calls.map(([request]) => request.deduplicationId)).toEqual(['radar-a-0', 'radar-b-0']);
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({ flowControl: { key: 'scooprym-radar-lyrics', parallelism: 2 } })
    );
  });
  function workerSetup(result: unknown = null) {
    const job = {
      candidateId: 'candidate',
      userId: 'admin',
      runId: 'run',
      songId: 'song',
      sourceTitle: 'News',
      sourceUrl: 'https://example.com/news',
      direction: 'Hip-Hop',
      sequence: 0,
      lyricResult: result,
    };
    const returning = vi.fn().mockResolvedValue([job]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    mocks.db.mockResolvedValue({
      update: () => ({ set }),
      select: () => ({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([{ role: 'admin' }]) }) }) }),
    });
    mocks.start.mockResolvedValue({ runId: 'run', stepId: 'step' });
    mocks.fail.mockResolvedValue(undefined);
    mocks.submit.mockResolvedValue(new Response('{}', { status: 202 }));
    return { set };
  }
  it('已有歌词只提交原songId，不重新写词', async () => {
    const { set } = workerSetup({ title: 'Title', lyrics: savedLyrics, summary: 'Summary' });
    await processRadarCreation('candidate');
    expect(mocks.lyrics).not.toHaveBeenCalled();
    expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({ songId: 'song', lyrics: savedLyrics }), {
      id: 'admin',
      role: 'admin',
    });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'handed_off' }));
  });
  it('坏的缓存和运行歌词不能绕过写作恢复', async () => {
    workerSetup({ title: 'Bad', lyrics: '[Hook]\ncraftIssues: []', summary: 'Summary' });
    mocks.workflow.mockResolvedValue({ title: 'Bad', summary: 'Summary', lyrics: '[Hook]\ncraftIssues: []',
      steps: [{ stage: 'planning_lyrics', status: 'completed', outputMetadata: { plan: true } }] });
    mocks.lyrics.mockResolvedValue({ title: 'Recovered', summary: 'Summary', lyrics: savedLyrics });
    await processRadarCreation('candidate');
    expect(mocks.lyrics).toHaveBeenCalledOnce();
    expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({ lyrics: savedLyrics, songId: 'song' }), expect.anything());
  });

  it('保留音乐入口 422 的具体错误', async () => {
    workerSetup({ title: 'Title', lyrics: savedLyrics, summary: 'Summary' });
    mocks.submit.mockResolvedValue(new Response(JSON.stringify({ error: 'Lyrics need at least 8 sung lines; found 4.' }), { status: 422 }));
    await expect(processRadarCreation('candidate')).rejects.toThrow('Music submission failed (422): Lyrics need at least 8 sung lines; found 4.');
  });
  it('保存检查点后投递下一步，不把正常暂停标成失败', async () => {
    const { set } = workerSetup();
    mocks.lyrics.mockImplementation(async ({ onCheckpoint }) => {
      await onCheckpoint('planning_lyrics', { plan: true });
    });
    await processRadarCreation('candidate');
    expect(mocks.checkpoint).toHaveBeenCalledWith('run', 'planning_lyrics', { plan: true });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'queued', sequence: 1 }));
    expect(mocks.publish).toHaveBeenCalledWith(expect.objectContaining({ deduplicationId: 'radar-candidate-1' }));
    expect(mocks.fail).not.toHaveBeenCalled();
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it('歌词错误保留失败状态且不生成音频', async () => {
    const { set } = workerSetup();
    mocks.lyrics.mockRejectedValue(new Error('Provider failed'));
    await expect(processRadarCreation('candidate')).rejects.toThrow('Provider failed');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed', leaseId: null }));
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it('新新闻先推荐风格与配方并保存，不立即写词', async () => {
    workerSetup();
    mocks.workflow.mockResolvedValue(undefined);
    mocks.source.mockResolvedValue({
      text: 'A viral absurd game about finding a needle.',
      url: 'https://example.com/news',
    });
    mocks.recommend.mockResolvedValue({
      styleId: 'algorithm_circus',
      tags: ['circus trap', 'tuba bass'],
      reason: 'Absurd game',
    });
    mocks.stageStart.mockResolvedValue('style-step');
    await processRadarCreation('candidate');
    expect(mocks.recommend).toHaveBeenCalledWith(
      'https://example.com/news',
      'News',
      'en',
      expect.objectContaining({ text: expect.stringContaining('needle') })
    );
    expect(mocks.stageComplete).toHaveBeenCalledWith(
      'run',
      'style-step',
      'source_ready',
      expect.objectContaining({
        metadata: expect.objectContaining({
          direction: 'circus trap, tuba bass',
          variantId: expect.any(String),
          version: 1,
        }),
      })
    );
    expect(mocks.lyrics).not.toHaveBeenCalled();
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it('恢复时歌词与音乐使用同一个已保存方向和配方', async () => {
    workerSetup();
    mocks.workflow.mockResolvedValue({
      steps: [
        {
          stage: 'source_ready',
          status: 'completed',
          outputMetadata: {
            version: 1,
            direction: 'circus trap, tuba bass',
            styleId: 'algorithm_circus',
            reason: 'Absurd',
            variantId: 'saved-variant',
            source: { text: 'Saved news', url: 'https://example.com/news' },
          },
        },
      ],
    });
    mocks.lyrics.mockResolvedValue({
      title: 'Song',
      summary: 'Summary',
      lyrics: 'Lyrics',
      source: { text: 'Saved news' },
      workshop: {},
    });
    await processRadarCreation('candidate');
    expect(mocks.recommend).not.toHaveBeenCalled();
    expect(mocks.source).not.toHaveBeenCalled();
    expect(mocks.lyrics).toHaveBeenCalledWith(
      expect.objectContaining({
        directionPrompt: 'circus trap, tuba bass',
        productionVariantId: 'saved-variant',
        preparedSource: expect.objectContaining({ text: 'Saved news' }),
      })
    );
    expect(mocks.submit).toHaveBeenCalledWith(
      expect.objectContaining({ musicDirectionPrompt: 'circus trap, tuba bass', productionVariantId: 'saved-variant' }),
      expect.anything()
    );
  });
});
