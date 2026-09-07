import { describe, expect, it } from 'vitest';
import { getSongCreationPhase } from './song-creation-workflow';

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
