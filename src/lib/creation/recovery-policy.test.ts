import { describe, expect, it } from 'vitest';
import { planMusicRetry } from './music-retry-policy';
import { planStalledMusicRecovery } from './recovery-policy';

describe('中断任务恢复边界', () => {
  it('只自动投递有恢复点的等待阶段', () => {
    for (const status of ['audio_generated', 'audio_uploaded'])
      expect(planStalledMusicRecovery(status)).toMatchObject({ dispatch: true, status });
    for (const status of [
      'queued',
      'generating_audio',
      'processing',
      'uploading_audio',
      'generating_cover',
      'finalizing',
    ])
      expect(planStalledMusicRecovery(status).dispatch).toBe(false);
  });
  it('音乐结果不明时阻止自动重做，保存音频或恢复点后才可接续', () => {
    expect(planStalledMusicRecovery('generating_audio').status).toBe('failed_interrupted');
    expect(planMusicRetry('failed_interrupted', false, false).error).toContain('Automatic regeneration is disabled');
    expect(planMusicRetry('failed_interrupted', false, true)).toEqual({ resumeStatus: 'queued' });
    expect(planMusicRetry('failed_interrupted', true, false)).toEqual({ resumeStatus: 'audio_uploaded' });
  });
});
