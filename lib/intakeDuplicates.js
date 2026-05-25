import { buildBeverageRecordedAt } from '@/lib/beverages.js';

export function buildMealDuplicatePayload(meal, date) {
  return {
    date,
    mealName: meal.mealName,
    mealType: meal.mealType || 'breakfast',
    portionAmount: meal.portionAmount ?? null,
    portionUnit: meal.portionUnit ?? null,
    portionGrams: meal.portionGrams ?? null,
    protein: meal.protein,
    fat: meal.fat,
    carbs: meal.carbs,
    calories: meal.calories,
  };
}

export function buildBeverageDuplicatePayload(entry, date) {
  const originalTime = entry.recordedAt?.slice(11, 16) || null;
  const today = new Date().toISOString().slice(0, 10);

  return {
    amount: entry.amount,
    unit: entry.unit || 'fl_oz',
    recordedAt: buildBeverageRecordedAt(date, date === today ? null : originalTime),
    beverageType: entry.beverageType || 'water',
    countsTowardHydration: Boolean(entry.countsTowardHydration),
    calories: entry.calories ?? 0,
    protein: entry.protein ?? 0,
    carbs: entry.carbs ?? 0,
    fat: entry.fat ?? 0,
    caffeineMg: entry.caffeineMg ?? null,
  };
}
