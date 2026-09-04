import { describe, expect, it } from 'vitest';
import { getHotSheetScheduledDay } from './hot-sheet-schedule';

describe('洛杉矶每日18点归档', () => {
  it('夏令时使用UTC次日01点', () => {
    expect(getHotSheetScheduledDay(new Date('2026-09-05T01:00:00Z'))).toBe('2026-09-04');
    expect(getHotSheetScheduledDay(new Date('2026-09-05T02:00:00Z'))).toBeNull();
  });
  it('冬令时使用UTC次日02点', () => {
    expect(getHotSheetScheduledDay(new Date('2026-12-05T02:00:00Z'))).toBe('2026-12-04');
    expect(getHotSheetScheduledDay(new Date('2026-12-05T01:00:00Z'))).toBeNull();
  });
  it('支持调度小时内的延迟触发', () => {
    expect(getHotSheetScheduledDay(new Date('2026-09-05T01:59:00Z'))).toBe('2026-09-04');
  });
});
