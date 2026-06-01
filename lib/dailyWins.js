export const DAILY_WIN_DEFINITIONS = [
  { key: 'workoutCompleted', label: 'Workout', inputType: 'boolean' },
  { key: 'readingCompleted', label: 'Reading', inputType: 'boolean' },
  { key: 'prayerCompleted', label: 'Prayer', inputType: 'boolean' },
  { key: 'sleepHours', label: 'Sleep', inputType: 'number' },
  { key: 'energyLevel', label: 'Energy', inputType: 'rating' },
  { key: 'sorenessLevel', label: 'Soreness', inputType: 'rating' },
];

export const DEFAULT_DAILY_WINS_TIME = '20:00';

export function getEmptyDailyWins(date, metric = null) {
  return {
    recordedAt: metric?.recordedAt || (date ? `${date}T${DEFAULT_DAILY_WINS_TIME}` : ''),
    workoutCompleted: metric?.workoutCompleted == null ? '' : String(metric.workoutCompleted),
    readingCompleted: metric?.readingCompleted == null ? '' : String(metric.readingCompleted),
    prayerCompleted: metric?.prayerCompleted == null ? '' : String(metric.prayerCompleted),
    sleepHours: metric?.sleepHours ?? '',
    energyLevel: metric?.energyLevel ?? '',
    sorenessLevel: metric?.sorenessLevel ?? '',
  };
}

export function isDailyWinComplete(definition, values) {
  const raw = values?.[definition.key];

  if (definition.inputType === 'boolean') {
    return raw === true || raw === 'true';
  }

  if (definition.inputType === 'number') {
    return raw !== '' && raw != null && Number(raw) > 0;
  }

  if (definition.inputType === 'rating') {
    return raw !== '' && raw != null && Number.isFinite(Number(raw));
  }

  return false;
}

export function getDailyWinsSummary(values) {
  const total = DAILY_WIN_DEFINITIONS.length;
  const completed = DAILY_WIN_DEFINITIONS.filter((definition) => isDailyWinComplete(definition, values)).length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

