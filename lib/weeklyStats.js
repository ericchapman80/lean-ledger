import { getElapsedWeekDays, getEndOfWeek, getStartOfWeek } from '@/lib/utils/dateUtils.js';
import { calculateBeverageNutritionTotals } from '@/lib/beverages.js';

function round(value) {
  return Math.round(value);
}

export function calculateWeeklyNutritionSummary({
  date = new Date(),
  targets,
  meals = [],
  beverages = [],
  weights = [],
}) {
  const weekStart = getStartOfWeek(date);
  const weekEnd = getEndOfWeek(date);
  const elapsedDays = getElapsedWeekDays(date);
  const totalConsumed = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
  }), { calories: 0, protein: 0 });
  const beverageTotals = calculateBeverageNutritionTotals(beverages);
  totalConsumed.calories += beverageTotals.calories;
  totalConsumed.protein += beverageTotals.protein;
  const proteinByDate = meals.reduce((acc, meal) => {
    acc[meal.date] = (acc[meal.date] ?? 0) + meal.protein;
    return acc;
  }, {});
  for (const beverage of beverages) {
    proteinByDate[beverage.date] = (proteinByDate[beverage.date] ?? 0) + Number(beverage.protein || 0);
  }
  const weeklyTargets = {
    calories: round(targets.calories * 7),
    protein: round(targets.protein * 7),
  };
  const averages = {
    calories: round(totalConsumed.calories / elapsedDays),
    protein: round(totalConsumed.protein / elapsedDays),
  };
  const remaining = {
    calories: round(Math.max(weeklyTargets.calories - totalConsumed.calories, 0)),
    protein: round(Math.max(weeklyTargets.protein - totalConsumed.protein, 0)),
  };
  const proteinDaysHit = Object.values(proteinByDate).reduce((count, dailyProtein) => (
    dailyProtein >= targets.protein ? count + 1 : count
  ), 0);
  const sevenDayAverageWeight = weights.length > 0
    ? Number((weights.reduce((sum, entry) => sum + entry.weight, 0) / weights.length).toFixed(1))
    : null;

  return {
    weekStart,
    weekEnd,
    elapsedDays,
    dailyTargets: {
      calories: round(targets.calories),
      protein: round(targets.protein),
    },
    weeklyTargets,
    consumed: totalConsumed,
    averages,
    remaining,
    focus: {
      sevenDayAverageWeight,
      proteinConsistency: {
        daysHit: proteinDaysHit,
        totalDays: elapsedDays,
        percentage: round((proteinDaysHit / elapsedDays) * 100),
      },
      waistTrend: 'Track waist 1x/week under consistent conditions.',
      workoutCompletion: 'Track completed strength sessions to judge recomp progress.',
    },
  };
}
