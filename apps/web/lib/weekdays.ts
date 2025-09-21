export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, { short: string; label: string }> = {
  MONDAY: { short: 'Sen', label: 'Senin' },
  TUESDAY: { short: 'Sel', label: 'Selasa' },
  WEDNESDAY: { short: 'Rab', label: 'Rabu' },
  THURSDAY: { short: 'Kam', label: 'Kamis' },
  FRIDAY: { short: 'Jum', label: 'Jumat' },
  SATURDAY: { short: 'Sab', label: 'Sabtu' },
  SUNDAY: { short: 'Min', label: 'Minggu' }
};

export const WEEKDAY_ORDER: Record<Weekday, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6
};

export const WEEKDAY_TO_DAYJS_INDEX: Record<Weekday, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0
};

export function sortByWeekdayAndStartTime<T extends { dayOfWeek: Weekday; startTime: string }>(
  a: T,
  b: T
) {
  const dayDifference = WEEKDAY_ORDER[a.dayOfWeek] - WEEKDAY_ORDER[b.dayOfWeek];

  if (dayDifference !== 0) {
    return dayDifference;
  }

  return a.startTime.localeCompare(b.startTime);
}
