export const DAILY_WIN_DEFINITIONS = [
  { key: 'workoutCompleted', label: 'Workout', inputType: 'boolean' },
  { key: 'readingCompleted', label: 'Reading', inputType: 'boolean' },
  { key: 'prayerCompleted', label: 'Prayer', inputType: 'boolean' },
  { key: 'sleepHours', label: 'Sleep', inputType: 'number' },
  { key: 'energyLevel', label: 'Energy', inputType: 'rating' },
  { key: 'sorenessLevel', label: 'Soreness', inputType: 'rating' },
];

export const DAILY_WIN_DEFINITION_MAP = Object.fromEntries(
  DAILY_WIN_DEFINITIONS.map((definition) => [definition.key, definition]),
);

export const DEFAULT_DAILY_WIN_KEYS = DAILY_WIN_DEFINITIONS.map((definition) => definition.key);

export const DEFAULT_DAILY_WINS_TIME = '20:00';

export function normalizeDailyWinKeys(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return DEFAULT_DAILY_WIN_KEYS;

  const seen = new Set();
  const normalized = keys.filter((key) => {
    if (!DAILY_WIN_DEFINITION_MAP[key] || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return normalized.length > 0 ? normalized : DEFAULT_DAILY_WIN_KEYS;
}

export function getActiveDailyWinDefinitions(activeKeys) {
  return normalizeDailyWinKeys(activeKeys)
    .map((key) => DAILY_WIN_DEFINITION_MAP[key])
    .filter(Boolean);
}

export function getCustomHabitDefinitionKey(habitId) {
  return `habit:${habitId}`;
}

export function buildCustomDailyWinDefinitions(habits = []) {
  return habits
    .filter((habit) => habit?.isActive !== false)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((habit) => ({
      key: getCustomHabitDefinitionKey(habit.id),
      label: habit.name,
      inputType: 'boolean',
      habitId: habit.id,
      source: 'custom',
    }));
}

export function mergeDailyWinDefinitions(activeSuggestedKeys, customHabits = []) {
  return [
    ...getActiveDailyWinDefinitions(activeSuggestedKeys),
    ...buildCustomDailyWinDefinitions(customHabits),
  ];
}

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

export function getDailyWinsValues(date, metric = null, customHabits = [], dailyHabitLogs = []) {
  const base = getEmptyDailyWins(date, metric);

  const customValues = Object.fromEntries(
    buildCustomDailyWinDefinitions(customHabits).map((definition) => {
      const matchingLog = dailyHabitLogs.find((log) => log.habitId === definition.habitId);
      return [definition.key, matchingLog?.completed == null ? '' : String(Boolean(matchingLog.completed))];
    }),
  );

  return {
    ...base,
    ...customValues,
  };
}

export function getCustomDailyHabitPayloads(values, customHabits = [], date) {
  return buildCustomDailyWinDefinitions(customHabits)
    .map((definition) => {
      const raw = values[definition.key];
      if (raw === '') return null;
      return {
        habitId: definition.habitId,
        date,
        completed: raw === true || raw === 'true',
      };
    })
    .filter(Boolean);
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

export function getDailyWinsSummary(values, definitions = DAILY_WIN_DEFINITIONS) {
  const total = definitions.length;
  const completed = definitions.filter((definition) => isDailyWinComplete(definition, values)).length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
