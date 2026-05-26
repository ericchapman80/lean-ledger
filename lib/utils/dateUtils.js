const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T/;
const EXPLICIT_TIMEZONE_PATTERN = /(Z|[+-]\d{2}:\d{2})$/;

function toDateObject(date) {
  if (date instanceof Date) return new Date(date);
  if (typeof date === 'string') {
    return new Date(date.includes('T') ? date : `${date}T00:00:00`);
  }
  return new Date(date);
}

function formatDateParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getResolvedTimeZone(timeZone = null) {
  if (timeZone) return timeZone;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatDate(date, { timeZone = null } = {}) {
  if (!date) return '';
  if (typeof date === 'string') {
    if (DATE_ONLY_PATTERN.test(date)) return date;
    if (LOCAL_DATETIME_PATTERN.test(date) && !EXPLICIT_TIMEZONE_PATTERN.test(date)) {
      return date.slice(0, 10);
    }
  }
  const d = toDateObject(date);
  if (Number.isNaN(d.getTime())) return '';
  return formatDateParts(d, getResolvedTimeZone(timeZone));
}

export function getTodayDate(options = {}) {
  return formatDate(new Date(), options);
}

export function getDateDaysAgo(days, options = {}) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date, options);
}

export function getDateDaysBefore(date, days, options = {}) {
  const d = toDateObject(date);
  d.setDate(d.getDate() - days);
  return formatDate(d, options);
}

export function getStartOfWeek(date = new Date(), options = {}) {
  const d = toDateObject(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d, options);
}

export function getEndOfWeek(date = new Date(), options = {}) {
  const start = new Date(`${getStartOfWeek(date, options)}T00:00:00`);
  start.setDate(start.getDate() + 6);
  return formatDate(start, options);
}

export function getElapsedWeekDays(date = new Date(), options = {}) {
  const current = toDateObject(date);
  const start = toDateObject(getStartOfWeek(date, options));
  const diffMs = current.setHours(0, 0, 0, 0) - start.getTime();
  return Math.floor(diffMs / 86400000) + 1;
}

export function formatDisplayDate(date) {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function isToday(date) {
  return date === getTodayDate();
}

export function getRequestTimeZone(request) {
  return request?.headers?.get('x-time-zone') || null;
}

export function getRequestLocalDate(request) {
  const headerDate = request?.headers?.get('x-local-date');
  if (headerDate && DATE_ONLY_PATTERN.test(headerDate)) {
    return headerDate;
  }
  return getTodayDate({ timeZone: getRequestTimeZone(request) });
}
