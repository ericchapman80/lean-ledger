import { getDateDaysBefore, formatDate, getElapsedWeekDays } from '@/lib/utils/dateUtils.js';
import { aggregateBeverageEntriesByDate, calculateDailyWaterTarget } from '@/lib/beverages.js';

function round(value) {
  return Math.round(value);
}

function toPercentage(value) {
  return Math.max(0, Math.min(100, round(value)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildDateRange(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${formatDate(startDate)}T00:00:00`);
  const last = new Date(`${formatDate(endDate)}T00:00:00`);

  while (cursor <= last) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function calculateRollingAverage(values, windowSize = 7) {
  return values.map((_, index) => {
    const slice = values.slice(Math.max(0, index - windowSize + 1), index + 1)
      .filter((value) => value != null);
    if (slice.length === 0) return null;
    return Number((slice.reduce((sum, value) => sum + value, 0) / slice.length).toFixed(1));
  });
}

export function getDietStyleCarbGuidance(dietStyle, date, dailyCarbTarget) {
  const day = new Date(`${date}T00:00:00`).getDay();
  const isWeekend = [0, 6].includes(day);

  switch (dietStyle) {
    case 'keto':
      return { min: 20, max: 50, label: 'Keto', isFlexible: false };
    case 'keto_flexible':
      return isWeekend
        ? { min: 100, max: 175, label: 'Flexible Weekend', isFlexible: true }
        : { min: 20, max: 50, label: 'Keto Weekday', isFlexible: false };
    case 'low_carb':
      return { min: 75, max: 125, label: 'Low Carb', isFlexible: false };
    case 'balanced':
    default:
      return {
        min: Math.max(0, round(dailyCarbTarget * 0.85)),
        max: round(dailyCarbTarget * 1.15),
        label: 'Balanced',
        isFlexible: false,
      };
  }
}

function calculateSleepScore(hours) {
  if (!Number.isFinite(hours)) return null;
  if (hours >= 7 && hours <= 9) return 100;
  return clamp(100 - (Math.abs(hours - 8) * 20), 0, 100);
}

function calculateEnergyScore(level) {
  if (!Number.isFinite(level)) return null;
  return clamp(level * 20, 0, 100);
}

function calculateSorenessScore(level) {
  if (!Number.isFinite(level)) return null;
  return clamp((6 - level) * 20, 0, 100);
}

function calculateHungerScore(level) {
  if (!Number.isFinite(level)) return null;
  return clamp(100 - (Math.abs(level - 3) * 25), 0, 100);
}

export function calculateDailyConsistencyScore(entry, {
  proteinTarget,
  calorieTarget,
  hydrationTarget,
}) {
  const componentScores = [];

  if (proteinTarget > 0) {
    componentScores.push(Math.min((entry.protein / proteinTarget) * 100, 100));
  }

  if (calorieTarget > 0) {
    const calorieVariance = Math.abs(entry.calories - calorieTarget) / calorieTarget;
    componentScores.push(Math.max(0, 100 - (calorieVariance * 100)));
  }

  if (entry.workoutCompleted != null) {
    componentScores.push(entry.workoutCompleted ? 100 : 0);
  }

  if (hydrationTarget > 0 && Number.isFinite(entry.hydrationOunces)) {
    componentScores.push(clamp((entry.hydrationOunces / hydrationTarget) * 100, 0, 100));
  }

  const sleepScore = calculateSleepScore(entry.sleepHours);
  if (sleepScore != null) {
    componentScores.push(sleepScore);
  }

  const energyScore = calculateEnergyScore(entry.energyLevel);
  if (energyScore != null) {
    componentScores.push(energyScore);
  }

  const sorenessScore = calculateSorenessScore(entry.sorenessLevel);
  if (sorenessScore != null) {
    componentScores.push(sorenessScore);
  }

  const hungerScore = calculateHungerScore(entry.hungerLevel);
  if (hungerScore != null) {
    componentScores.push(hungerScore);
  }

  if (componentScores.length === 0) return 0;
  return round(componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length);
}

export function calculateWeeklyCalorieAdherence(weeklyStats) {
  const dailyCalories = weeklyStats.dailyTargets?.calories
    ?? round((weeklyStats.weeklyTargets?.calories ?? 0) / 7);
  const expectedByNow = dailyCalories * weeklyStats.elapsedDays;
  if (expectedByNow <= 0) return 0;
  const delta = Math.abs(weeklyStats.consumed.calories - expectedByNow);
  return toPercentage(100 - ((delta / expectedByNow) * 100));
}

export function buildTrendAnalytics({
  startDate,
  endDate,
  mealTrends,
  weightLogs,
  healthMetrics = [],
  beverageEntries = [],
  profile,
  weeklyStats,
}) {
  const mealMap = Object.fromEntries(mealTrends.map((entry) => [entry.date, entry]));
  const weightMap = Object.fromEntries(weightLogs.map((entry) => [entry.date, entry.weight]));
  const healthMetricMap = healthMetrics.reduce((acc, entry) => {
    const existing = acc[entry.date];
    if (!existing || entry.recordedAt > existing.recordedAt) {
      acc[entry.date] = entry;
    }
    return acc;
  }, {});
  const beverageMap = aggregateBeverageEntriesByDate(beverageEntries);
  const extendedDates = buildDateRange(getDateDaysBefore(startDate, 6), endDate);
  const extendedWeightValues = extendedDates.map((date) => weightMap[date] ?? null);
  const rollingWeightValues = calculateRollingAverage(extendedWeightValues, 7);
  const visibleDates = buildDateRange(startDate, endDate);
  const firstVisibleIndex = extendedDates.indexOf(visibleDates[0]);
  const baseHydrationTarget = calculateDailyWaterTarget(weightLogs[0]?.weight ?? profile.weight).targetFlOz;

  let dailySeries = visibleDates.map((date, visibleIndex) => {
    const mealEntry = mealMap[date] ?? { protein: 0, carbs: 0, fat: 0, calories: 0, mealCount: 0 };
    const healthEntry = healthMetricMap[date] ?? {};
    const carbGuidance = getDietStyleCarbGuidance(profile.dietStyle, date, profile.activeMacros.carbs);
    const weight = weightMap[date] ?? null;
    const sevenDayAverageWeight = rollingWeightValues[firstVisibleIndex + visibleIndex];
    const proteinBelowTarget = mealEntry.protein < profile.activeMacros.protein;
    const carbWithinTarget = mealEntry.carbs >= carbGuidance.min && mealEntry.carbs <= carbGuidance.max;
    const hydrationOunces = beverageMap[date]?.hydrationFlOz ?? healthEntry.hydrationOunces ?? null;
    const totalFluidsOunces = beverageMap[date]?.totalFluidsFlOz ?? null;
    const hydrationTarget = calculateDailyWaterTarget(weight ?? profile.weight, {
      workoutCompleted: healthEntry.workoutCompleted ?? false,
    }).targetFlOz;
    const consistencyScore = calculateDailyConsistencyScore({ ...mealEntry, ...healthEntry }, {
      proteinTarget: profile.activeMacros.protein,
      calorieTarget: profile.activeMacros.calories,
      hydrationTarget,
    });

    return {
      date,
      weight,
      waistMeasurement: healthEntry.waistMeasurement ?? null,
      workoutCompleted: healthEntry.workoutCompleted ?? null,
      workoutCompletedValue: healthEntry.workoutCompleted == null ? null : (healthEntry.workoutCompleted ? 1 : 0),
      hydrationOunces,
      totalFluidsOunces,
      hydrationTarget,
      sleepHours: healthEntry.sleepHours ?? null,
      energyLevel: healthEntry.energyLevel ?? null,
      hungerLevel: healthEntry.hungerLevel ?? null,
      sorenessLevel: healthEntry.sorenessLevel ?? null,
      progressPhotoCount: healthEntry.progressPhotoCount ?? null,
      progressPhotoNote: healthEntry.progressPhotoNote ?? null,
      bodyFatPercent: healthEntry.bodyFatPercent ?? null,
      skeletalMuscle: healthEntry.skeletalMuscle ?? null,
      muscleMass: healthEntry.muscleMass ?? null,
      bodyWaterPercent: healthEntry.bodyWaterPercent ?? null,
      bmr: healthEntry.bmr ?? null,
      proteinPercent: healthEntry.proteinPercent ?? null,
      fatFreeBodyWeight: healthEntry.fatFreeBodyWeight ?? null,
      metabolicAge: healthEntry.metabolicAge ?? null,
      restingHeartRate: healthEntry.restingHeartRate ?? null,
      hrv: healthEntry.hrv ?? null,
      steps: healthEntry.steps ?? null,
      activeCalories: healthEntry.activeCalories ?? null,
      sevenDayAverageWeight,
      protein: round(mealEntry.protein),
      fat: round(mealEntry.fat),
      carbs: round(mealEntry.carbs),
      calories: round(mealEntry.calories),
      mealCount: mealEntry.mealCount,
      proteinTarget: round(profile.activeMacros.protein),
      calorieTarget: round(profile.activeMacros.calories),
      carbTargetMin: carbGuidance.min,
      carbTargetMax: carbGuidance.max,
      carbModeLabel: carbGuidance.label,
      isFlexibleDay: carbGuidance.isFlexible,
      carbWithinTarget,
      proteinBelowTarget,
      consistencyScore,
    };
  });

  const hydrationRollingValues = calculateRollingAverage(
    dailySeries.map((entry) => entry.hydrationOunces ?? null),
    7,
  );

  dailySeries = dailySeries.map((entry, index) => ({
    ...entry,
    sevenDayAverageHydration: hydrationRollingValues[index],
  }));

  const latestVisibleRollingIndex = firstVisibleIndex + visibleDates.length - 1;
  const latestRollingWeight = rollingWeightValues[latestVisibleRollingIndex] ?? null;
  const previousRollingWeight = latestVisibleRollingIndex >= 7
    ? rollingWeightValues[latestVisibleRollingIndex - 7] ?? null
    : null;
  const previousWeekChange = latestRollingWeight != null && previousRollingWeight != null
    ? Number((latestRollingWeight - previousRollingWeight).toFixed(1))
    : null;

  const proteinDaysHit = dailySeries.filter((entry) => entry.protein >= entry.proteinTarget).length;
  const waistEntries = dailySeries.filter((entry) => entry.waistMeasurement != null);
  const waistChange = waistEntries.length >= 2
    ? Number((waistEntries[waistEntries.length - 1].waistMeasurement - waistEntries[0].waistMeasurement).toFixed(1))
    : null;
  const workoutEntries = dailySeries.filter((entry) => entry.workoutCompleted != null);
  const workoutCompletionPercentage = workoutEntries.length > 0
    ? toPercentage((workoutEntries.filter((entry) => entry.workoutCompleted).length / workoutEntries.length) * 100)
    : null;
  const hydrationEntries = dailySeries.filter((entry) => Number.isFinite(entry.hydrationOunces));
  const hydrationAdherencePercentage = hydrationEntries.length > 0
    ? toPercentage((hydrationEntries.filter((entry) => entry.hydrationOunces >= entry.hydrationTarget).length / hydrationEntries.length) * 100)
    : null;
  const weeklyAverageHydration = hydrationEntries.length > 0
    ? round(hydrationEntries.reduce((sum, entry) => sum + entry.hydrationOunces, 0) / hydrationEntries.length)
    : null;
  const proteinAdherencePercentage = dailySeries.length > 0
    ? toPercentage((proteinDaysHit / dailySeries.length) * 100)
    : 0;
  const weeklyAverageProtein = dailySeries.length > 0
    ? round(dailySeries.reduce((sum, entry) => sum + entry.protein, 0) / dailySeries.length)
    : 0;
  const weeklyAverageConsistency = dailySeries.length > 0
    ? round(dailySeries.reduce((sum, entry) => sum + entry.consistencyScore, 0) / dailySeries.length)
    : 0;
  const weeklyCalorieAdherencePercentage = calculateWeeklyCalorieAdherence(weeklyStats);
  const remainingWeekDays = Math.max(7 - weeklyStats.elapsedDays, 0);
  const dailyAverageNeeded = remainingWeekDays > 0
    ? round(weeklyStats.remaining.calories / remainingWeekDays)
    : 0;
  const currentWeight = [...weightLogs]
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weight ?? null;

  return {
    dailySeries,
    summary: {
      currentWeight,
      sevenDayAverageWeight: weeklyStats.focus.sevenDayAverageWeight,
      waistChange,
      proteinAdherencePercentage,
      workoutCompletionPercentage,
      hydrationAdherencePercentage,
      weeklyCalorieAdherencePercentage,
      previousWeekChange,
      weeklyAverageProtein,
      weeklyAverageConsistency,
      dailyAverageNeeded,
      weeklyCaloriesConsumed: round(weeklyStats.consumed.calories),
      weeklyCaloriesRemaining: round(weeklyStats.remaining.calories),
      weeklyCalorieTarget: round(weeklyStats.weeklyTargets.calories),
      weeklyProteinAverage: weeklyAverageProtein,
      weeklyAverageHydration,
      elapsedWeekDays: getElapsedWeekDays(endDate),
      hydrationTarget: baseHydrationTarget,
    },
  };
}
