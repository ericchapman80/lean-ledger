import { getDateDaysBefore, formatDate, getElapsedWeekDays } from '@/lib/utils/dateUtils.js';
import {
  calculateDailyWaterTarget,
  getBeverageDisplayName,
  getHydrationContributionFlOz,
} from '@/lib/beverages.js';
import { getPrimaryCarbLabel, getPrimaryCarbValue, usesNetCarbs, zeroIfBlank } from '@/lib/carbUtils.js';

const LATE_DAY_HYDRATION_CUTOFF_MINUTES = 17 * 60;

function round(value) {
  return Math.round(value);
}

function toPercentage(value) {
  return Math.max(0, Math.min(100, round(value)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundToOne(value) {
  return Number(value.toFixed(1));
}

function getLoggedMinutesFromMidnight(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return (date.getHours() * 60) + date.getMinutes();
}

function getClockMinutesFromTimestamp(timestamp) {
  if (!timestamp || typeof timestamp !== 'string') return getLoggedMinutesFromMidnight(timestamp);
  const matchedTime = timestamp.match(/T(\d{2}):(\d{2})/);
  if (matchedTime) {
    return (Number(matchedTime[1]) * 60) + Number(matchedTime[2]);
  }
  return getLoggedMinutesFromMidnight(timestamp);
}

function getFirstLoggedMinutes(mealBreakdown = []) {
  const loggedMinutes = mealBreakdown
    .flatMap((mealSection) => mealSection.loggedAt || [])
    .map(getLoggedMinutesFromMidnight)
    .filter((value) => value != null);

  if (loggedMinutes.length === 0) return null;
  return Math.min(...loggedMinutes);
}

function buildMealBehaviorSummary(dailySeries, proteinTarget) {
  const breakfastEntries = dailySeries.filter((entry) => entry.breakfastProtein != null);
  const averageBreakfastProtein = breakfastEntries.length > 0
    ? round(average(breakfastEntries.map((entry) => entry.breakfastProtein)))
    : null;

  const snackDays = dailySeries.filter((entry) => entry.hadSnack).length;
  const snackFrequencyPercentage = dailySeries.length > 0
    ? toPercentage((snackDays / dailySeries.length) * 100)
    : 0;

  const dinnerEntries = dailySeries.filter((entry) => entry.dinnerCalories != null);
  const averageDinnerCalories = dinnerEntries.length > 0
    ? round(average(dinnerEntries.map((entry) => entry.dinnerCalories)))
    : null;

  const firstMealEntries = dailySeries.filter((entry) => entry.firstMealLoggedMinutes != null);
  const averageFirstMealMinutes = firstMealEntries.length > 0
    ? average(firstMealEntries.map((entry) => entry.firstMealLoggedMinutes))
    : null;
  const averageFirstMealVarianceMinutes = firstMealEntries.length > 0 && averageFirstMealMinutes != null
    ? round(average(firstMealEntries.map((entry) => Math.abs(entry.firstMealLoggedMinutes - averageFirstMealMinutes))))
    : null;

  const highProteinMealThreshold = Math.max(30, round(proteinTarget / 5));
  const highProteinDayFlags = dailySeries.map((entry) => entry.highProteinMealHit);
  let currentHighProteinMealStreak = 0;
  let longestHighProteinMealStreak = 0;
  let runningStreak = 0;

  highProteinDayFlags.forEach((hit) => {
    if (hit) {
      runningStreak += 1;
      longestHighProteinMealStreak = Math.max(longestHighProteinMealStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  });

  for (let index = highProteinDayFlags.length - 1; index >= 0; index -= 1) {
    if (!highProteinDayFlags[index]) break;
    currentHighProteinMealStreak += 1;
  }

  const dinnerMidpoint = Math.ceil(dinnerEntries.length / 2);
  const earlyDinnerEntries = dinnerEntries.slice(0, dinnerMidpoint);
  const lateDinnerEntries = dinnerEntries.slice(dinnerMidpoint);
  const dinnerCaloriesChange = earlyDinnerEntries.length > 0 && lateDinnerEntries.length > 0
    ? round(average(lateDinnerEntries.map((entry) => entry.dinnerCalories))
      - average(earlyDinnerEntries.map((entry) => entry.dinnerCalories)))
    : null;

  return {
    averageBreakfastProtein,
    breakfastDays: breakfastEntries.length,
    snackDays,
    snackFrequencyPercentage,
    averageDinnerCalories,
    dinnerCaloriesChange,
    averageFirstMealMinutes: averageFirstMealMinutes != null ? roundToOne(averageFirstMealMinutes) : null,
    averageFirstMealVarianceMinutes,
    mealTimingConsistencyLabel: averageFirstMealVarianceMinutes == null
      ? null
      : averageFirstMealVarianceMinutes <= 30
        ? 'Tight timing'
        : averageFirstMealVarianceMinutes <= 60
          ? 'Steady timing'
          : 'Variable timing',
    highProteinMealThreshold,
    currentHighProteinMealStreak,
    longestHighProteinMealStreak,
  };
}

function buildBeverageInsightsByDate(entries) {
  return entries.reduce((acc, entry) => {
    const date = entry.date || entry.recordedAt?.slice(0, 10);
    if (!date) return acc;

    if (!acc[date]) {
      acc[date] = {
        hydrationFlOz: 0,
        totalFluidsFlOz: 0,
        caffeineMg: 0,
        beverageCount: 0,
        lateDayHydrationFlOz: 0,
        lateDayFluidsFlOz: 0,
      };
    }

    const amountFlOz = Number(entry.amountFlOz || 0);
    const hydrationContributionFlOz = getHydrationContributionFlOz(entry);
    const clockMinutes = getClockMinutesFromTimestamp(entry.recordedAt);
    const isLateDay = clockMinutes != null && clockMinutes >= LATE_DAY_HYDRATION_CUTOFF_MINUTES;

    acc[date].totalFluidsFlOz = round(acc[date].totalFluidsFlOz + amountFlOz, 1);
    acc[date].hydrationFlOz = round(acc[date].hydrationFlOz + hydrationContributionFlOz, 1);
    acc[date].caffeineMg = round(acc[date].caffeineMg + zeroIfBlank(entry.caffeineMg), 1);
    acc[date].beverageCount += 1;

    if (isLateDay) {
      acc[date].lateDayFluidsFlOz = round(acc[date].lateDayFluidsFlOz + amountFlOz, 1);
      acc[date].lateDayHydrationFlOz = round(acc[date].lateDayHydrationFlOz + hydrationContributionFlOz, 1);
    }

    return acc;
  }, {});
}

function buildBeverageBehaviorSummary(dailySeries, beverageEntries) {
  const beverageDays = dailySeries.filter((entry) => Number(entry.totalFluidsOunces || 0) > 0);
  const totalHydrationOunces = beverageDays.reduce((sum, entry) => sum + Number(entry.hydrationOunces || 0), 0);
  const totalLateDayHydrationOunces = beverageDays.reduce((sum, entry) => sum + Number(entry.lateDayHydrationOunces || 0), 0);
  const totalLoggedFluidsOunces = beverageDays.reduce((sum, entry) => sum + Number(entry.totalFluidsOunces || 0), 0);

  const beverageMixByType = beverageEntries.reduce((acc, entry) => {
    const beverageType = entry.beverageType || 'water';
    const displayLabel = getBeverageDisplayName(entry);
    const beverageKey = beverageType === 'other' && displayLabel ? `other::${displayLabel}` : beverageType;
    if (!acc[beverageKey]) {
      acc[beverageKey] = {
        beverageType,
        label: displayLabel,
        totalFluidsOunces: 0,
        hydrationOunces: 0,
        entriesCount: 0,
      };
    }

    acc[beverageKey].totalFluidsOunces = round(acc[beverageKey].totalFluidsOunces + Number(entry.amountFlOz || 0), 1);
    acc[beverageKey].hydrationOunces = round(acc[beverageKey].hydrationOunces + getHydrationContributionFlOz(entry), 1);
    acc[beverageKey].entriesCount += 1;
    return acc;
  }, {});

  const beverageMix = Object.values(beverageMixByType)
    .sort((left, right) => right.totalFluidsOunces - left.totalFluidsOunces)
    .map((entry) => ({
      ...entry,
      sharePercentage: totalLoggedFluidsOunces > 0
        ? toPercentage((entry.totalFluidsOunces / totalLoggedFluidsOunces) * 100)
        : 0,
    }));

  return {
    loggedDays: beverageDays.length,
    averageDailyHydration: beverageDays.length > 0
      ? round(average(beverageDays.map((entry) => Number(entry.hydrationOunces || 0))))
      : null,
    hydrationTargetHitRate: beverageDays.length > 0
      ? toPercentage((beverageDays.filter((entry) => entry.hydrationOunces >= entry.hydrationTarget).length / beverageDays.length) * 100)
      : null,
    averageDailyCaffeineMg: beverageDays.length > 0
      ? round(average(beverageDays.map((entry) => Number(entry.caffeineMg || 0))))
      : null,
    caffeineDays: beverageDays.filter((entry) => Number(entry.caffeineMg || 0) > 0).length,
    averageLateDayHydration: beverageDays.length > 0
      ? round(average(beverageDays.map((entry) => Number(entry.lateDayHydrationOunces || 0))))
      : null,
    lateDayHydrationDays: beverageDays.filter((entry) => Number(entry.lateDayHydrationOunces || 0) > 0).length,
    lateDayHydrationPercentage: totalHydrationOunces > 0
      ? toPercentage((totalLateDayHydrationOunces / totalHydrationOunces) * 100)
      : 0,
    lateDayCutoffMinutes: LATE_DAY_HYDRATION_CUTOFF_MINUTES,
    primaryBeverageLabel: beverageMix[0]?.label ?? null,
    primaryBeverageSharePercentage: beverageMix[0]?.sharePercentage ?? null,
    beverageMix,
  };
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
      return { min: 20, max: 50, label: 'Keto', isFlexible: false, carbLabel: 'Net Carbs' };
    case 'keto_flexible':
      return isWeekend
        ? { min: 100, max: 175, label: 'Flexible Weekend', isFlexible: true, carbLabel: 'Net Carbs' }
        : { min: 20, max: 50, label: 'Keto Weekday', isFlexible: false, carbLabel: 'Net Carbs' };
    case 'low_carb':
      return { min: 75, max: 125, label: 'Low Carb', isFlexible: false, carbLabel: 'Net Carbs' };
    case 'balanced':
    default:
      return {
        min: Math.max(0, round(dailyCarbTarget * 0.85)),
        max: round(dailyCarbTarget * 1.15),
        label: 'Balanced',
        isFlexible: false,
        carbLabel: 'Carbs',
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
  const beverageMap = buildBeverageInsightsByDate(beverageEntries);
  const extendedDates = buildDateRange(getDateDaysBefore(startDate, 6), endDate);
  const extendedWeightValues = extendedDates.map((date) => weightMap[date] ?? null);
  const rollingWeightValues = calculateRollingAverage(extendedWeightValues, 7);
  const visibleDates = buildDateRange(startDate, endDate);
  const firstVisibleIndex = extendedDates.indexOf(visibleDates[0]);
  const baseHydrationTarget = calculateDailyWaterTarget(weightLogs[0]?.weight ?? profile.weight).targetFlOz;

  let dailySeries = visibleDates.map((date, visibleIndex) => {
    const mealEntry = mealMap[date] ?? { protein: 0, carbs: 0, fiber: 0, sugarAlcohols: 0, netCarbs: 0, fat: 0, calories: 0, mealCount: 0, mealBreakdown: [] };
    const healthEntry = healthMetricMap[date] ?? {};
    const carbGuidance = getDietStyleCarbGuidance(profile.dietStyle, date, profile.activeMacros.carbs);
    const primaryCarbs = getPrimaryCarbValue(mealEntry, profile.dietStyle);
    const mealBreakdown = mealEntry.mealBreakdown || [];
    const breakfastSection = mealBreakdown.find((section) => section.mealType === 'breakfast') || null;
    const dinnerSection = mealBreakdown.find((section) => section.mealType === 'dinner') || null;
    const snackSection = mealBreakdown.find((section) => section.mealType === 'snack') || null;
    const firstMealLoggedMinutes = getFirstLoggedMinutes(mealBreakdown);
    const highProteinMealThreshold = Math.max(30, round(profile.activeMacros.protein / 5));
    const weight = weightMap[date] ?? null;
    const sevenDayAverageWeight = rollingWeightValues[firstVisibleIndex + visibleIndex];
    const proteinBelowTarget = mealEntry.protein < profile.activeMacros.protein;
    const carbWithinTarget = primaryCarbs >= carbGuidance.min && primaryCarbs <= carbGuidance.max;
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
      beverageCount: beverageMap[date]?.beverageCount ?? 0,
      caffeineMg: beverageMap[date]?.caffeineMg ?? null,
      lateDayHydrationOunces: beverageMap[date]?.lateDayHydrationFlOz ?? 0,
      lateDayFluidsOunces: beverageMap[date]?.lateDayFluidsFlOz ?? 0,
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
      carbs: round(primaryCarbs),
      totalCarbs: round(zeroIfBlank(mealEntry.carbs)),
      fiber: round(zeroIfBlank(mealEntry.fiber)),
      sugarAlcohols: round(zeroIfBlank(mealEntry.sugarAlcohols)),
      netCarbs: round(zeroIfBlank(mealEntry.netCarbs)),
      calories: round(mealEntry.calories),
      mealCount: mealEntry.mealCount,
      breakfastProtein: breakfastSection ? round(breakfastSection.protein) : null,
      dinnerCalories: dinnerSection ? round(dinnerSection.calories) : null,
      snackCount: snackSection ? snackSection.count : 0,
      hadSnack: Boolean(snackSection),
      firstMealLoggedMinutes,
      highProteinMealHit: mealBreakdown.some((section) => section.protein >= highProteinMealThreshold),
      proteinTarget: round(profile.activeMacros.protein),
      calorieTarget: round(profile.activeMacros.calories),
      carbTargetMin: carbGuidance.min,
      carbTargetMax: carbGuidance.max,
      carbLabel: carbGuidance.carbLabel,
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
  const weeklyAverageCarbs = dailySeries.length > 0
    ? round(dailySeries.reduce((sum, entry) => sum + entry.carbs, 0) / dailySeries.length)
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
  const mealBehavior = buildMealBehaviorSummary(dailySeries, profile.activeMacros.protein);
  const beverageBehavior = buildBeverageBehaviorSummary(dailySeries, beverageEntries);

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
      weeklyCarbAverage: weeklyAverageCarbs,
      carbLabel: getPrimaryCarbLabel(profile.dietStyle),
      usesNetCarbs: usesNetCarbs(profile.dietStyle),
      weeklyAverageHydration,
      elapsedWeekDays: getElapsedWeekDays(endDate),
      hydrationTarget: baseHydrationTarget,
      mealBehavior,
      beverageBehavior,
    },
  };
}
