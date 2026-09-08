import { describe, expect, it } from 'vitest';
import { screeningRequestSchema } from './screening';

describe('筛选请求上限', () => {
  it('拒绝无界批量请求和隐式类型转换', () => {
    for (const input of [
      { limit: 0 },
      { limit: 46 },
      { limit: '40' },
      { autoDismiss: 'false' },
      { retryFailed: 1 },
      { candidateIds: [] },
      { candidateIds: ['unknown'] },
    ]) {
      expect(screeningRequestSchema.safeParse(input).success).toBe(false);
    }
  });
  it('允许默认评估和明确的失败重试', () => {
    expect(screeningRequestSchema.parse({})).toEqual({ limit: 30, autoDismiss: true, retryFailed: false });
    expect(screeningRequestSchema.parse({ retryFailed: true, limit: 40 }).retryFailed).toBe(true);
  });
});
