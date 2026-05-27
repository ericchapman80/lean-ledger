import { describe, expect, it } from 'vitest';
import { buildFavoriteMealSuggestions, getMealSectionSignature } from '@/lib/mealSuggestions.js';

const breakfastMeals = [
  {
    id: 1,
    date: '2026-05-27',
    mealType: 'breakfast',
    mealName: 'Eggs',
    portionAmount: 2,
    portionUnit: 'serving',
    portionGrams: 100,
    protein: 12,
    fat: 10,
    carbs: 1,
    fiber: 0,
    sugarAlcohols: 0,
    calories: 140,
    createdAt: '2026-05-27T08:00:00.000Z',
  },
  {
    id: 2,
    date: '2026-05-27',
    mealType: 'breakfast',
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
    createdAt: '2026-05-27T08:05:00.000Z',
  },
];

const priorBreakfastMeals = [
  {
    ...breakfastMeals[0],
    id: 3,
    date: '2026-05-26',
    createdAt: '2026-05-26T08:00:00.000Z',
  },
  {
    ...breakfastMeals[1],
    id: 4,
    date: '2026-05-26',
    createdAt: '2026-05-26T08:05:00.000Z',
  },
  {
    ...breakfastMeals[0],
    id: 5,
    date: '2026-05-24',
    createdAt: '2026-05-24T08:00:00.000Z',
  },
  {
    ...breakfastMeals[1],
    id: 6,
    date: '2026-05-24',
    createdAt: '2026-05-24T08:05:00.000Z',
  },
];

describe('mealSuggestions helpers', () => {
  it('suggests repeated meal sections that are not already favorites', () => {
    const suggestions = buildFavoriteMealSuggestions({
      meals: breakfastMeals,
      recentMeals: [...breakfastMeals, ...priorBreakfastMeals],
      favoriteMeals: [],
      selectedDate: '2026-05-27',
    });

    expect(suggestions).toEqual([
      expect.objectContaining({
        mealType: 'breakfast',
        label: 'Breakfast',
        occurrences: 3,
        historicalMatches: 2,
      }),
    ]);
  });

  it('does not suggest sections below the repeat threshold', () => {
    const suggestions = buildFavoriteMealSuggestions({
      meals: breakfastMeals,
      recentMeals: [...breakfastMeals, ...priorBreakfastMeals.slice(0, 2)],
      favoriteMeals: [],
      selectedDate: '2026-05-27',
      minimumOccurrences: 4,
    });

    expect(suggestions).toEqual([]);
  });

  it('does not suggest sections that already exist as favorites', () => {
    const suggestions = buildFavoriteMealSuggestions({
      meals: breakfastMeals,
      recentMeals: [...breakfastMeals, ...priorBreakfastMeals],
      favoriteMeals: [
        {
          mealType: 'breakfast',
          items: breakfastMeals.map(({ mealName, portionAmount, portionUnit, portionGrams, protein, fat, carbs, fiber, sugarAlcohols, calories }) => ({
            foodName: mealName,
            portionAmount,
            portionUnit,
            portionGrams,
            protein,
            fat,
            carbs,
            fiber,
            sugarAlcohols,
            calories,
          })),
        },
      ],
      selectedDate: '2026-05-27',
    });

    expect(suggestions).toEqual([]);
  });

  it('builds stable signatures independent of meal order', () => {
    const normal = getMealSectionSignature(breakfastMeals);
    const reversed = getMealSectionSignature([...breakfastMeals].reverse());

    expect(normal).toBe(reversed);
  });
});
