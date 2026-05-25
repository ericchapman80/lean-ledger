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
      fat: '0',
      calories: '120',
    }, snapshot, false);

    expect(updated.protein).toBe('40');
    expect(updated.carbs).toBe('18');
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
      fat: '2',
      calories: '170',
    }, snapshot, true);

    expect(updated.protein).toBe('26');
    expect(updated.carbs).toBe('13');
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
      fat: '0',
      calories: '60',
    });
  });

  it('updates meal totals after an edited food value changes', () => {
    const totals = calculateMealTotals([
      { mealName: 'Edited Yogurt', protein: 24.5, carbs: 10, fat: 1.25, calories: 140 },
      { mealName: 'Eggs', protein: 12, carbs: 1, fat: 10, calories: 140 },
    ]);

    expect(totals).toEqual({
      protein: 36.5,
      carbs: 11,
      fat: 11.3,
      calories: 280,
    });
  });
});
