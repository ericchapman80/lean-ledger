import { describe, expect, it } from 'vitest';
import {
  buildFavoriteTemplatePayload,
  buildMealsFromTemplate,
  buildRepeatMeals,
  calculateMealTotals,
  findMostRecentMealSection,
  getMealTypeLabel,
  groupMealsByType,
  summarizeMealLog,
} from '@/lib/mealTemplates.js';

const sampleMeals = [
  {
    id: 1,
    date: '2026-05-24',
    mealType: 'breakfast',
    mealName: 'Eggs',
    portionAmount: 2,
    portionUnit: 'serving',
    portionGrams: 100,
    protein: 12,
    carbs: 1,
    fat: 10,
    calories: 140,
    createdAt: '2026-05-24T08:00:00.000Z',
  },
  {
    id: 2,
    date: '2026-05-24',
    mealType: 'breakfast',
    mealName: 'Greek Yogurt',
    portionAmount: 1,
    portionUnit: 'cup',
    portionGrams: 227,
    protein: 20,
    carbs: 9,
    fat: 0,
    calories: 120,
    createdAt: '2026-05-24T08:05:00.000Z',
  },
  {
    id: 3,
    date: '2026-05-24',
    mealType: 'dinner',
    mealName: 'Steak',
    portionAmount: 8,
    portionUnit: 'ounces',
    portionGrams: 226.8,
    protein: 52,
    carbs: 0,
    fat: 24,
    calories: 420,
    createdAt: '2026-05-24T19:00:00.000Z',
  },
];

describe('mealTemplates helpers', () => {
  it('calculates grouped meal totals', () => {
    expect(calculateMealTotals(sampleMeals.slice(0, 2))).toEqual({
      calories: 260,
      protein: 32,
      carbs: 10,
      fat: 10,
    });
  });

  it('groups meals by meal type', () => {
    const grouped = groupMealsByType(sampleMeals);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].mealType).toBe('breakfast');
    expect(grouped[0].totals.protein).toBe(32);
    expect(grouped[1].mealType).toBe('dinner');
  });

  it('builds favorite meal payloads with nested food items', () => {
    const payload = buildFavoriteTemplatePayload('High Protein Breakfast', 'breakfast', sampleMeals.slice(0, 2));
    expect(payload.name).toBe('High Protein Breakfast');
    expect(payload.mealType).toBe('breakfast');
    expect(payload.protein).toBe(32);
    expect(payload.items[0].foodName).toBe('Eggs');
    expect(payload.items[1].portionUnit).toBe('cup');
  });

  it('creates repeatable meals from a favorite template', () => {
    const template = buildFavoriteTemplatePayload('High Protein Breakfast', 'breakfast', sampleMeals.slice(0, 2));
    const meals = buildMealsFromTemplate(template, '2026-05-25');
    expect(meals).toHaveLength(2);
    expect(meals[0].date).toBe('2026-05-25');
    expect(meals[0].mealType).toBe('breakfast');
  });

  it('creates repeated meals from an existing meal section', () => {
    const meals = buildRepeatMeals(sampleMeals.slice(0, 2), '2026-05-26');
    expect(meals[1].date).toBe('2026-05-26');
    expect(meals[1].mealName).toBe('Greek Yogurt');
  });

  it('finds the most recent meal section', () => {
    const section = findMostRecentMealSection(sampleMeals);
    expect(section.mealType).toBe('dinner');
  });

  it('summarizes meal groups separately from food entries', () => {
    expect(summarizeMealLog(sampleMeals)).toEqual({
      mealCount: 2,
      foodEntryCount: 3,
      mealTypes: [
        { mealType: 'breakfast', label: 'Breakfast', count: 2 },
        { mealType: 'dinner', label: 'Dinner', count: 1 },
      ],
    });
  });

  it('formats meal type labels', () => {
    expect(getMealTypeLabel('post_workout')).toBe('Post Workout');
  });
});
