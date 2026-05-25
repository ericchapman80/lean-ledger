function toDateObject(date) {
  if (date instanceof Date) return new Date(date);
  if (typeof date === 'string') {
    return new Date(date.includes('T') ? date : `${date}T00:00:00`);
  }
  return new Date(date);
}

export function formatDate(date) {
  if (!date) return '';
  const d = toDateObject(date);
  return d.toISOString().split('T')[0];
}

export function getTodayDate() {
  return formatDate(new Date());
}

export function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

export function getDateDaysBefore(date, days) {
  const d = toDateObject(date);
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

export function getStartOfWeek(date = new Date()) {
  const d = toDateObject(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

export function getEndOfWeek(date = new Date()) {
  const start = new Date(`${getStartOfWeek(date)}T00:00:00`);
  start.setDate(start.getDate() + 6);
  return formatDate(start);
}

export function getElapsedWeekDays(date = new Date()) {
  const current = toDateObject(date);
  const start = toDateObject(getStartOfWeek(date));
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
