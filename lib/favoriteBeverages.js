import { buildBeverageRecordedAt } from './beverages.js';

export function buildFavoriteBeveragePayload(entry, favoriteName) {
  return {
    name: favoriteName,
    beverageType: entry.beverageType || 'water',
    displayName: entry.displayName?.trim() || null,
    amount: Number(entry.amount),
    unit: entry.unit || 'fl_oz',
    amountFlOz: Number(entry.amountFlOz),
    countsTowardHydration: Boolean(entry.countsTowardHydration),
    calories: Number(entry.calories || 0),
    protein: Number(entry.protein || 0),
    carbs: Number(entry.carbs || 0),
    fat: Number(entry.fat || 0),
    caffeineMg: entry.caffeineMg == null || entry.caffeineMg === '' ? null : Number(entry.caffeineMg),
  };
}

export function buildBeverageFromFavorite(favoriteBeverage, date) {
  return {
    amount: favoriteBeverage.amount,
    unit: favoriteBeverage.unit || 'fl_oz',
    recordedAt: buildBeverageRecordedAt(date),
    beverageType: favoriteBeverage.beverageType || 'water',
    displayName: favoriteBeverage.displayName?.trim() || null,
    countsTowardHydration: Boolean(favoriteBeverage.countsTowardHydration),
    calories: Number(favoriteBeverage.calories || 0),
    protein: Number(favoriteBeverage.protein || 0),
    carbs: Number(favoriteBeverage.carbs || 0),
    fat: Number(favoriteBeverage.fat || 0),
    caffeineMg: favoriteBeverage.caffeineMg == null || favoriteBeverage.caffeineMg === '' ? null : Number(favoriteBeverage.caffeineMg),
  };
}
