import { describe, expect, it } from 'vitest';
import {
  buildPortionSummary,
  calculateMacrosForPortion,
  convertPortionToGrams,
  formatPortionAmount,
  inferFoodPortionProfile,
  parsePortionAmount,
} from '@/lib/foodPortions.js';

describe('parsePortionAmount', () => {
  it('parses decimals', () => {
    expect(parsePortionAmount('0.25')).toBe(0.25);
    expect(parsePortionAmount('1.5')).toBe(1.5);
  });

  it('parses fractions', () => {
    expect(parsePortionAmount('1/4')).toBe(0.25);
    expect(parsePortionAmount('1/2')).toBe(0.5);
    expect(parsePortionAmount('3/4')).toBe(0.75);
  });
});

describe('convertPortionToGrams', () => {
  const milkProduct = { name: 'Whole Milk', servingUnit: 'ml' };
  const meatProduct = { name: 'Chicken Breast' };

  it('converts liquid-friendly units to grams', () => {
    expect(convertPortionToGrams({ amount: 1, unit: 'cups', product: milkProduct })).toBeCloseTo(236.588, 3);
    expect(convertPortionToGrams({ amount: 2, unit: 'tablespoons', product: milkProduct })).toBeCloseTo(29.5736, 3);
    expect(convertPortionToGrams({ amount: 1, unit: 'fluid ounces', product: milkProduct })).toBeCloseTo(29.5735, 3);
  });

  it('converts solid units to grams', () => {
    expect(convertPortionToGrams({ amount: 1, unit: 'ounces', product: meatProduct })).toBeCloseTo(28.3495, 4);
    expect(convertPortionToGrams({ amount: 0.5, unit: 'pounds', product: meatProduct })).toBeCloseTo(226.796, 3);
  });
});

describe('inferFoodPortionProfile', () => {
  it('uses liquid defaults for milk', () => {
    const profile = inferFoodPortionProfile({ name: 'Whole Milk' });
    expect(profile.defaultUnit).toBe('cups');
    expect(profile.units).toContain('fluid ounces');
  });

  it('uses solid defaults for meat', () => {
    const profile = inferFoodPortionProfile({ name: 'Ground Beef 80/20' });
    expect(profile.defaultUnit).toBe('ounces');
    expect(profile.units).toContain('pounds');
  });
});

describe('calculateMacrosForPortion', () => {
  const milkProduct = {
    name: 'Whole Milk',
    servingUnit: 'ml',
    proteinPer100g: 3.4,
    carbsPer100g: 5,
    fatPer100g: 3.3,
    caloriesPer100g: 61,
  };

  const meatProduct = {
    name: 'Ground Beef',
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 15,
    caloriesPer100g: 243,
  };

  it('scales macros for liquid units', () => {
    const result = calculateMacrosForPortion(milkProduct, 1, 'cups');
    expect(result.portionGrams).toBeCloseTo(236.59, 2);
    expect(result.protein).toBeCloseTo(8.04, 2);
    expect(result.carbs).toBeCloseTo(11.83, 2);
  });

  it('scales macros for solid units', () => {
    const result = calculateMacrosForPortion(meatProduct, 0.5, 'pounds');
    expect(result.portionGrams).toBeCloseTo(226.8, 1);
    expect(result.protein).toBeCloseTo(58.97, 2);
    expect(result.fat).toBeCloseTo(34.02, 2);
  });

  it('preserves decimal precision for serving edits', () => {
    const product = {
      name: 'Protein Shake',
      servingGrams: 64,
      proteinPer100g: 18.7,
      carbsPer100g: 6.1,
      fatPer100g: 3.03,
      caloriesPer100g: 123.4,
    };

    const result = calculateMacrosForPortion(product, 0.5, 'serving');
    expect(result.portionGrams).toBe(32);
    expect(result.protein).toBe(5.98);
    expect(result.carbs).toBe(1.95);
    expect(result.fat).toBe(0.97);
    expect(result.calories).toBe(39);
  });

  it('supports fractional serving values with precise macro output', () => {
    const product = {
      name: 'Post Workout Shake',
      servingGrams: 48,
      proteinPer100g: 24.9,
      carbsPer100g: 8.1,
      fatPer100g: 4.2,
      caloriesPer100g: 169.2,
    };

    const amount = parsePortionAmount('3/4');
    const result = calculateMacrosForPortion(product, amount, 'serving');
    expect(result.portionGrams).toBe(36);
    expect(result.protein).toBe(8.96);
    expect(result.carbs).toBe(2.92);
    expect(result.fat).toBe(1.51);
    expect(result.calories).toBe(61);
  });
});

describe('buildPortionSummary', () => {
  it('formats helper text for UI display', () => {
    expect(formatPortionAmount(236.588)).toBe('236.59');
    expect(buildPortionSummary(2, 'tablespoons', 29.5736)).toEqual({
      label: '2 tablespoons',
      gramsLabel: '29.57g',
      helperText: '2 tablespoons ≈ 29.57g',
    });
  });
});
