import { describe, expect, it } from 'vitest';
import {
  BUSINESS_TIME_ZONE,
  getBusinessDayKey,
  getBusinessDayStart,
  getNextBusinessDayStart,
  getPreviousBusinessDayKeys,
  parseBusinessDateTimeInput,
} from './business-time';

describe('加州业务时间', () => {
  it('使用 IANA 时区并在 UTC 日期切换前保持加州业务日', () => {
    expect(BUSINESS_TIME_ZONE).toBe('America/Los_Angeles');
    expect(getBusinessDayKey(new Date('2026-08-31T06:59:30.000Z'))).toBe('2026-08-30');
    expect(getBusinessDayKey(new Date('2026-08-31T07:00:00.000Z'))).toBe('2026-08-31');
  });

  it('夏令时按 PDT 的 UTC-7 计算午夜', () => {
    const now = new Date('2026-08-31T06:59:30.000Z');
    expect(getBusinessDayStart(now).toISOString()).toBe('2026-08-30T07:00:00.000Z');
    expect(getNextBusinessDayStart(now).toISOString()).toBe('2026-08-31T07:00:00.000Z');
  });

  it('冬令时自动切换为 PST 的 UTC-8', () => {
    const now = new Date('2026-12-15T18:00:00.000Z');
    expect(getBusinessDayStart(now).toISOString()).toBe('2026-12-15T08:00:00.000Z');
    expect(getNextBusinessDayStart(now).toISOString()).toBe('2026-12-16T08:00:00.000Z');
  });

  it('最近业务日按加州日历递减，不用固定 24 小时推算', () => {
    expect(getPreviousBusinessDayKeys(new Date('2026-03-09T08:30:00.000Z'), 3)).toEqual([
      '2026-03-09',
      '2026-03-08',
      '2026-03-07',
    ]);
  });

  it('后台排期输入始终按加州当地时间解析', () => {
    expect(parseBusinessDateTimeInput('2026-08-31T09:30')?.toISOString()).toBe('2026-08-31T16:30:00.000Z');
    expect(parseBusinessDateTimeInput('2026-12-15T09:30')?.toISOString()).toBe('2026-12-15T17:30:00.000Z');
    expect(parseBusinessDateTimeInput('2026-03-08T02:30')).toBeNull();
  });
});
