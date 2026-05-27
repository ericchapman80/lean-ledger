import { describe, expect, it } from 'vitest';
import {
  applyPortionDrivenMacroUpdate,
  createMealMacroSnapshot,
  getCalculatedMealMacros,
} from '@/lib/mealEditor.js';
import { calculateMealTotals } from '@/lib/mealTemplates.js';

const baseMeal = {
  portionAmount: 1,
  portionUnit: 'cup',
  portionGrams: 227,
  protein: 20,
  carbs: 9,
  fiber: 4,
  sugarAlcohols: 1,
  fat: 0,
  calories: 120,
};

describe('mealEditor helpers', () => {
  it('allows edited macro values to differ from the original snapshot', () => {
    const snapshot = createMealMacroSnapshot(baseMeal);
    const edited = {
      portionAmount: '1',
      portionUnit: 'cup',
      portionGrams: '227',
      protein: '24.5',
      carbs: '10',
      fat: '1.25',
      calories: '140',
    };

    expect(snapshot.protein).toBe(20);
    expect(edited.protein).toBe('24.5');
  });

  it('recalculates from the original saved values when portion changes and no manual override exists', () => {
    const snapshot = createMealMacroSnapshot(baseMeal);
    const updated = applyPortionDrivenMacroUpdate({
      portionAmount: '2',
      portionUnit: 'cup',
      portionGrams: '454',
      protein: '20',
      carbs: '9',
      fiber: '4',
      sugarAlcohols: '1',
      fat: '0',
      calories: '120',
    }, snapshot, false);

    expect(updated.protein).toBe('40');
    expect(updated.carbs).toBe('18');
    expect(updated.fiber).toBe('8');
    expect(updated.sugarAlcohols).toBe('2');
    expect(updated.netCarbs).toBe('8');
    expect(updated.calories).toBe('240');
  });

  it('preserves manual macro override when portion changes', () => {
    const snapshot = createMealMacroSnapshot(baseMeal);
    const updated = applyPortionDrivenMacroUpdate({
      portionAmount: '2',
      portionUnit: 'cup',
      portionGrams: '454',
      protein: '26',
      carbs: '13',
      fiber: '6',
      sugarAlcohols: '1',
      fat: '2',
      calories: '170',
    }, snapshot, true);

    expect(updated.protein).toBe('26');
    expect(updated.carbs).toBe('13');
    expect(updated.fiber).toBe('6');
    expect(updated.calories).toBe('170');
  });

  it('can reset back to calculated values from the snapshot', () => {
    const snapshot = createMealMacroSnapshot(baseMeal);
    const recalculated = getCalculatedMealMacros({
      portionAmount: '0.5',
      portionUnit: 'cup',
      portionGrams: '113.5',
    }, snapshot);

    expect(recalculated).toEqual({
      protein: '10',
      carbs: '4.5',
      fiber: '2',
      sugarAlcohols: '0.5',
      netCarbs: '2',
      fat: '0',
      calories: '60',
    });
  });

  it('falls back to the current form values when no snapshot exists', () => {
    expect(getCalculatedMealMacros({
      protein: '24',
      carbs: '8',
      fiber: '6',
      sugarAlcohols: '1',
      fat: '3',
      calories: '155',
    }, null)).toEqual({
      protein: '24',
      carbs: '8',
      fiber: '6',
      sugarAlcohols: '1',
      netCarbs: '1',
      fat: '3',
      calories: '155',
    });
  });

  it('recalculates from portion amount when grams are unavailable but units still match', () => {
    const snapshot = createMealMacroSnapshot({
      ...baseMeal,
      portionGrams: null,
    });

    expect(getCalculatedMealMacros({
      portionAmount: '1.5',
      portionUnit: 'cup',
    }, snapshot)).toEqual({
      protein: '30',
      carbs: '13.5',
      fiber: '6',
      sugarAlcohols: '1.5',
      netCarbs: '6',
      fat: '0',
      calories: '180',
    });
  });

  it('keeps original macros when no comparable portion values are available', () => {
    const snapshot = createMealMacroSnapshot(baseMeal);

    expect(getCalculatedMealMacros({
      portionAmount: '2',
      portionUnit: 'tablespoon',
      portionGrams: '',
    }, snapshot)).toEqual({
      protein: '20',
      carbs: '9',
      fiber: '4',
      sugarAlcohols: '1',
      netCarbs: '4',
      fat: '0',
      calories: '120',
    });
  });

  it('updates meal totals after an edited food value changes', () => {
    const totals = calculateMealTotals([
      { mealName: 'Edited Yogurt', protein: 24.5, carbs: 10, fiber: 8, sugarAlcohols: 0, fat: 1.25, calories: 140 },
      { mealName: 'Eggs', protein: 12, carbs: 1, fiber: 0, sugarAlcohols: 0, fat: 10, calories: 140 },
    ]);

    expect(totals).toEqual({
      protein: 36.5,
      carbs: 11,
      fiber: 8,
      sugarAlcohols: 0,
      netCarbs: 3,
      fat: 11.25,
      calories: 280,
    });
  });
});
