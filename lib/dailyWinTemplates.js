import { DEFAULT_DAILY_WIN_KEYS } from './dailyWins.js';
import { getDateDaysBefore } from './utils/dateUtils.js';

export const DAILY_WIN_TEMPLATES = [
  {
    key: 'lean_recomp_foundations',
    name: 'Lean Recomp Foundations',
    description: 'Keep the focus on the core recovery signals that support body recomposition.',
    defaultDurationDays: 28,
    suggestedKeys: ['workoutCompleted', 'sleepHours', 'energyLevel', 'sorenessLevel'],
    customHabits: [
      { name: 'Protein Goal Hit', isActive: true },
      { name: 'Water Goal Hit', isActive: true },
    ],
  },
  {
    key: 'faith_and_fitness',
    name: 'Faith + Fitness',
    description: 'Blend training consistency with prayer and reading so the daily loop reflects both.',
    defaultDurationDays: 30,
    suggestedKeys: ['workoutCompleted', 'readingCompleted', 'prayerCompleted', 'sleepHours', 'energyLevel'],
    customHabits: [
      { name: 'Mobility', isActive: true },
    ],
  },
  {
    key: 'minimalist_reset',
    name: 'Minimalist 3-Habit Reset',
    description: 'Strip the day back to the smallest repeatable set when consistency needs to reset.',
    defaultDurationDays: 14,
    suggestedKeys: ['workoutCompleted', 'sleepHours', 'energyLevel'],
    customHabits: [],
  },
  {
    key: 'hard_75_inspired',
    name: '75 Hard Inspired',
    description: 'A challenge-style setup without turning Lean Ledger into a rigid all-or-nothing tracker.',
    defaultDurationDays: 75,
    suggestedKeys: ['workoutCompleted', 'readingCompleted', 'sleepHours', 'energyLevel', 'sorenessLevel'],
    customHabits: [
      { name: 'Progress Photo', isActive: true },
      { name: 'No Alcohol', isActive: true },
      { name: 'Outdoor Walk', isActive: true },
    ],
  },
];

export function findDailyWinTemplate(key) {
  return DAILY_WIN_TEMPLATES.find((template) => template.key === key) || null;
}

function getDateDistanceInDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

export function applyDailyWinTemplate({ templateKey, customHabits = [] }) {
  const template = findDailyWinTemplate(templateKey);
  if (!template) {
    return {
      suggestedKeys: DEFAULT_DAILY_WIN_KEYS,
      customHabits,
    };
  }

  const existingByName = new Map(
    customHabits.map((habit) => [habit.name.trim().toLowerCase(), habit]),
  );

  const templateCustomHabits = template.customHabits.map((habit, index) => {
    const existing = existingByName.get(habit.name.trim().toLowerCase());
    return {
      id: existing?.id ?? `template-${template.key}-${index}`,
      name: habit.name,
      isActive: habit.isActive ?? true,
      sortOrder: index,
    };
  });

  return {
    suggestedKeys: template.suggestedKeys,
    customHabits: templateCustomHabits,
  };
}

export function buildDailyWinChallengeSummary({
  templateKey,
  challengeStartDate,
  referenceDate,
  dailyWinsSummary = null,
}) {
  const template = findDailyWinTemplate(templateKey);
  if (!template || !challengeStartDate || !referenceDate) return null;

  const elapsedDays = getDateDistanceInDays(challengeStartDate, referenceDate);
  if (elapsedDays == null || elapsedDays < 0) return null;

  const durationDays = template.defaultDurationDays || null;
  const dayNumber = elapsedDays + 1;
  const completedDays = durationDays != null ? Math.min(dayNumber, durationDays) : dayNumber;
  const daysRemaining = durationDays != null ? Math.max(durationDays - completedDays, 0) : null;
  const percentComplete = durationDays != null
    ? Math.max(0, Math.min(100, Math.round((completedDays / durationDays) * 100)))
    : null;
  const endDate = durationDays != null ? getDateDaysBefore(challengeStartDate, -(durationDays - 1)) : null;

  return {
    templateKey: template.key,
    templateName: template.name,
    durationDays,
    challengeStartDate,
    referenceDate,
    dayNumber,
    completedDays,
    daysRemaining,
    percentComplete,
    endDate,
    todayCompletedWins: dailyWinsSummary?.completed ?? null,
    todayTotalWins: dailyWinsSummary?.total ?? null,
    todayPerfect: Boolean(dailyWinsSummary && dailyWinsSummary.total > 0 && dailyWinsSummary.completed === dailyWinsSummary.total),
  };
}
