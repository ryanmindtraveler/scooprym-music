import { getBusinessDateParts, getBusinessDayKey } from './business-time';

/** 两个 UTC 触发点中，只有对应洛杉矶 18 时的那个执行抓取。 */
export function getHotSheetScheduledDay(now = new Date()) {
  return getBusinessDateParts(now).hour === 18 ? getBusinessDayKey(now) : null;
}
