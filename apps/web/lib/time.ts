import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const APP_TIMEZONE = 'Asia/Jakarta';

export function now() {
  // TODO: expose richer scheduling helpers
  return dayjs().tz(APP_TIMEZONE);
}
