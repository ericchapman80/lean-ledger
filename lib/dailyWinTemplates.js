import { DEFAULT_DAILY_WIN_KEYS } from './dailyWins.js';

export const DAILY_WIN_TEMPLATES = [
  {
    key: 'lean_recomp_foundations',
    name: 'Lean Recomp Foundations',
    description: 'Keep the focus on the core recovery signals that support body recomposition.',
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
    suggestedKeys: ['workoutCompleted', 'readingCompleted', 'prayerCompleted', 'sleepHours', 'energyLevel'],
    customHabits: [
      { name: 'Mobility', isActive: true },
    ],
  },
  {
    key: 'minimalist_reset',
    name: 'Minimalist 3-Habit Reset',
    description: 'Strip the day back to the smallest repeatable set when consistency needs to reset.',
    suggestedKeys: ['workoutCompleted', 'sleepHours', 'energyLevel'],
    customHabits: [],
  },
  {
    key: 'hard_75_inspired',
    name: '75 Hard Inspired',
    description: 'A challenge-style setup without turning Lean Ledger into a rigid all-or-nothing tracker.',
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
