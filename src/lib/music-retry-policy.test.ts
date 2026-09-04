import { describe, expect, it } from 'vitest';
import { getFailedProductionLabel, planMusicRetry, resolveProductionRetryStage } from './music-retry-policy';

describe('音乐重试边界', () => {
  it('保存音频后不再显示音频生成失败', () => {
    expect(getFailedProductionLabel('generating_cover', true)).toBe('Audio saved · cover missing');
    expect(getFailedProductionLabel('checking_product', true)).toBe('Release check needs attention');
    expect(getFailedProductionLabel('uploading_audio', false)).toBe('Audio transfer failed');
  });
  it('缺封面时接续制作而不是循环检查', () => {
    expect(resolveProductionRetryStage('failed_quality_check', 'checking_product', true, false)).toBe(
      'generating_cover'
    );
    expect(resolveProductionRetryStage('failed_quality_check', 'checking_product', true, true)).toBe(
      'checking_product'
    );
    expect(resolveProductionRetryStage('generating_cover', 'generating_cover', true, false)).toBeUndefined();
  });
  it('后台仍活跃时拒绝重复生产', () => {
    for (const status of ['queued', 'processing', 'generating_audio', 'uploading_audio', 'generating_cover']) {
      expect(planMusicRetry(status, false, false).error).toContain('already running');
    }
  });
  it('已保存音频直接接续封面', () => {
    expect(planMusicRetry('failed_quality_check', true, false)).toEqual({ resumeStatus: 'audio_uploaded' });
  });
  it('下载失败必须有恢复点，不能静默重复计费', () => {
    expect(planMusicRetry('failed_audio_upload', false, false).error).toContain('Automatic regeneration is disabled');
    expect(planMusicRetry('failed_audio_upload', false, true)).toEqual({ resumeStatus: 'queued' });
  });
  it('完成的歌曲不重复生成', () => {
    expect(planMusicRetry('completed', true, true).error).toContain('already complete');
  });
});
