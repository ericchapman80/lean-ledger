import { describe, expect, it } from 'vitest';
import { buildFavoriteFoodPayload, buildMealFromFavoriteFood } from '@/lib/favoriteFoods.js';
import { buildBeverageFromFavorite, buildFavoriteBeveragePayload } from '@/lib/favoriteBeverages.js';

const sampleMeal = {
  mealName: 'Greek Yogurt',
  mealType: 'breakfast',
  portionAmount: 1,
  portionUnit: 'cup',
  portionGrams: 227,
  protein: 20,
  fat: 0,
  carbs: 9,
  fiber: 0,
  sugarAlcohols: 0,
  calories: 120,
};

const sampleBeverage = {
  beverageType: 'protein_shake',
  displayName: null,
  amount: 16,
  unit: 'fl_oz',
  amountFlOz: 16,
  countsTowardHydration: false,
  calories: 160,
  protein: 30,
  carbs: 6,
  fat: 3,
  caffeineMg: 120,
};

describe('favorite food helpers', () => {
  it('builds favorite food payloads from a meal entry', () => {
    expect(buildFavoriteFoodPayload(sampleMeal)).toEqual({
      name: 'Greek Yogurt',
      defaultMealType: 'breakfast',
      portionAmount: 1,
      portionUnit: 'cup',
      portionGrams: 227,
      protein: 20,
      fat: 0,
      carbs: 9,
      fiber: 0,
      sugarAlcohols: 0,
      calories: 120,
    });
  });

  it('creates a new meal payload from a favorite food and selected meal type', () => {
    expect(buildMealFromFavoriteFood({
      ...buildFavoriteFoodPayload(sampleMeal),
      id: 4,
    }, '2026-05-27', 'snack')).toEqual({
      date: '2026-05-27',
      mealType: 'snack',
      mealName: 'Greek Yogurt',
      portionAmount: 1,
      portionUnit: 'cup',
      portionGrams: 227,
      protein: 20,
      fat: 0,
      carbs: 9,
      fiber: 0,
      sugarAlcohols: 0,
      calories: 120,
    });
  });
});

describe('favorite beverage helpers', () => {
  it('builds favorite beverage payloads from a beverage entry', () => {
    expect(buildFavoriteBeveragePayload(sampleBeverage, 'Post Workout Shake')).toEqual({
      name: 'Post Workout Shake',
      beverageType: 'protein_shake',
      displayName: null,
      amount: 16,
      unit: 'fl_oz',
      amountFlOz: 16,
      countsTowardHydration: false,
      calories: 160,
      protein: 30,
      carbs: 6,
      fat: 3,
      caffeineMg: 120,
    });
  });

  it('creates a new beverage payload from a favorite beverage', () => {
    const payload = buildBeverageFromFavorite({
      ...sampleBeverage,
      id: 7,
      name: 'Post Workout Shake',
    }, '2026-05-30');

    expect(payload).toMatchObject({
      amount: 16,
      unit: 'fl_oz',
      beverageType: 'protein_shake',
      displayName: null,
      countsTowardHydration: false,
      calories: 160,
      protein: 30,
      carbs: 6,
      fat: 3,
      caffeineMg: 120,
    });
    expect(payload.recordedAt.startsWith('2026-05-30T')).toBe(true);
  });

  it('preserves custom other beverage names through favorite payloads', () => {
    const payload = buildFavoriteBeveragePayload({
      ...sampleBeverage,
      beverageType: 'other',
      displayName: 'LMNT Grapefruit',
    }, 'LMNT Grapefruit');

    expect(payload.displayName).toBe('LMNT Grapefruit');
    expect(buildBeverageFromFavorite({
      ...payload,
      id: 8,
    }, '2026-05-30')).toMatchObject({
      beverageType: 'other',
      displayName: 'LMNT Grapefruit',
    });
  });
});
