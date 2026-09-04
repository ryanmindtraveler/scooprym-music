import type { MemeHookCandidate } from '@/types/lyric-workshop';
import { describe, expect, it } from 'vitest';
import { resolveCompetingHooks } from './lyrics-hooks';

const hooks: MemeHookCandidate[] = [
  { id: 'image', phrase: 'Flashbulb Alibi', mode: 'caption', whyItWorks: 'Carries the scene', score: 91 },
  { id: 'meme', phrase: 'You Live Here?', mode: 'chant', whyItWorks: 'Easy response', score: 95 },
  { id: 'third', phrase: 'Doorbell Famous', mode: 'punchline', whyItWorks: 'Clean turn', score: 84 },
];

describe('双稿 Hook 解析', () => {
  it('保留规划模型给出的两个不同 Hook', () => {
    const resolved = resolveCompetingHooks(hooks, { A: 'image', B: 'meme' });
    expect(resolved.artisticHook.id).toBe('image');
    expect(resolved.memeHook.id).toBe('meme');
  });

  it('规划模型返回重复或无效 ID 时自动选择不同的高分 Hook', () => {
    const resolved = resolveCompetingHooks(hooks, { A: 'missing', B: 'meme' });
    expect(resolved.artisticHook.id).toBe('meme');
    expect(resolved.memeHook.id).toBe('image');
  });
});
