/** ScoopRYM 的统一业务时区。数据库仍保存 UTC 时间点，业务日历按美国加州时间解释。 */
export const BUSINESS_TIME_ZONE = 'America/Los_Angeles';
export const BUSINESS_TIME_ZONE_LABEL = 'PT';

type BusinessDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function getBusinessDateParts(date = new Date()): BusinessDateParts {
  const values = Object.fromEntries(
    partsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function calendarKey({ year, month, day }: Pick<BusinessDateParts, 'year' | 'month' | 'day'>) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 将加州当地的墙上时间转换为真实 UTC 时间点，并自动处理 PST/PDT。 */
function businessWallTimeToInstant(parts: BusinessDateParts) {
  const desiredWallTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let instant = desiredWallTime;

  // 两轮校正足以跨越 PST/PDT 偏移；不用写死 UTC-8 或 UTC-7。
  for (let index = 0; index < 2; index += 1) {
    const actual = getBusinessDateParts(new Date(instant));
    const actualWallTime = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    instant += desiredWallTime - actualWallTime;
  }

  return new Date(instant);
}

export function getBusinessDayKey(date = new Date()) {
  return calendarKey(getBusinessDateParts(date));
}

export function getBusinessDayStart(date = new Date()) {
  const { year, month, day } = getBusinessDateParts(date);
  return businessWallTimeToInstant({ year, month, day, hour: 0, minute: 0, second: 0 });
}

export function getNextBusinessDayStart(date = new Date()) {
  const { year, month, day } = getBusinessDateParts(date);
  const nextCalendarDay = new Date(Date.UTC(year, month - 1, day + 1));
  return businessWallTimeToInstant({
    year: nextCalendarDay.getUTCFullYear(),
    month: nextCalendarDay.getUTCMonth() + 1,
    day: nextCalendarDay.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  });
}

export function getPreviousBusinessDayKeys(date = new Date(), count = 3) {
  const { year, month, day } = getBusinessDateParts(date);
  return Array.from({ length: count }, (_, index) => {
    const calendarDay = new Date(Date.UTC(year, month - 1, day - index));
    return calendarKey({
      year: calendarDay.getUTCFullYear(),
      month: calendarDay.getUTCMonth() + 1,
      day: calendarDay.getUTCDate(),
    });
  });
}

export function formatBusinessDate(
  date: Date | number | string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
) {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: BUSINESS_TIME_ZONE }).format(new Date(date));
}

export function formatBusinessDateTime(date: Date | number | string) {
  return formatBusinessDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/** 将管理后台 datetime-local 输入按加州当地时间解析，而不是按管理员电脑时区解析。 */
export function parseBusinessDateTimeInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second = '0'] = match;
  const requested = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
  const instant = businessWallTimeToInstant(requested);
  const resolved = getBusinessDateParts(instant);

  return Object.entries(requested).every(([key, value]) => resolved[key as keyof BusinessDateParts] === value)
    ? instant
    : null;
}
