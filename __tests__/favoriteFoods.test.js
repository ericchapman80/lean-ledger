import { describe, expect, it } from 'vitest';
import { buildFavoriteFoodPayload, buildMealFromFavoriteFood } from '@/lib/favoriteFoods.js';

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
