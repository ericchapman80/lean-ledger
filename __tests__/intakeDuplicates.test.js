import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeBeverageEntryInput, summarizeBeverageEntries } from '@/lib/beverages.js';
import { buildBeverageDuplicatePayload, buildMealDuplicatePayload } from '@/lib/intakeDuplicates.js';
import { groupMealsByType } from '@/lib/mealTemplates.js';

const sampleMeal = {
  id: 41,
  userId: 7,
  date: '2026-05-24',
  mealName: 'Tuna Bowl',
  mealType: 'lunch',
  portionAmount: 1,
  portionUnit: 'serving',
  portionGrams: 225,
  protein: 42,
  carbs: 18,
  fiber: 10,
  sugarAlcohols: 2,
  fat: 11,
  calories: 340,
  createdAt: '2026-05-24T12:00:00.000Z',
};

const sampleBeverage = {
  id: 91,
  userId: 7,
  amount: 16,
  unit: 'fl_oz',
  amountFlOz: 16,
  recordedAt: '2026-05-24T09:15',
  date: '2026-05-24',
  beverageType: 'protein_shake',
  countsTowardHydration: true,
  calories: 160,
  protein: 30,
  carbs: 6,
  fat: 3,
  caffeineMg: 80,
};

describe('intake duplicate helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T14:32:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('duplicates food entry data onto the selected day', () => {
    expect(buildMealDuplicatePayload(sampleMeal, '2026-05-25')).toEqual({
      date: '2026-05-25',
      mealName: 'Tuna Bowl',
      mealType: 'lunch',
      portionAmount: 1,
      portionUnit: 'serving',
      portionGrams: 225,
      protein: 42,
      fat: 11,
      carbs: 18,
      fiber: 10,
      sugarAlcohols: 2,
      calories: 340,
    });
  });

  it('duplicates beverage entry data onto the selected day', () => {
    const payload = buildBeverageDuplicatePayload(sampleBeverage, '2026-05-25');

    expect(payload).toMatchObject({
      amount: 16,
      unit: 'fl_oz',
      beverageType: 'protein_shake',
      countsTowardHydration: true,
      calories: 160,
      protein: 30,
      carbs: 6,
      fat: 3,
      caffeineMg: 80,
    });
    expect(payload.recordedAt).toMatch(/^2026-05-25T\d{2}:\d{2}$/);
  });

  it('preserves the original beverage time when duplicating onto a different day', () => {
    const payload = buildBeverageDuplicatePayload(sampleBeverage, '2026-05-26');

    expect(payload.recordedAt).toBe('2026-05-26T09:15');
  });

  it('falls back to default duplicate values when optional beverage fields are missing', () => {
    const payload = buildBeverageDuplicatePayload({
      amount: 12,
      countsTowardHydration: 0,
      recordedAt: null,
    }, '2026-05-25');

    expect(payload).toMatchObject({
      amount: 12,
      unit: 'fl_oz',
      beverageType: 'water',
      countsTowardHydration: false,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      caffeineMg: null,
    });
    expect(payload.recordedAt).toMatch(/^2026-05-25T\d{2}:\d{2}$/);
  });

  it('falls back to default duplicate values when optional meal fields are missing', () => {
    expect(buildMealDuplicatePayload({
      mealName: 'Plain Chicken',
      protein: 32,
      carbs: 0,
      fat: 4,
      calories: 180,
    }, '2026-05-25')).toEqual({
      date: '2026-05-25',
      mealName: 'Plain Chicken',
      mealType: 'breakfast',
      portionAmount: null,
      portionUnit: null,
      portionGrams: null,
      protein: 32,
      fat: 4,
      carbs: 0,
      fiber: null,
      sugarAlcohols: null,
      calories: 180,
    });
  });

  it('duplicate food updates meal and day totals when included in the log', () => {
    const duplicateMeal = {
      ...sampleMeal,
      ...buildMealDuplicatePayload(sampleMeal, '2026-05-25'),
      id: 42,
      createdAt: '2026-05-25T14:32:00.000Z',
    };

    const grouped = groupMealsByType([
      { ...sampleMeal, date: '2026-05-25' },
      duplicateMeal,
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].count).toBe(2);
    expect(grouped[0].totals).toEqual({
      calories: 680,
      protein: 84,
      carbs: 36,
      fiber: 20,
      sugarAlcohols: 4,
      netCarbs: 12,
      fat: 22,
    });
  });

  it('duplicate beverage updates hydration totals when included in the day summary', () => {
    const duplicatePayload = buildBeverageDuplicatePayload(sampleBeverage, '2026-05-25');
    const duplicateEntry = {
      id: 92,
      ...normalizeBeverageEntryInput(duplicatePayload),
    };

    const summary = summarizeBeverageEntries([
      { ...sampleBeverage, date: '2026-05-25', recordedAt: '2026-05-25T09:15' },
      duplicateEntry,
    ], {
      preferredUnit: 'fl_oz',
      weightKg: 75,
    });

    expect(summary.hydrationFlOz).toBe(8);
  });

  it('duplicate beverage with macros updates daily macro totals', () => {
    const duplicatePayload = buildBeverageDuplicatePayload(sampleBeverage, '2026-05-25');
    const entries = [
      { ...sampleBeverage, date: '2026-05-25', recordedAt: '2026-05-25T09:15' },
      normalizeBeverageEntryInput(duplicatePayload),
    ];

    const totals = entries.reduce((acc, entry) => ({
      calories: acc.calories + Number(entry.calories || 0),
      protein: acc.protein + Number(entry.protein || 0),
      carbs: acc.carbs + Number(entry.carbs || 0),
      fat: acc.fat + Number(entry.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    expect(totals).toEqual({
      calories: 320,
      protein: 60,
      carbs: 12,
      fat: 6,
    });
  });

  it('duplicate payloads do not carry forward record ids', () => {
    const mealPayload = buildMealDuplicatePayload(sampleMeal, '2026-05-25');
    const beveragePayload = buildBeverageDuplicatePayload(sampleBeverage, '2026-05-25');

    expect(mealPayload).not.toHaveProperty('id');
    expect(beveragePayload).not.toHaveProperty('id');
  });
});
