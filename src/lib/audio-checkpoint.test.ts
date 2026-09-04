import { describe, expect, it } from 'vitest';
import { audioInputHash, readAudioCheckpoint } from './audio-checkpoint';

describe('音频恢复点', () => {
  const hash = audioInputHash('lyrics', 'prompt', 'mp3');
  const checkpoint = { audioInputHash: hash, generatedAudioUrl: 'https://audio.example.com/result.mp3' };
  it('仅复用同一份输入的输出', () => {
    expect(readAudioCheckpoint(checkpoint, hash)).toBe(checkpoint.generatedAudioUrl);
    expect(readAudioCheckpoint(checkpoint, audioInputHash('edited lyrics', 'prompt', 'mp3'))).toBeNull();
    expect(readAudioCheckpoint(checkpoint, audioInputHash('lyrics', 'new prompt', 'mp3'))).toBeNull();
  });
  it('拒绝缺失字段与非网络地址', () => {
    expect(readAudioCheckpoint(null, hash)).toBeNull();
    expect(readAudioCheckpoint({ ...checkpoint, generatedAudioUrl: 'file:///audio.mp3' }, hash)).toBeNull();
  });
});
