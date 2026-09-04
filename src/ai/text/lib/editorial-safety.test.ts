import { describe, expect, it, vi } from 'vitest';
import {
  EDITORIAL_SAFETY_POLICY,
  type EditorialSafety,
  editorialSafetyError,
  resolveEditorialSafety,
} from './editorial-safety';

describe('宽松娱乐讽刺规则', () => {
  const quotedJoke: EditorialSafety = {
    decision: 'review',
    reason: "Creepy is Miley's public joke, not stalking evidence.",
    riskFlags: ['Attribute the quote to Miley; do not imply actual stalking.'],
  };
  it('公开玩笑可复核放行，引用约束仍传入写作', async () => {
    const reassess = vi.fn(async () => ({
      decision: 'allow' as const,
      reason: 'Sourced public teasing',
      riskFlags: [],
    }));
    const result = await resolveEditorialSafety(quotedJoke, reassess);
    expect(result.decision).toBe('allow');
    expect(result.riskFlags).toEqual(quotedJoke.riskFlags);
    expect(reassess).toHaveBeenCalledTimes(1);
  });
  it.each(['allow', 'block'] as const)('%s 不新增复核调用，也不绕过硬边界', async (decision) => {
    const reassess = vi.fn();
    const initial = { ...quotedJoke, decision };
    expect(await resolveEditorialSafety(initial, reassess)).toEqual(initial);
    expect(reassess).not.toHaveBeenCalled();
  });
  it('关键证据仍然不足时不盲目放行，不反复调用', async () => {
    const reassess = vi.fn(async () => quotedJoke);
    expect((await resolveEditorialSafety(quotedJoke, reassess)).decision).toBe('review');
    expect(reassess).toHaveBeenCalledTimes(1);
    expect(editorialSafetyError(quotedJoke).message).toContain('clearer evidence');
    expect(editorialSafetyError({ ...quotedJoke, decision: 'block' }).message).toContain('safety boundary');
  });
  it('复核服务错误不能自动变成放行', async () => {
    await expect(
      resolveEditorialSafety(quotedJoke, async () => {
        throw new Error('Provider unavailable');
      })
    ).rejects.toThrow('Provider unavailable');
  });
  it('明确允许粗口、毒舌、角色对白，同时保留用户指定禁区', () => {
    expect(EDITORIAL_SAFETY_POLICY).toContain('Default to ALLOW');
    expect(EDITORIAL_SAFETY_POLICY).toContain('profanity');
    expect(EDITORIAL_SAFETY_POLICY).toContain('fictional character dialogue');
    expect(EDITORIAL_SAFETY_POLICY).toContain('government/military');
    expect(EDITORIAL_SAFETY_POLICY).toContain('fabricated serious accusations');
  });
});
