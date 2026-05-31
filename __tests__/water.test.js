import { describe, expect, it } from 'vitest';
import { calculateBeverageNutritionTotals, normalizeBeverageEntryInput, summarizeBeverageEntries } from '@/lib/beverages.js';
import {
  aggregateWaterEntriesByDate,
  calculateDailyWaterTarget,
  convertFlOzToUnit,
  convertWaterToFlOz,
  getHydrationHelperCopy,
  normalizeWaterEntryInput,
  summarizeWaterEntries,
} from '@/lib/water.js';

describe('water helpers', () => {
  it('converts supported water units to fluid ounces', () => {
    expect(convertWaterToFlOz(1, 'cup')).toBe(8);
    expect(convertWaterToFlOz(29.5735, 'ml')).toBeCloseTo(1, 4);
    expect(convertWaterToFlOz(1, 'l')).toBeCloseTo(33.814, 3);
  });

  it('converts fluid ounces back into metric units', () => {
    expect(convertFlOzToUnit(8, 'cup')).toBe(1);
    expect(convertFlOzToUnit(1, 'ml')).toBeCloseTo(29.5735, 4);
  });

  it('calculates a personalized water target by body weight', () => {
    const result = calculateDailyWaterTarget(104.8);
    expect(result.baselineFlOz).toBe(116);
    expect(result.targetFlOz).toBe(116);
  });

  it('adds a workout adjustment to the water target', () => {
    const result = calculateDailyWaterTarget(104.8, { workoutCompleted: true });
    expect(result.baselineFlOz).toBe(116);
    expect(result.workoutBonusFlOz).toBe(20);
    expect(result.targetFlOz).toBe(136);
  });

  it('normalizes water entries and validates per-entry limits', () => {
    const result = normalizeWaterEntryInput({
      amount: 2,
      unit: 'cup',
      recordedAt: '2026-05-25T08:30',
    });

    expect(result.amountFlOz).toBe(16);
    expect(result.date).toBe('2026-05-25');
  });

  it('supports beverage entries with macros without double-counting hydration', () => {
    const result = normalizeBeverageEntryInput({
      amount: 12,
      unit: 'fl_oz',
      recordedAt: '2026-05-25T09:15',
      beverageType: 'protein_shake',
      countsTowardHydration: false,
      calories: 160,
      protein: 30,
      carbs: 6,
      fat: 3,
      caffeineMg: 75,
    });

    expect(result.amountFlOz).toBe(12);
    expect(result.countsTowardHydration).toBe(false);
    expect(result.calories).toBe(160);
    expect(result.protein).toBe(30);
    expect(result.caffeineMg).toBe(75);
  });

  it('requires and preserves a custom name for other beverages', () => {
    const result = normalizeBeverageEntryInput({
      amount: 12,
      unit: 'fl_oz',
      recordedAt: '2026-05-25T09:15',
      beverageType: 'other',
      displayName: 'LMNT Grapefruit',
      countsTowardHydration: false,
    });

    expect(result.displayName).toBe('LMNT Grapefruit');
  });

  it('rejects unnamed other beverages', () => {
    expect(() => normalizeBeverageEntryInput({
      amount: 12,
      unit: 'fl_oz',
      recordedAt: '2026-05-25T09:15',
      beverageType: 'other',
      displayName: '',
      countsTowardHydration: false,
    })).toThrow('Custom beverage name is required for Other');
  });

  it('keeps the local date key for late-night beverage entries near a UTC boundary', () => {
    const result = normalizeBeverageEntryInput({
      amount: 16,
      unit: 'fl_oz',
      recordedAt: '2026-05-25T22:16',
      beverageType: 'water',
    });

    expect(result.date).toBe('2026-05-25');
  });

  it('aggregates daily totals and computes adherence summaries', () => {
    const entries = [
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 16, date: '2026-05-25', calories: 0, protein: 0, carbs: 0, fat: 0 },
      { beverageType: 'protein_shake', countsTowardHydration: false, amountFlOz: 24, date: '2026-05-25', calories: 160, protein: 30, carbs: 6, fat: 3 },
      { beverageType: 'black_coffee', countsTowardHydration: true, amountFlOz: 32, date: '2026-05-26', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ];

    expect(aggregateWaterEntriesByDate(entries)).toEqual({
      '2026-05-25': {
        hydrationFlOz: 16,
        totalFluidsFlOz: 40,
        calories: 160,
        protein: 30,
        carbs: 6,
        fat: 3,
        caffeineMg: 0,
      },
      '2026-05-26': {
        hydrationFlOz: 30.4,
        totalFluidsFlOz: 32,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        caffeineMg: 0,
      },
    });

    const summary = summarizeWaterEntries(entries.filter((entry) => entry.date === '2026-05-25'), {
      weightKg: 104.8,
      preferredUnit: 'fl_oz',
      workoutCompleted: false,
    });

    expect(summary.totalFluidsFlOz).toBe(40);
    expect(summary.hydrationFlOz).toBe(16);
    expect(summary.targetFlOz).toBe(116);
    expect(summary.remainingFlOz).toBe(100);
    expect(summary.percentage).toBe(14);
    expect(summary.nutritionTotals).toEqual({
      calories: 160,
      protein: 30,
      carbs: 6,
      fat: 3,
    });
  });

  it('adds keto hydration helper guidance when applicable', () => {
    expect(getHydrationHelperCopy({ dietStyle: 'keto_flexible', workoutCompleted: true })).toEqual([
      'Hydration and electrolytes matter more during low-carb eating.',
      'Hydration totals weight beverages by type instead of treating every drink as full water.',
      'Training days usually need extra fluids to support performance and recovery.',
    ]);
  });

  it('uses hydration multipliers for beverages that count partially', () => {
    const summary = summarizeBeverageEntries([
      { beverageType: 'black_coffee', countsTowardHydration: true, amountFlOz: 20, calories: 0, protein: 0, carbs: 0, fat: 0 },
      { beverageType: 'diet_drink', countsTowardHydration: true, amountFlOz: 10, calories: 0, protein: 0, carbs: 0, fat: 0 },
      { beverageType: 'milk', countsTowardHydration: true, amountFlOz: 8, calories: 120, protein: 8, carbs: 12, fat: 5 },
    ], { weightKg: 104.8 });

    expect(summary.totalFluidsFlOz).toBe(38);
    expect(summary.hydrationFlOz).toBe(32);
    expect(summary.hydrationDetails).toEqual([
      expect.objectContaining({ beverageType: 'black_coffee', hydrationMultiplier: 0.95, hydrationContributionFlOz: 19 }),
      expect.objectContaining({ beverageType: 'diet_drink', hydrationMultiplier: 0.9, hydrationContributionFlOz: 9 }),
      expect.objectContaining({ beverageType: 'milk', hydrationMultiplier: 0.5, hydrationContributionFlOz: 4 }),
    ]);
  });

  it('updates hydration totals when a water entry is edited', () => {
    const original = summarizeBeverageEntries([
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 16, calories: 0, protein: 0, carbs: 0, fat: 0 },
    ], { weightKg: 104.8 });
    const updated = summarizeBeverageEntries([
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 24, calories: 0, protein: 0, carbs: 0, fat: 0 },
    ], { weightKg: 104.8 });

    expect(original.hydrationFlOz).toBe(16);
    expect(updated.hydrationFlOz).toBe(24);
    expect(updated.remainingFlOz).toBeLessThan(original.remainingFlOz);
  });

  it('updates hydration totals when a water entry is deleted', () => {
    const withTwoEntries = summarizeBeverageEntries([
      { beverageType: 'water', countsTowardHydration: true, amountFlOz: 16, calories: 0, protein: 0, carbs: 0, fat: 0 },
      { beverageType: 'black_coffee', countsTowardHydration: true, amountFlOz: 12, calories: 0, protein: 0, carbs: 0, fat: 0 },
    ], { weightKg: 104.8 });
    const afterDelete = summarizeBeverageEntries([
      { beverageType: 'black_coffee', countsTowardHydration: true, amountFlOz: 12, calories: 0, protein: 0, carbs: 0, fat: 0 },
    ], { weightKg: 104.8 });

    expect(withTwoEntries.hydrationFlOz).toBe(27.4);
    expect(afterDelete.hydrationFlOz).toBe(11.4);
  });

  it('updates macro totals when a beverage with macros is edited', () => {
    const original = calculateBeverageNutritionTotals([
      { beverageType: 'protein_shake', countsTowardHydration: false, amountFlOz: 12, calories: 160, protein: 30, carbs: 6, fat: 3 },
    ]);
    const updated = calculateBeverageNutritionTotals([
      { beverageType: 'protein_shake', countsTowardHydration: false, amountFlOz: 12, calories: 220, protein: 40, carbs: 8, fat: 5 },
    ]);

    expect(original).toEqual({ calories: 160, protein: 30, carbs: 6, fat: 3 });
    expect(updated).toEqual({ calories: 220, protein: 40, carbs: 8, fat: 5 });
  });

  it('removes beverage macros cleanly when a macro beverage is deleted', () => {
    const withBeverage = calculateBeverageNutritionTotals([
      { beverageType: 'protein_shake', countsTowardHydration: false, amountFlOz: 12, calories: 160, protein: 30, carbs: 6, fat: 3 },
    ]);
    const afterDelete = calculateBeverageNutritionTotals([]);

    expect(withBeverage).toEqual({ calories: 160, protein: 30, carbs: 6, fat: 3 });
    expect(afterDelete).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
