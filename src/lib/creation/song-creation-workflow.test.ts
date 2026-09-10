import { describe, expect, it } from 'vitest';
import { getFailedGenerationStage, getSongCreationPhase } from './song-creation-workflow';

describe('getSongCreationPhase', () => {
  it.each([
    ['analyzing_source', 'source_preparation'],
    ['editing_lyrics', 'lyrics_studio'],
    ['uploading_audio', 'music_production'],
    ['generating_cover', 'cover_production'],
    ['checking_product', 'product_check'],
    ['published', 'publish_ready'],
  ])('将细粒度步骤 %s 折叠为 %s', (stage, phase) => {
    expect(getSongCreationPhase(stage)).toBe(phase);
  });
});

describe('歌词失败阶段', () => {
  it('保留写作和定稿故障，而不是笼统回退到生成歌词', () => {
    expect(getFailedGenerationStage({ generationStage: 'drafting_lyrics' })).toBe('drafting_lyrics');
    expect(getFailedGenerationStage({ generationStage: 'editing_lyrics' })).toBe('editing_lyrics');
    expect(getFailedGenerationStage({ generationStage: 'published' })).toBeUndefined();
    expect(getFailedGenerationStage(null)).toBeUndefined();
  });
});
